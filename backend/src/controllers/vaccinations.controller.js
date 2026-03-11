const db = require('../config/database')
const AppError = require('../utils/AppError')

function mapVaccination(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    administeredBy: row.administered_by,
    administeredByName: row.administered_by_name || null,
    vaccineName: row.vaccine_name,
    doseNumber: row.dose_number,
    lotNumber: row.lot_number,
    manufacturer: row.manufacturer,
    site: row.site,
    scheduledDate: row.scheduled_date,
    administeredDate: row.administered_date,
    nextDoseDate: row.next_dose_date,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Check whether the requesting user is allowed to access a specific patient's vaccinations.
 *  - Admin: all patients
 *  - Patient: own records only
 *  - Doctor: patients they have medical records, prescriptions, or appointments with
 *  - Nurse: patients treated by doctors in the same department
 */
async function canAccessPatient(user, patientId) {
  if (user.role === 'admin') return true

  if (user.role === 'patient') {
    return patientId === user.patientId
  }

  if (user.role === 'doctor') {
    const rel = await db.query(
      `SELECT 1 FROM medical_records WHERE doctor_id = $1 AND patient_id = $2
       UNION SELECT 1 FROM prescriptions WHERE doctor_id = $1 AND patient_id = $2
       UNION SELECT 1 FROM appointments WHERE doctor_id = $1 AND patient_id = $2
       LIMIT 1`,
      [user.doctorId, patientId]
    )
    return rel.rows.length > 0
  }

  if (user.role === 'nurse') {
    const rel = await db.query(
      `SELECT 1 FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = $1
         AND d.department = (SELECT n.department FROM nurses n WHERE n.user_id = $2)
       LIMIT 1`,
      [patientId, user.id]
    )
    return rel.rows.length > 0
  }

  return false
}

const getByPatientId = async (req, res, next) => {
  try {
    const { patientId } = req.params

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s vaccination records.', 403)
    }

    const result = await db.query(
      `SELECT v.*,
              u.first_name || ' ' || u.last_name AS administered_by_name
       FROM vaccinations v
       LEFT JOIN users u ON u.id = v.administered_by
       WHERE v.patient_id = $1
       ORDER BY COALESCE(v.administered_date, v.scheduled_date) DESC, v.created_at DESC`,
      [patientId]
    )

    res.json({ status: 'success', data: result.rows.map(mapVaccination) })
  } catch (err) {
    return next(err)
  }
}

const getById = async (req, res, next) => {
  try {
    const { patientId, id } = req.params

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s vaccination records.', 403)
    }

    const result = await db.query(
      `SELECT v.*,
              u.first_name || ' ' || u.last_name AS administered_by_name
       FROM vaccinations v
       LEFT JOIN users u ON u.id = v.administered_by
       WHERE v.id = $1 AND v.patient_id = $2`,
      [id, patientId]
    )

    if (result.rows.length === 0) {
      throw new AppError('Vaccination record not found.', 404)
    }

    res.json({ status: 'success', data: mapVaccination(result.rows[0]) })
  } catch (err) {
    return next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const { patientId } = req.params
    const {
      vaccineName, doseNumber, lotNumber, manufacturer, site,
      scheduledDate, administeredDate, nextDoseDate, status, notes,
    } = req.body

    const patient = await db.query('SELECT id FROM patients WHERE id = $1', [patientId])
    if (patient.rows.length === 0) {
      throw new AppError('Patient not found.', 404)
    }

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s vaccination records.', 403)
    }

    const administeredBy = req.user.role !== 'patient' ? req.user.id : null

    const result = await db.query(
      `INSERT INTO vaccinations
         (patient_id, administered_by, vaccine_name, dose_number, lot_number,
          manufacturer, site, scheduled_date, administered_date, next_dose_date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        patientId, administeredBy, vaccineName, doseNumber || 1,
        lotNumber || null, manufacturer || null, site || null,
        scheduledDate || null, administeredDate || null, nextDoseDate || null,
        status || 'scheduled', notes || null,
      ]
    )

    res.status(201).json({ status: 'success', data: mapVaccination(result.rows[0]) })
  } catch (err) {
    return next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const { patientId, id } = req.params
    const {
      vaccineName, doseNumber, lotNumber, manufacturer, site,
      scheduledDate, administeredDate, nextDoseDate, status, notes,
    } = req.body

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s vaccination records.', 403)
    }

    const result = await db.query(
      `UPDATE vaccinations
       SET vaccine_name = COALESCE($1, vaccine_name),
           dose_number = COALESCE($2, dose_number),
           lot_number = COALESCE($3, lot_number),
           manufacturer = COALESCE($4, manufacturer),
           site = COALESCE($5, site),
           scheduled_date = COALESCE($6, scheduled_date),
           administered_date = COALESCE($7, administered_date),
           next_dose_date = COALESCE($8, next_dose_date),
           status = COALESCE($9, status),
           notes = COALESCE($10, notes),
           updated_at = NOW()
       WHERE id = $11 AND patient_id = $12
       RETURNING *`,
      [
        vaccineName, doseNumber, lotNumber, manufacturer, site,
        scheduledDate, administeredDate, nextDoseDate, status, notes,
        id, patientId,
      ]
    )

    if (result.rows.length === 0) {
      throw new AppError('Vaccination record not found.', 404)
    }

    res.json({ status: 'success', data: mapVaccination(result.rows[0]) })
  } catch (err) {
    return next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    const { patientId, id } = req.params

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s vaccination records.', 403)
    }

    const result = await db.query(
      'DELETE FROM vaccinations WHERE id = $1 AND patient_id = $2 RETURNING id',
      [id, patientId]
    )

    if (result.rows.length === 0) {
      throw new AppError('Vaccination record not found.', 404)
    }

    res.json({ status: 'success', message: 'Vaccination record removed.' })
  } catch (err) {
    return next(err)
  }
}

module.exports = { getByPatientId, getById, create, update, remove }
