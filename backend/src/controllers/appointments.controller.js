const db = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    let query;
    let params = [];

    const baseSelect = `
      SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.status, a.notes,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id`;

    if (role === 'patient') {
      query = `${baseSelect}
        WHERE p.user_id = $1
        ORDER BY a.scheduled_at DESC`;
      params = [userId];
    } else if (role === 'doctor') {
      query = `${baseSelect}
        WHERE d.user_id = $1
        ORDER BY a.scheduled_at DESC`;
      params = [userId];
    } else {
      query = `${baseSelect} ORDER BY a.scheduled_at DESC`;
    }

    const result = await db.query(query, params);

    const appointments = result.rows.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      patientName: row.patient_name,
      doctorName: row.doctor_name,
      scheduledAt: row.scheduled_at,
      status: row.status,
      notes: row.notes,
    }));

    res.json({ status: 'success', data: appointments });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll };
