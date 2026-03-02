const db = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    let query;
    let params = [];

    const baseSelect = `
      SELECT mr.id, mr.patient_id, mr.doctor_id, mr.diagnosis, mr.treatment, mr.notes, mr.created_at,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id`;

    if (role === 'patient') {
      query = `${baseSelect}
        WHERE p.user_id = $1
        ORDER BY mr.created_at DESC`;
      params = [userId];
    } else {
      query = `${baseSelect} ORDER BY mr.created_at DESC`;
    }

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
