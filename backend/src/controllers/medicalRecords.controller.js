const db = require('../config/database');
const { buildAccessFilter } = require('../utils/abac');

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

    const records = result.rows.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      patientName: row.patient_name,
      doctorName: row.doctor_name,
      diagnosis: row.diagnosis,
      treatment: row.treatment,
      notes: row.notes,
      createdAt: row.created_at,
    }));

    res.json({ status: 'success', data: records });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll };
