const db = require('../config/database');
const AppError = require('./AppError');

/**
 * Check whether the requesting user is allowed to access a specific patient's data.
 *
 *  - Admin: all patients
 *  - Patient: own records only (matched by patientId on req.user)
 *  - Doctor: patients they have medical records, prescriptions, or appointments with
 *  - Nurse: patients treated by doctors in the same department
 *
 * @param {object} user - req.user with role, id, patientId, doctorId resolved by resolveSubject
 * @param {string} patientId - the patient UUID to check access for
 * @returns {Promise<boolean>}
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

/**
 * Build a SQL WHERE clause that restricts patient rows to only those
 * the requesting user has a relationship with.
 *
 * @param {object} user - req.user
 * @returns {{ clause: string, params: any[] }}
 */
function buildPatientAccessFilter(user) {
  if (user.role === 'admin') {
    return { clause: 'TRUE', params: [] }
  }

  if (user.role === 'patient') {
    return { clause: 'p.id = $1', params: [user.patientId] }
  }

  if (user.role === 'doctor') {
    return {
      clause: `p.id IN (
        SELECT mr.patient_id FROM medical_records mr WHERE mr.doctor_id = $1
        UNION SELECT rx.patient_id FROM prescriptions rx WHERE rx.doctor_id = $1
        UNION SELECT a.patient_id FROM appointments a WHERE a.doctor_id = $1
      )`,
      params: [user.doctorId],
    }
  }

  if (user.role === 'nurse') {
    return {
      clause: `p.id IN (
        SELECT DISTINCT a.patient_id FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE d.department = (SELECT n.department FROM nurses n WHERE n.user_id = $1)
      )`,
      params: [user.id],
    }
  }

  return { clause: 'FALSE', params: [] }
}

/**
 * Assert that the patient exists AND the user has access.
 * Checks access first to prevent patient ID enumeration (always returns 403 for
 * unauthorized users regardless of whether the patient exists).
 *
 * @param {object} user - req.user
 * @param {string} patientId - UUID
 * @throws {AppError} 403 if no access, 404 if patient not found
 */
async function assertPatientAccess(user, patientId) {
  if (!(await canAccessPatient(user, patientId))) {
    throw new AppError('You do not have access to this patient.', 403);
  }

  const result = await db.query('SELECT id FROM patients WHERE id = $1', [patientId]);
  if (result.rows.length === 0) {
    throw new AppError('Patient not found.', 404);
  }
}

module.exports = { canAccessPatient, buildPatientAccessFilter, assertPatientAccess };
