const db = require('../config/database');
const AppError = require('../utils/AppError');
const { buildAccessFilter } = require('../utils/abac');
const { createNotification } = require('./notifications.controller');
const auditLog = require('../utils/auditLog');

const mapRecord = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  patientName: row.patient_name,
  doctorName: row.doctor_name,
  diagnosis: row.diagnosis,
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
      SELECT mr.id, mr.patient_id, mr.doctor_id, mr.diagnosis, mr.treatment, mr.notes, mr.created_at,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE ${clause}
      ORDER BY mr.created_at DESC`;

    const result = await db.query(query, params);

    auditLog({ userId: req.user.id, action: 'VIEW_MEDICAL_RECORDS', resourceType: 'medical_record', ip: req.ip });

    res.json({ status: 'success', data: result.rows.map(mapRecord) });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { patientId, diagnosis, treatment, notes } = req.body;

    if (!patientId || !diagnosis) {
      throw new AppError('patientId and diagnosis are required.', 400);
    }

    const doctorId = req.user.doctorId;
    if (!doctorId) throw new AppError('Only doctors can create medical records.', 403);

    // Verify patient and get doctor name in parallel
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

    const result = await db.query(
      `INSERT INTO medical_records (patient_id, doctor_id, diagnosis, treatment, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [patientId, doctorId, diagnosis, treatment || null, notes || null]
    );

    // Fire-and-forget notification
    createNotification({
      recipientId: patient.user_id,
      type: 'medical_record_created',
      title: 'New Medical Record',
      message: `${docName} added a new record: ${diagnosis}.`,
      referenceId: result.rows[0].id,
      referenceType: 'medical_record',
    });

    auditLog({ userId: req.user.id, action: 'CREATE_MEDICAL_RECORD', resourceType: 'medical_record', resourceId: result.rows[0].id, ip: req.ip, details: { patientId } });

    res.status(201).json({ status: 'success', data: { id: result.rows[0].id } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create };
