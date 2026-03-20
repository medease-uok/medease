const db = require('../config/database');
const AppError = require('../utils/AppError');
const { maskSensitiveFields } = require('../utils/maskSensitiveFields');
const { getPresignedImageUrl } = require('../middleware/upload');

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

    let apptPatientFilter = '';
    const apptParams = [id];

    // For prescriptions, doctors need to see all meds for their shared patients
    let rxQuery;
    let rxParams;

    if (req.user.role === 'patient') {
      const patientResult = await db.query(
        'SELECT id FROM patients WHERE user_id = $1', [req.user.id]
      );
      const patientId = patientResult.rows[0]?.id;
      if (!patientId) {
        return res.json({
          status: 'success',
          data: { doctor: maskedDoctor, appointments: [], prescriptions: [] },
        });
      }
      apptPatientFilter = 'AND a.patient_id = $2';
      apptParams.push(patientId);

      // Patients see only their own prescriptions from this doctor
      rxQuery = `SELECT rx.id, rx.patient_id, rx.doctor_id, rx.medication, rx.dosage,
                rx.frequency, rx.duration, rx.status, rx.created_at,
                pu.first_name || ' ' || pu.last_name AS patient_name,
                'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
         FROM prescriptions rx
         JOIN patients p ON rx.patient_id = p.id
         JOIN users pu ON p.user_id = pu.id
         JOIN doctors d ON rx.doctor_id = d.id
         JOIN users du ON d.user_id = du.id
         WHERE rx.doctor_id = $1 AND rx.patient_id = $2
         ORDER BY rx.created_at DESC`;
      rxParams = [id, patientId];
    } else if (req.user.role === 'doctor') {
      // Doctors see all prescriptions for patients they share appointments with
      const viewingDoctorResult = await db.query(
        'SELECT id FROM doctors WHERE user_id = $1', [req.user.id]
      );
      const viewingDoctorId = viewingDoctorResult.rows[0]?.id;
      if (!viewingDoctorId) {
        throw new AppError('Doctor profile not found.', 404);
      }

      rxQuery = `SELECT rx.id, rx.patient_id, rx.doctor_id, rx.medication, rx.dosage,
                rx.frequency, rx.duration, rx.status, rx.created_at,
                pu.first_name || ' ' || pu.last_name AS patient_name,
                'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
         FROM prescriptions rx
         JOIN patients p ON rx.patient_id = p.id
         JOIN users pu ON p.user_id = pu.id
         JOIN doctors d ON rx.doctor_id = d.id
         JOIN users du ON d.user_id = du.id
         WHERE rx.patient_id IN (
           SELECT DISTINCT a.patient_id FROM appointments a
           WHERE a.doctor_id = $1
         )
         ORDER BY rx.created_at DESC`;
      rxParams = [viewingDoctorId];
    } else {
      // Admin, nurse, etc. — see all prescriptions written by this doctor
      rxQuery = `SELECT rx.id, rx.patient_id, rx.doctor_id, rx.medication, rx.dosage,
                rx.frequency, rx.duration, rx.status, rx.created_at,
                pu.first_name || ' ' || pu.last_name AS patient_name,
                'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
         FROM prescriptions rx
         JOIN patients p ON rx.patient_id = p.id
         JOIN users pu ON p.user_id = pu.id
         JOIN doctors d ON rx.doctor_id = d.id
         JOIN users du ON d.user_id = du.id
         WHERE rx.doctor_id = $1
         ORDER BY rx.created_at DESC`;
      rxParams = [id];
    }

    const [apptsResult, rxResult] = await Promise.all([
      db.query(
        `SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.status, a.notes,
                pu.first_name || ' ' || pu.last_name AS patient_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN users pu ON p.user_id = pu.id
         WHERE a.doctor_id = $1 ${apptPatientFilter}
         ORDER BY a.scheduled_at DESC`,
        apptParams
      ),
      db.query(rxQuery, rxParams),
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
          doctorName: row.doctor_name,
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
    gender: row.gender ?? null,
  };
}

const TOP_DOCTORS_LIMIT = 10;

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
          COUNT(*) FILTER (WHERE a.status = 'scheduled') AS upcoming,
          COUNT(*) FILTER (WHERE a.status = 'cancelled') AS cancelled,
          COUNT(DISTINCT a.patient_id) AS total_patients
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u ON d.user_id = u.id
        WHERE u.is_active = true
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
        LIMIT $1
      `, [TOP_DOCTORS_LIMIT]),
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

const getAssignedPatients = async (req, res, next) => {
  try {
    // Fallback to DB lookup if doctorId not on token (e.g. pre-deploy sessions)
    let doctorId = req.user.doctorId;
    if (!doctorId) {
      const lookup = await db.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
      doctorId = lookup.rows[0]?.id;
    }
    if (!doctorId) throw new AppError('Doctor profile not found.', 403);

    const { limit = 50, offset = 0 } = req.query;
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const result = await db.query(
      `SELECT
         p.id,
         p.user_id,
         u.first_name,
         u.last_name,
         u.email,
         u.phone,
         p.date_of_birth,
         p.gender,
         p.blood_type,
         p.profile_image_url,
         latest_apt.scheduled_at AS last_visit,
         latest_apt.status AS last_visit_status,
         upcoming.next_appointment,
         COALESCE(apt_stats.total_appointments, 0) AS total_appointments,
         COALESCE(rec_stats.total_records, 0) AS total_records
       FROM patients p
       JOIN users u ON p.user_id = u.id
       JOIN (
         SELECT DISTINCT patient_id FROM appointments WHERE doctor_id = $1
         UNION SELECT DISTINCT patient_id FROM medical_records WHERE doctor_id = $1
         UNION SELECT DISTINCT patient_id FROM prescriptions WHERE doctor_id = $1
       ) linked ON linked.patient_id = p.id
       LEFT JOIN LATERAL (
         SELECT a.scheduled_at, a.status
         FROM appointments a
         WHERE a.doctor_id = $1 AND a.patient_id = p.id AND a.status NOT IN ('cancelled', 'no_show')
         ORDER BY a.scheduled_at DESC LIMIT 1
       ) latest_apt ON true
       LEFT JOIN LATERAL (
         SELECT MIN(a.scheduled_at) AS next_appointment
         FROM appointments a
         WHERE a.doctor_id = $1 AND a.patient_id = p.id
           AND a.status = 'scheduled' AND a.scheduled_at > NOW()
       ) upcoming ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_appointments
         FROM appointments a
         WHERE a.doctor_id = $1 AND a.patient_id = p.id
       ) apt_stats ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_records
         FROM medical_records mr
         WHERE mr.doctor_id = $1 AND mr.patient_id = p.id
       ) rec_stats ON true
       WHERE u.is_active = true
       ORDER BY upcoming.next_appointment ASC NULLS LAST, latest_apt.scheduled_at DESC NULLS LAST
       LIMIT $2 OFFSET $3`,
      [doctorId, safeLimit, safeOffset]
    );

    const patients = await Promise.all(result.rows.map(async (row) => ({
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      bloodType: row.blood_type,
      profileImageUrl: await getPresignedImageUrl(row.profile_image_url),
      lastVisit: row.last_visit,
      lastVisitStatus: row.last_visit_status,
      nextAppointment: row.next_appointment,
      totalAppointments: parseInt(row.total_appointments, 10),
      totalRecords: parseInt(row.total_records, 10),
    })));

    const masked = maskSensitiveFields(patients, req.user.role, false);

    res.json({ status: 'success', data: masked });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, getStatistics, getAssignedPatients };
