const db = require('../config/database');
const AppError = require('../utils/AppError');
const { evaluateAccess } = require('../utils/abac');

/**
 * Resource type → SQL query to fetch a single row by ID.
 * Each query must return at least the ownership columns used in ABAC policies.
 */
const RESOURCE_QUERIES = {
  patient: {
    sql: 'SELECT id, user_id FROM patients WHERE id = $1',
  },
  appointment: {
    sql: `SELECT a.id, a.patient_id, a.doctor_id, a.status,
                 p.user_id AS patient_user_id, d.user_id AS doctor_user_id
          FROM appointments a
          JOIN patients p ON a.patient_id = p.id
          JOIN doctors d ON a.doctor_id = d.id
          WHERE a.id = $1`,
  },
  medical_record: {
    sql: `SELECT mr.id, mr.patient_id, mr.doctor_id,
                 p.user_id AS patient_user_id
          FROM medical_records mr
          JOIN patients p ON mr.patient_id = p.id
          WHERE mr.id = $1`,
  },
  prescription: {
    sql: `SELECT rx.id, rx.patient_id, rx.doctor_id, rx.status,
                 p.user_id AS patient_user_id
          FROM prescriptions rx
          JOIN patients p ON rx.patient_id = p.id
          WHERE rx.id = $1`,
  },
  lab_report: {
    sql: `SELECT lr.id, lr.patient_id, lr.technician_id,
                 p.user_id AS patient_user_id
          FROM lab_reports lr
          JOIN patients p ON lr.patient_id = p.id
          WHERE lr.id = $1`,
  },
};

/**
 * Middleware factory that enforces ABAC policies on a single resource.
 *
 * Usage: router.get('/:id', checkResourceAccess('patient'), controller)
 *
 * - Fetches the resource by req.params.id
 * - Evaluates ABAC policies using req.user (subject) and the resource row
 * - Attaches the fetched resource to req.resource for the controller to use
 * - Returns 404 if resource doesn't exist, 403 if access is denied
 *
 * @param {string} resourceType - key in RESOURCE_QUERIES
 * @param {string} [paramName='id'] - req.params key for the resource ID
 */
function checkResourceAccess(resourceType, paramName = 'id') {
  const config = RESOURCE_QUERIES[resourceType];
  if (!config) {
    throw new Error(`Unknown ABAC resource type: ${resourceType}`);
  }

  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      if (!resourceId) {
        return next(new AppError('Resource ID is required.', 400));
      }

      const result = await db.query(config.sql, [resourceId]);
      if (result.rows.length === 0) {
        return next(new AppError('Resource not found.', 404));
      }

      const resource = result.rows[0];
      const subject = {
        id: req.user.id,
        role: req.user.role,
        patientId: req.user.patientId,
        doctorId: req.user.doctorId,
        nurseId: req.user.nurseId,
        pharmacistId: req.user.pharmacistId,
      };

      const allowed = await evaluateAccess(resourceType, subject, resource);
      if (!allowed) {
        return next(new AppError('You do not have access to this resource.', 403));
      }

      req.resource = resource;
      next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { checkResourceAccess };
