const db = require('../config/database');
const AppError = require('../utils/AppError');
const { maskSensitiveFields } = require('../utils/maskSensitiveFields');

const getAll = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT d.id, d.user_id, u.first_name, u.last_name, u.email, u.phone,
              d.specialization, d.license_number, d.department, d.available
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE u.is_active = true
       ORDER BY u.last_name, u.first_name`
    );

    const doctors = result.rows.map(mapDoctor);
    const isOwner = false; // list view is never self
    res.json({ status: 'success', data: maskSensitiveFields(doctors, req.user.role, isOwner) });
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctorResult = await db.query(
      `SELECT d.id, d.user_id, u.first_name, u.last_name, u.email, u.phone,
              d.specialization, d.license_number, d.department, d.available
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (doctorResult.rows.length === 0) {
      throw new AppError('Doctor not found.', 404);
    }

    const doctor = mapDoctor(doctorResult.rows[0]);
    const isOwner = req.user.id === doctorResult.rows[0].user_id;
    const maskedDoctor = maskSensitiveFields(doctor, req.user.role, isOwner);

    const [apptsResult, rxResult] = await Promise.all([
      db.query(
        `SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.status, a.notes,
                pu.first_name || ' ' || pu.last_name AS patient_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN users pu ON p.user_id = pu.id
         WHERE a.doctor_id = $1
         ORDER BY a.scheduled_at DESC`,
        [id]
      ),
      db.query(
        `SELECT rx.id, rx.patient_id, rx.doctor_id, rx.medication, rx.dosage,
                rx.frequency, rx.duration, rx.status, rx.created_at,
                pu.first_name || ' ' || pu.last_name AS patient_name
         FROM prescriptions rx
         JOIN patients p ON rx.patient_id = p.id
         JOIN users pu ON p.user_id = pu.id
         WHERE rx.doctor_id = $1
         ORDER BY rx.created_at DESC`,
        [id]
      ),
    ]);

    res.json({
      status: 'success',
      data: {
        doctor: maskedDoctor,
        appointments: apptsResult.rows.map((row) => ({
          id: row.id,
          patientId: row.patient_id,
          doctorId: row.doctor_id,
          patientName: row.patient_name,
          scheduledAt: row.scheduled_at,
          status: row.status,
          notes: row.notes,
        })),
        prescriptions: rxResult.rows.map((row) => ({
          id: row.id,
          patientId: row.patient_id,
          doctorId: row.doctor_id,
          patientName: row.patient_name,
          medication: row.medication,
          dosage: row.dosage,
          frequency: row.frequency,
          duration: row.duration,
          status: row.status,
          createdAt: row.created_at,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
};

function mapDoctor(row) {
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    specialization: row.specialization,
    licenseNumber: row.license_number,
    department: row.department,
    available: row.available,
  };
}

module.exports = { getAll, getById };
