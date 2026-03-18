const db = require('../config/database')
const AppError = require('../utils/AppError')
const { createNotification } = require('./notifications.controller')
const auditLog = require('../utils/auditLog')
const { isRefillEligible } = require('../utils/refillEligibility')
const { uploadPrescriptionImageToS3, getPresignedImageUrl } = require('../middleware/upload')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const mapPrescription = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  patientName: row.patient_name,
  doctorName: row.doctor_name,
  medication: row.medication,
  dosage: row.dosage,
  frequency: row.frequency,
  duration: row.duration,
  status: row.status,
  type: row.type || 'digital',
  notes: row.notes,
  imageUrl: row.image_key || null,
  createdAt: row.created_at,
  pendingRefill: row.pending_refill ?? false,
})

const getAll = async (req, res, next) => {
  try {
    const { role } = req.user
    let clause
    let params

    if (role === 'admin' || role === 'pharmacist') {
      // Admin and pharmacist see all prescriptions
      clause = 'TRUE'
      params = []
    } else if (role === 'patient') {
      // Patients see only their own prescriptions
      clause = 'rx.patient_id = $1'
      params = [req.user.patientId]
    } else if (role === 'doctor') {
      // Doctors see prescriptions for any patient they have treated (via appointments)
      clause = `(rx.doctor_id = $1 OR rx.patient_id IN (
        SELECT DISTINCT a.patient_id FROM appointments a WHERE a.doctor_id = $1
      ))`
      params = [req.user.doctorId]
    } else if (role === 'nurse') {
      // Nurses see prescriptions for patients treated by doctors in their department
      clause = `rx.patient_id IN (
        SELECT DISTINCT a.patient_id FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE d.department = (SELECT n.department FROM nurses n WHERE n.user_id = $1)
      )`
      params = [req.user.id]
    } else {
      clause = 'FALSE'
      params = []
    }

    const query = `
      SELECT rx.id, rx.patient_id, rx.doctor_id, rx.medication, rx.dosage,
             rx.frequency, rx.duration, rx.status, rx.type, rx.notes, rx.image_key, rx.created_at,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name,
             EXISTS (
               SELECT 1 FROM prescription_refill_requests rr
               WHERE rr.prescription_id = rx.id AND rr.status = 'pending'
             ) AS pending_refill
      FROM prescriptions rx
      JOIN patients p ON rx.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctors d ON rx.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE ${clause}
      ORDER BY rx.created_at DESC`

    const result = await db.query(query, params)

    // Fetch prescription items for digital prescriptions
    const rxIds = result.rows.map((r) => r.id)
    let itemsMap = {}
    if (rxIds.length > 0) {
      const items = await db.query(
        `SELECT id, prescription_id, medicine_id, medication, dosage, frequency, duration, instructions, sort_order
         FROM prescription_items WHERE prescription_id = ANY($1) ORDER BY sort_order`,
        [rxIds]
      )
      for (const item of items.rows) {
        if (!itemsMap[item.prescription_id]) itemsMap[item.prescription_id] = []
        itemsMap[item.prescription_id].push({
          id: item.id,
          medicineId: item.medicine_id,
          medication: item.medication,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          sortOrder: item.sort_order,
        })
      }
    }

    // Generate presigned URLs for handwritten prescription images
    const data = await Promise.all(
      result.rows.map(async (row) => {
        const mapped = mapPrescription(row)
        mapped.items = itemsMap[row.id] || []
        if (row.image_key) {
          mapped.imageUrl = await getPresignedImageUrl(row.image_key)
        }
        mapped.refillEligible =
          ['active', 'expired'].includes(row.status) && isRefillEligible(row.created_at, row.duration)
        return mapped
      })
    )

    await auditLog({
      userId: req.user.id,
      action: 'VIEW_PRESCRIPTIONS',
      resourceType: 'prescription',
      ip: req.ip,
    })

    res.json({ status: 'success', data })
  } catch (err) {
    return next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const { patientId, type = 'digital', notes, chronicConditionId } = req.body

    if (!patientId) throw new AppError('patientId is required.', 400)

    const doctorId = req.user.doctorId
    if (!doctorId) throw new AppError('Only doctors can create prescriptions.', 403)

    const [patientCheck, doctorInfo] = await Promise.all([
      db.query(
        `SELECT p.id, u.id AS user_id, u.first_name, u.last_name
         FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
        [patientId]
      ),
      db.query(
        `SELECT u.first_name, u.last_name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
        [doctorId]
      ),
    ])
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404)
    const patient = patientCheck.rows[0]
    const docName = doctorInfo.rows[0]
      ? `Dr. ${doctorInfo.rows[0].first_name} ${doctorInfo.rows[0].last_name}`
      : 'Your doctor'

    let validConditionId = null
    if (chronicConditionId) {
      if (!UUID_RE.test(chronicConditionId)) {
        throw new AppError('chronicConditionId must be a valid UUID.', 400)
      }
      const ccCheck = await db.query(
        'SELECT id FROM chronic_conditions WHERE id = $1 AND patient_id = $2',
        [chronicConditionId, patientId]
      )
      if (ccCheck.rowCount === 0) {
        throw new AppError('Chronic condition not found for this patient.', 400)
      }
      validConditionId = chronicConditionId
    }

    if (type === 'handwritten') {
      // Handwritten mode: photo upload
      if (!req.file) throw new AppError('Prescription image is required for handwritten prescriptions.', 400)

      const imageKey = await uploadPrescriptionImageToS3(req.file, patientId)

      const result = await db.query(
        `INSERT INTO prescriptions (patient_id, doctor_id, medication, dosage, frequency, duration, type, notes, image_key, chronic_condition_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          patientId,
          doctorId,
          req.body.medication || 'Handwritten Prescription',
          req.body.dosage || 'See image',
          req.body.frequency || 'See image',
          req.body.duration || null,
          'handwritten',
          notes?.trim() || null,
          imageKey,
          validConditionId,
        ]
      )

      createNotification({
        recipientId: patient.user_id,
        type: 'prescription_created',
        title: 'New Prescription',
        message: `${docName} wrote you a new prescription.`,
        referenceId: result.rows[0].id,
        referenceType: 'prescription',
      })

      await auditLog({
        userId: req.user.id,
        action: 'CREATE_PRESCRIPTION',
        resourceType: 'prescription',
        resourceId: result.rows[0].id,
        ip: req.ip,
        details: { patientId, type: 'handwritten' },
      })

      res.status(201).json({ status: 'success', data: { id: result.rows[0].id } })
    } else {
      // Digital mode: structured medicines
      let items
      try {
        items = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items
      } catch {
        items = req.body.items
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('At least one medicine item is required for digital prescriptions.', 400)
      }

      for (const item of items) {
        if (!item.medication || !item.dosage || !item.frequency) {
          throw new AppError('Each item requires medication, dosage, and frequency.', 400)
        }
      }

      const primary = items[0]
      const client = await db.getClient()
      let prescriptionId
      try {
        await client.query('BEGIN')

        const result = await client.query(
          `INSERT INTO prescriptions (patient_id, doctor_id, medication, dosage, frequency, duration, type, notes, chronic_condition_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [
            patientId,
            doctorId,
            primary.medication.trim(),
            primary.dosage.trim(),
            primary.frequency.trim(),
            primary.duration?.trim() || null,
            'digital',
            notes?.trim() || null,
            validConditionId,
          ]
        )
        prescriptionId = result.rows[0].id

        // Bulk insert all items
        const values = []
        const params = []
        items.forEach((item, i) => {
          const offset = i * 8
          values.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
          )
          params.push(
            prescriptionId,
            item.medicineId || null,
            item.medication.trim(),
            item.dosage.trim(),
            item.frequency.trim(),
            item.duration?.trim() || null,
            item.instructions?.trim() || null,
            i
          )
        })
        await client.query(
          `INSERT INTO prescription_items (prescription_id, medicine_id, medication, dosage, frequency, duration, instructions, sort_order)
           VALUES ${values.join(', ')}`,
          params
        )

        await client.query('COMMIT')
      } catch (txErr) {
        await client.query('ROLLBACK').catch(() => {})
        throw txErr
      } finally {
        client.release()
      }

      const medList =
        items.length === 1
          ? `${primary.medication} (${primary.dosage}, ${primary.frequency})`
          : `${items.length} medicines including ${primary.medication}`

      createNotification({
        recipientId: patient.user_id,
        type: 'prescription_created',
        title: 'New Prescription',
        message: `${docName} prescribed ${medList}.`,
        referenceId: prescriptionId,
        referenceType: 'prescription',
      })

      await auditLog({
        userId: req.user.id,
        action: 'CREATE_PRESCRIPTION',
        resourceType: 'prescription',
        resourceId: prescriptionId,
        ip: req.ip,
        details: { patientId, medication: primary.medication, itemCount: items.length },
      })

      res.status(201).json({ status: 'success', data: { id: prescriptionId } })
    }
  } catch (err) {
    return next(err)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['dispensed', 'cancelled']
    if (!validStatuses.includes(status)) {
      throw new AppError(`status must be one of: ${validStatuses.join(', ')}`, 400)
    }

    const existing = await db.query(
      `SELECT rx.id, rx.patient_id, rx.doctor_id, rx.medication,
              d.user_id AS doctor_user_id
       FROM prescriptions rx
       LEFT JOIN doctors d ON rx.doctor_id = d.id
       WHERE rx.id = $1`,
      [id]
    )
    if (existing.rows.length === 0) throw new AppError('Prescription not found.', 404)
    const rx = existing.rows[0]

    const userId = req.user.id
    const isDoctor = userId === rx.doctor_user_id
    if (!isDoctor && !['pharmacist', 'admin'].includes(req.user.role)) {
      throw new AppError('You do not have permission to update this prescription.', 403)
    }

    const result = await db.query(
      `UPDATE prescriptions SET status = $1 WHERE id = $2 RETURNING id, status`,
      [status, id]
    )

    const patientResult = await db.query(
      `SELECT u.id AS user_id FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [rx.patient_id]
    )

    if (patientResult.rows[0]) {
      const notifType = status === 'dispensed' ? 'prescription_dispensed' : 'system'
      const title = status === 'dispensed' ? 'Prescription Dispensed' : 'Prescription Cancelled'
      const verb = status === 'dispensed' ? 'dispensed' : 'cancelled'

      createNotification({
        recipientId: patientResult.rows[0].user_id,
        type: notifType,
        title,
        message: `Your prescription for ${rx.medication} has been ${verb}.`,
        referenceId: id,
        referenceType: 'prescription',
      })
    }

    await auditLog({
      userId: req.user.id,
      action: 'UPDATE_PRESCRIPTION_STATUS',
      resourceType: 'prescription',
      resourceId: id,
      ip: req.ip,
      details: { status, medication: rx.medication },
    })

    res.json({ status: 'success', data: { id: result.rows[0].id, status: result.rows[0].status } })
  } catch (err) {
    return next(err)
  }
}

module.exports = { getAll, create, updateStatus }
