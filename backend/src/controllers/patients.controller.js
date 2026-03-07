const db = require('../config/database');
const AppError = require('../utils/AppError');

const getAll = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT p.id, p.user_id, u.first_name, u.last_name, u.email, u.phone,
              p.date_of_birth, p.gender, p.blood_type, p.address,
              p.emergency_contact, p.emergency_relationship, p.emergency_phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE u.is_active = true
       ORDER BY u.last_name, u.first_name`
    );

    const patients = result.rows.map(mapPatient);
    res.json({ status: 'success', data: patients });
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // req.resource is set by checkResourceAccess('patient') middleware
    // which already verified ABAC access — just fetch full details
    const patientResult = await db.query(
      `SELECT p.id, p.user_id, u.first_name, u.last_name, u.email, u.phone,
              p.date_of_birth, p.gender, p.blood_type, p.address,
              p.emergency_contact, p.emergency_relationship, p.emergency_phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (patientResult.rows.length === 0) {
      throw new AppError('Patient not found.', 404);
    }

    const patient = mapPatient(patientResult.rows[0]);

    const [recordsResult, rxResult, labsResult] = await Promise.all([
      db.query(
        `SELECT mr.id, mr.patient_id, mr.doctor_id, mr.diagnosis, mr.treatment, mr.notes, mr.created_at,
                'Dr. ' || u.first_name || ' ' || u.last_name AS doctor_name
         FROM medical_records mr
         LEFT JOIN doctors d ON mr.doctor_id = d.id
         LEFT JOIN users u ON d.user_id = u.id
         WHERE mr.patient_id = $1
         ORDER BY mr.created_at DESC`,
        [id]
      ),
      db.query(
        `SELECT rx.id, rx.patient_id, rx.doctor_id, rx.medication, rx.dosage,
                rx.frequency, rx.duration, rx.status, rx.created_at,
                'Dr. ' || u.first_name || ' ' || u.last_name AS doctor_name
         FROM prescriptions rx
         LEFT JOIN doctors d ON rx.doctor_id = d.id
         LEFT JOIN users u ON d.user_id = u.id
         WHERE rx.patient_id = $1
         ORDER BY rx.created_at DESC`,
        [id]
      ),
      db.query(
        `SELECT lr.id, lr.patient_id, lr.technician_id, lr.test_name, lr.result,
                lr.notes, lr.report_date,
                u.first_name || ' ' || u.last_name AS technician_name
         FROM lab_reports lr
         LEFT JOIN users u ON lr.technician_id = u.id
         WHERE lr.patient_id = $1
         ORDER BY lr.report_date DESC`,
        [id]
      ),
    ]);

    res.json({
      status: 'success',
      data: {
        patient,
        medicalRecords: recordsResult.rows.map(mapRecord),
        prescriptions: rxResult.rows.map(mapPrescription),
        labReports: labsResult.rows.map(mapLabReport),
      },
    });
  } catch (err) {
    return next(err);
  }
};

const updateById = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const {
      firstName, lastName, phone,
      dateOfBirth, gender, bloodType, address,
      emergencyContact, emergencyRelationship, emergencyPhone,
    } = req.body;

    await client.query('BEGIN');

    const patientResult = await client.query(
      'SELECT user_id FROM patients WHERE id = $1',
      [id]
    );
    if (patientResult.rows.length === 0) {
      throw new AppError('Patient not found.', 404);
    }
    const userId = patientResult.rows[0].user_id;

    if (firstName !== undefined || lastName !== undefined || phone !== undefined) {
      const userFields = [];
      const userParams = [];
      let idx = 1;

      if (firstName !== undefined) { userFields.push(`first_name = $${idx++}`); userParams.push(firstName); }
      if (lastName !== undefined) { userFields.push(`last_name = $${idx++}`); userParams.push(lastName); }
      if (phone !== undefined) { userFields.push(`phone = $${idx++}`); userParams.push(phone || null); }

      if (userFields.length > 0) {
        userParams.push(userId);
        await client.query(
          `UPDATE users SET ${userFields.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
          userParams
        );
      }
    }

    const profileFields = [];
    const profileParams = [];
    let pIdx = 1;

    if (dateOfBirth !== undefined) { profileFields.push(`date_of_birth = $${pIdx++}`); profileParams.push(dateOfBirth); }
    if (gender !== undefined) { profileFields.push(`gender = $${pIdx++}`); profileParams.push(gender); }
    if (bloodType !== undefined) { profileFields.push(`blood_type = $${pIdx++}`); profileParams.push(bloodType || null); }
    if (address !== undefined) { profileFields.push(`address = $${pIdx++}`); profileParams.push(address || null); }
    if (emergencyContact !== undefined) { profileFields.push(`emergency_contact = $${pIdx++}`); profileParams.push(emergencyContact || null); }
    if (emergencyRelationship !== undefined) { profileFields.push(`emergency_relationship = $${pIdx++}`); profileParams.push(emergencyRelationship || null); }
    if (emergencyPhone !== undefined) { profileFields.push(`emergency_phone = $${pIdx++}`); profileParams.push(emergencyPhone || null); }

    if (profileFields.length > 0) {
      profileParams.push(id);
      await client.query(
        `UPDATE patients SET ${profileFields.join(', ')}, updated_at = NOW() WHERE id = $${pIdx}`,
        profileParams
      );
    }

    await client.query('COMMIT');

    const result = await db.query(
      `SELECT p.id, p.user_id, u.first_name, u.last_name, u.email, u.phone,
              p.date_of_birth, p.gender, p.blood_type, p.address,
              p.emergency_contact, p.emergency_relationship, p.emergency_phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    res.json({ status: 'success', data: mapPatient(result.rows[0]) });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT p.id, p.user_id, u.first_name, u.last_name, u.email, u.phone,
              p.date_of_birth, p.gender, p.blood_type, p.address,
              p.emergency_contact, p.emergency_relationship, p.emergency_phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Patient profile not found.', 404);
    }

    res.json({ status: 'success', data: mapPatient(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

function mapPatient(row) {
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    bloodType: row.blood_type,
    address: row.address,
    emergencyContact: row.emergency_contact,
    emergencyRelationship: row.emergency_relationship,
    emergencyPhone: row.emergency_phone,
  };
}

function mapRecord(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    diagnosis: row.diagnosis,
    treatment: row.treatment,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function mapPrescription(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    patientName: row.patient_name,
    medication: row.medication,
    dosage: row.dosage,
    frequency: row.frequency,
    duration: row.duration,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapLabReport(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    technicianId: row.technician_id,
    technicianName: row.technician_name,
    testName: row.test_name,
    result: row.result,
    notes: row.notes,
    reportDate: row.report_date,
  };
}

module.exports = { getAll, getById, getMe, updateById };
