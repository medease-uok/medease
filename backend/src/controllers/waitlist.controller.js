const db = require('../config/database')
const AppError = require('../utils/AppError')
const { createNotification } = require('./notifications.controller')
const auditLog = require('../utils/auditLog')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const mapEntry = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  patientName: row.patient_name || undefined,
  doctorName: row.doctor_name || undefined,
  doctorSpecialization: row.doctor_specialization || undefined,
  doctorDepartment: row.doctor_department || undefined,
  preferredDate: row.preferred_date,
  preferredTime: row.preferred_time || null,
  notes: row.notes || null,
  status: row.status,
  notifiedAt: row.notified_at || null,
  createdAt: row.created_at,
})

/**
 * GET /waitlist
 * - patient: own entries
 * - doctor: entries for their doctor profile
 * - admin/nurse: all entries (optionally filtered by ?doctorId= or ?patientId=)
 */
const getAll = async (req, res, next) => {
  try {
    const { role } = req.user
    const { status, doctorId: qDoctorId, patientId: qPatientId } = req.query

    const conditions = []
    const params = []

    if (role === 'patient') {
      if (!req.user.patientId) throw new AppError('Patient profile not found.', 404)
      conditions.push(`w.patient_id = $${params.length + 1}`)
      params.push(req.user.patientId)
    } else if (role === 'doctor') {
      if (!req.user.doctorId) throw new AppError('Doctor profile not found.', 404)
      conditions.push(`w.doctor_id = $${params.length + 1}`)
      params.push(req.user.doctorId)
    } else {
      // admin / nurse: optional filters
      if (qDoctorId) {
        if (!UUID_REGEX.test(qDoctorId)) throw new AppError('Invalid doctorId.', 400)
        conditions.push(`w.doctor_id = $${params.length + 1}`)
        params.push(qDoctorId)
      }
      if (qPatientId) {
        if (!UUID_REGEX.test(qPatientId)) throw new AppError('Invalid patientId.', 400)
        conditions.push(`w.patient_id = $${params.length + 1}`)
        params.push(qPatientId)
      }
    }

    if (status) {
      const valid = ['pending', 'notified', 'booked', 'cancelled', 'expired']
      if (!valid.includes(status)) throw new AppError(`status must be one of: ${valid.join(', ')}`, 400)
      conditions.push(`w.status = $${params.length + 1}`)
      params.push(status)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await db.query(
      `SELECT w.*,
              pu.first_name || ' ' || pu.last_name AS patient_name,
              'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name,
              d.specialization AS doctor_specialization,
              d.department AS doctor_department
       FROM appointment_waitlist w
       JOIN patients p ON w.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN doctors d ON w.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       ${where}
       ORDER BY w.preferred_date ASC, w.created_at ASC`,
      params
    )

    res.json({ status: 'success', data: result.rows.map(mapEntry) })
  } catch (err) {
    return next(err)
  }
}

/**
 * POST /waitlist
 * Join the waitlist. Patients can only join for themselves.
 * Staff/admin can add a patient by supplying patientId.
 */
const create = async (req, res, next) => {
  try {
    const { doctorId, preferredDate, preferredTime, notes } = req.body

    if (!doctorId || !preferredDate) {
      throw new AppError('doctorId and preferredDate are required.', 400)
    }
    if (!UUID_REGEX.test(doctorId)) throw new AppError('Invalid doctorId.', 400)

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      throw new AppError('preferredDate must be in YYYY-MM-DD format.', 400)
    }
    const date = new Date(preferredDate)
    if (isNaN(date.getTime())) throw new AppError('Invalid preferredDate.', 400)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    if (date < today) throw new AppError('preferredDate must be today or in the future.', 400)

    // Validate optional time
    if (preferredTime && !/^\d{2}:\d{2}$/.test(preferredTime)) {
      throw new AppError('preferredTime must be in HH:MM format.', 400)
    }

    // Resolve patientId
    let patientId = req.body.patientId
    if (req.user.role === 'patient') {
      if (!req.user.patientId) throw new AppError('Patient profile not found.', 404)
      patientId = req.user.patientId
    } else if (['doctor', 'nurse', 'admin'].includes(req.user.role)) {
      if (!patientId) throw new AppError('patientId is required.', 400)
      if (!UUID_REGEX.test(patientId)) throw new AppError('Invalid patientId.', 400)
    } else {
      throw new AppError('You do not have permission to join a waitlist.', 403)
    }

    // Verify doctor exists
    const doctorCheck = await db.query(
      `SELECT d.id, u.first_name, u.last_name, d.specialization
       FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
      [doctorId]
    )
    if (doctorCheck.rows.length === 0) throw new AppError('Doctor not found.', 404)
    const doctor = doctorCheck.rows[0]

    // Verify patient exists
    const patientCheck = await db.query(
      `SELECT p.id, u.id AS user_id, u.first_name, u.last_name
       FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [patientId]
    )
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404)
    const patient = patientCheck.rows[0]

    // Check doctor has a schedule on that day (must be available in principle)
    const dayOfWeek = date.getUTCDay()
    const scheduleCheck = await db.query(
      'SELECT id FROM doctor_schedules WHERE doctor_id = $1 AND day_of_week = $2 AND is_active = true',
      [doctorId, dayOfWeek]
    )
    if (scheduleCheck.rows.length === 0) {
      throw new AppError('Doctor is not available on this day. Cannot join waitlist.', 400)
    }

    // Insert (unique constraint prevents duplicate entries for same patient+doctor+date)
    let entryId
    try {
      const result = await db.query(
        `INSERT INTO appointment_waitlist (patient_id, doctor_id, preferred_date, preferred_time, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [patientId, doctorId, preferredDate, preferredTime || null, notes?.trim() || null]
      )
      entryId = result.rows[0].id
    } catch (err) {
      if (err.code === '23505') {
        // Unique violation: already on waitlist
        throw new AppError('You are already on the waitlist for this doctor on this date.', 409)
      }
      throw err
    }

    await auditLog({
      userId: req.user.id,
      action: 'JOIN_WAITLIST',
      resourceType: 'waitlist',
      resourceId: entryId,
      ip: req.ip,
      details: { patientId, doctorId, preferredDate },
    })

    // Notify the patient
    createNotification({
      recipientId: patient.user_id,
      type: 'appointment_scheduled',
      title: 'Added to Waitlist',
      message: `You have been added to the waitlist for Dr. ${doctor.first_name} ${doctor.last_name} on ${preferredDate}.`,
      referenceId: entryId,
      referenceType: 'waitlist',
    }).catch((err) => console.error('Failed to send waitlist join notification', err.message))

    res.status(201).json({ status: 'success', data: { id: entryId } })
  } catch (err) {
    return next(err)
  }
}

/**
 * DELETE /waitlist/:id
 * Cancel a waitlist entry. Patients can cancel own entries; admin can cancel any.
 */
const cancel = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!UUID_REGEX.test(id)) throw new AppError('Invalid waitlist entry ID.', 400)

    const existing = await db.query(
      `SELECT w.id, w.status, w.doctor_id, w.patient_id, p.user_id AS patient_user_id
       FROM appointment_waitlist w
       JOIN patients p ON w.patient_id = p.id
       WHERE w.id = $1`,
      [id]
    )
    if (existing.rows.length === 0) throw new AppError('Waitlist entry not found.', 404)
    const entry = existing.rows[0]

    // Ownership checks
    if (req.user.role === 'patient' && req.user.id !== entry.patient_user_id) {
      throw new AppError('You do not have permission to cancel this waitlist entry.', 403)
    }
    if (req.user.role === 'doctor' && req.user.doctorId !== entry.doctor_id) {
      throw new AppError('You do not have permission to cancel this waitlist entry.', 403)
    }

    if (['cancelled', 'booked', 'expired'].includes(entry.status)) {
      throw new AppError(`Cannot cancel an entry with status '${entry.status}'.`, 400)
    }

    await db.query(
      `UPDATE appointment_waitlist SET status = 'cancelled' WHERE id = $1`,
      [id]
    )

    await auditLog({
      userId: req.user.id,
      action: 'CANCEL_WAITLIST_ENTRY',
      resourceType: 'waitlist',
      resourceId: id,
      ip: req.ip,
    })

    res.json({ status: 'success', data: { id, status: 'cancelled' } })
  } catch (err) {
    return next(err)
  }
}

/**
 * Called internally when an appointment is cancelled.
 * Finds the oldest pending waitlist entry for the same doctor+date and notifies the patient.
 */
const notifyWaitlistOnCancellation = async (doctorId, scheduledAt) => {
  try {
    const cancelledDate = new Date(scheduledAt).toISOString().split('T')[0]

    const result = await db.query(
      `SELECT w.id, w.patient_id, p.user_id AS patient_user_id,
              pu.first_name, pu.last_name,
              d.user_id AS doctor_user_id,
              du.first_name AS doctor_first_name, du.last_name AS doctor_last_name
       FROM appointment_waitlist w
       JOIN patients p ON w.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN doctors d ON w.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       WHERE w.doctor_id = $1
         AND w.preferred_date = $2
         AND w.status = 'pending'
       ORDER BY w.created_at ASC
       LIMIT 1`,
      [doctorId, cancelledDate]
    )

    if (result.rows.length === 0) return

    const entry = result.rows[0]

    // Update status to notified
    await db.query(
      `UPDATE appointment_waitlist SET status = 'notified', notified_at = NOW() WHERE id = $1`,
      [entry.id]
    )

    await createNotification({
      recipientId: entry.patient_user_id,
      type: 'waitlist_slot_available',
      title: 'Slot Available — Waitlist',
      message: `A slot has opened up for Dr. ${entry.doctor_first_name} ${entry.doctor_last_name} on ${cancelledDate}. Book now before it fills up!`,
      referenceId: entry.id,
      referenceType: 'waitlist',
    })
  } catch (err) {
    console.error('Failed to notify waitlist on cancellation:', err.message)
  }
}

module.exports = { getAll, create, cancel, notifyWaitlistOnCancellation }
