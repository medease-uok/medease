const db = require('../config/database');
const AppError = require('../utils/AppError');
const { maskSensitiveFields } = require('../utils/maskSensitiveFields');

const getAll = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT d.id, d.user_id, u.first_name, u.last_name, u.email, u.phone,
              d.specialization, d.license_number, d.department, d.available, d.gender
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE u.is_active = true
       ORDER BY u.last_name, u.first_name`
    );

    const doctors = result.rows.map(mapDoctor);
    const isOwner = false;
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
              d.specialization, d.license_number, d.department, d.available, d.gender
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
    gender: row.gender || null,
  };
}

const getStatistics = async (req, res, next) => {
  try {
    const [
      totalResult,
      departmentResult,
      genderResult,
      availabilityResult,
      appointmentStatsResult,
      topDoctorsResult,
    ] = await Promise.all([
      db.query(`
        SELECT COUNT(*) AS total_doctors
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE u.is_active = true
      `),

      db.query(`
        SELECT d.department, COUNT(*) AS count
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE u.is_active = true
        GROUP BY d.department
        ORDER BY count DESC
      `),

      db.query(`
        SELECT COALESCE(d.gender, 'Not specified') AS gender, COUNT(*) AS count
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE u.is_active = true
        GROUP BY d.gender
        ORDER BY count DESC
      `),

      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE d.available = true) AS available,
          COUNT(*) FILTER (WHERE d.available = false) AS unavailable
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE u.is_active = true
      `),

      db.query(`
        SELECT
          COUNT(*) AS total_appointments,
          COUNT(*) FILTER (WHERE a.status = 'completed') AS completed,
          COUNT(*) FILTER (WHERE a.status IN ('scheduled', 'confirmed')) AS upcoming,
          COUNT(*) FILTER (WHERE a.status = 'cancelled') AS cancelled,
          COUNT(DISTINCT a.patient_id) AS total_patients
        FROM appointments a
      `),

      db.query(`
        SELECT d.id, u.first_name, u.last_name, d.specialization, d.department, d.gender,
               COUNT(a.id) AS appointment_count,
               COUNT(DISTINCT a.patient_id) AS patient_count
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN appointments a ON a.doctor_id = d.id
        WHERE u.is_active = true
        GROUP BY d.id, u.first_name, u.last_name, d.specialization, d.department, d.gender
        ORDER BY appointment_count DESC
        LIMIT 10
      `),
    ]);

    res.json({
      status: 'success',
      data: {
        totalDoctors: parseInt(totalResult.rows[0].total_doctors, 10),
        byDepartment: departmentResult.rows.map((r) => ({
          department: r.department,
          count: parseInt(r.count, 10),
        })),
        byGender: genderResult.rows.map((r) => ({
          gender: r.gender,
          count: parseInt(r.count, 10),
        })),
        availability: {
          available: parseInt(availabilityResult.rows[0].available, 10),
          unavailable: parseInt(availabilityResult.rows[0].unavailable, 10),
        },
        appointmentStats: {
          total: parseInt(appointmentStatsResult.rows[0].total_appointments, 10),
          completed: parseInt(appointmentStatsResult.rows[0].completed, 10),
          upcoming: parseInt(appointmentStatsResult.rows[0].upcoming, 10),
          cancelled: parseInt(appointmentStatsResult.rows[0].cancelled, 10),
          totalPatients: parseInt(appointmentStatsResult.rows[0].total_patients, 10),
        },
        topDoctors: topDoctorsResult.rows.map((r) => ({
          id: r.id,
          firstName: r.first_name,
          lastName: r.last_name,
          specialization: r.specialization,
          department: r.department,
          gender: r.gender,
          appointmentCount: parseInt(r.appointment_count, 10),
          patientCount: parseInt(r.patient_count, 10),
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, getStatistics };
