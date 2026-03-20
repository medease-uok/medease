const db = require('../config/database');
const AppError = require('../utils/AppError');
const { buildAccessFilter } = require('../utils/abac');
const { createNotification } = require('./notifications.controller');
const auditLog = require('../utils/auditLog');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapRecord = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  patientName: row.patient_name,
  doctorName: row.doctor_name,
  diagnosis: row.diagnosis,
  icdCode: row.icd_code || null,
  icdDescription: row.icd_description || null,
  treatment: row.treatment,
  notes: row.notes,
  createdAt: row.created_at,
});

const getAll = async (req, res, next) => {
  try {
    const subject = {
      id: req.user.id,
      role: req.user.role,
      patientId: req.user.patientId,
      doctorId: req.user.doctorId,
    };

    const columnMap = {
      patient_id: 'mr.patient_id',
      doctor_id: 'mr.doctor_id',
    };

    const { clause, params } = await buildAccessFilter('medical_record', subject, columnMap);

    const query = `
      SELECT mr.id, mr.patient_id, mr.doctor_id, mr.diagnosis, mr.icd_code,
             ic.description AS icd_description,
             mr.treatment, mr.notes, mr.created_at,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN icd10_codes ic ON mr.icd_code = ic.code
      WHERE ${clause}
      ORDER BY mr.created_at DESC`;

    const result = await db.query(query, params);

    await auditLog({ userId: req.user.id, action: 'VIEW_MEDICAL_RECORDS', resourceType: 'medical_record', ip: req.ip });

    res.json({ status: 'success', data: result.rows.map(mapRecord) });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { patientId, diagnosis, treatment, notes, chronicConditionId, icdCode } = req.body;

    if (!patientId || !diagnosis) {
      throw new AppError('patientId and diagnosis are required.', 400);
    }

    const doctorId = req.user.doctorId;
    if (!doctorId) throw new AppError('Only doctors can create medical records.', 403);

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
    ]);
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404);
    const patient = patientCheck.rows[0];
    const docName = doctorInfo.rows[0]
      ? `Dr. ${doctorInfo.rows[0].first_name} ${doctorInfo.rows[0].last_name}`
      : 'Your doctor';

    let validConditionId = null;
    if (chronicConditionId) {
      if (!UUID_RE.test(chronicConditionId)) {
        throw new AppError('chronicConditionId must be a valid UUID.', 400);
      }
      const ccCheck = await db.query(
        'SELECT id FROM chronic_conditions WHERE id = $1 AND patient_id = $2',
        [chronicConditionId, patientId]
      );
      if (ccCheck.rowCount === 0) {
        throw new AppError('Chronic condition not found for this patient.', 400);
      }
      validConditionId = chronicConditionId;
    }

    // Validate ICD-10 code if provided
    let validIcdCode = null;
    if (icdCode && icdCode.trim()) {
      const icdCheck = await db.query('SELECT code FROM icd10_codes WHERE code = $1', [icdCode.trim()]);
      if (icdCheck.rowCount === 0) {
        throw new AppError('Invalid ICD-10 code.', 400);
      }
      validIcdCode = icdCode.trim();
    }

    const result = await db.query(
      `INSERT INTO medical_records (patient_id, doctor_id, diagnosis, treatment, notes, chronic_condition_id, icd_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [patientId, doctorId, diagnosis, treatment || null, notes || null, validConditionId, validIcdCode]
    );

    createNotification({
      recipientId: patient.user_id,
      type: 'medical_record_created',
      title: 'New Medical Record',
      message: `${docName} added a new record: ${diagnosis}.`,
      referenceId: result.rows[0].id,
      referenceType: 'medical_record',
    });

    await auditLog({ userId: req.user.id, action: 'CREATE_MEDICAL_RECORD', resourceType: 'medical_record', resourceId: result.rows[0].id, ip: req.ip, details: { patientId } });

    res.status(201).json({ status: 'success', data: { id: result.rows[0].id } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create };
