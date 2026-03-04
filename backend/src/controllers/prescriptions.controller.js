const db = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    let query;
    let params = [];

    const baseSelect = `
      SELECT rx.id, rx.patient_id, rx.doctor_id, rx.medication, rx.dosage,
             rx.frequency, rx.duration, rx.status, rx.created_at,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
      FROM prescriptions rx
      JOIN patients p ON rx.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctors d ON rx.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id`;

    if (role === 'patient') {
      query = `${baseSelect}
        WHERE p.user_id = $1
        ORDER BY rx.created_at DESC`;
      params = [userId];
    } else {
      query = `${baseSelect} ORDER BY rx.created_at DESC`;
    }

    const result = await db.query(query, params);

    const prescriptions = result.rows.map((row) => ({
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
      createdAt: row.created_at,
    }));

    res.json({ status: 'success', data: prescriptions });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll };
