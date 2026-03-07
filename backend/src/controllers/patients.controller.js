const db = require('../config/database');
const AppError = require('../utils/AppError');
const { uploadToS3, deleteFromS3, getPresignedImageUrl } = require('../middleware/upload');

const getAll = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT p.id, p.user_id, u.first_name, u.last_name, u.email, u.phone,
              p.date_of_birth, p.gender, p.blood_type, p.address, p.profile_image_url,
              p.emergency_contact, p.emergency_relationship, p.emergency_phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE u.is_active = true
       ORDER BY u.last_name, u.first_name`
    );

    const patients = await Promise.all(result.rows.map(mapPatient));
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
              p.date_of_birth, p.gender, p.blood_type, p.address, p.profile_image_url,
              p.emergency_contact, p.emergency_relationship, p.emergency_phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (patientResult.rows.length === 0) {
      throw new AppError('Patient not found.', 404);
    }

    const patient = await mapPatient(patientResult.rows[0]);

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

function buildSetClauses(fieldMap) {
  const setClauses = [];
  const params = [];
  let idx = 1;

  for (const [column, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      setClauses.push(`${column} = $${idx++}`);
      params.push(value ?? null);
    }
  }

  return { setClauses, params, nextIdx: idx };
}

const updateById = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const {
      firstName, lastName, phone,
      dateOfBirth, gender, bloodType, address,
      emergencyContact, emergencyRelationship, emergencyPhone,
    } = req.body;

    const userUpdate = buildSetClauses({
      first_name: firstName,
      last_name: lastName,
      phone: phone !== undefined ? (phone || null) : undefined,
    });

    const profileUpdate = buildSetClauses({
      date_of_birth: dateOfBirth,
      gender: gender,
      blood_type: bloodType !== undefined ? (bloodType || null) : undefined,
      address: address !== undefined ? (address || null) : undefined,
      emergency_contact: emergencyContact !== undefined ? (emergencyContact || null) : undefined,
      emergency_relationship: emergencyRelationship !== undefined ? (emergencyRelationship || null) : undefined,
      emergency_phone: emergencyPhone !== undefined ? (emergencyPhone || null) : undefined,
    });

    if (userUpdate.setClauses.length === 0 && profileUpdate.setClauses.length === 0) {
      return next(new AppError('No valid fields provided for update.', 400));
    }

    await client.query('BEGIN');

    const patientResult = await client.query(
      'SELECT user_id FROM patients WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (patientResult.rows.length === 0) {
      throw new AppError('Resource not found.', 404);
    }
    const userId = patientResult.rows[0].user_id;

    if (userUpdate.setClauses.length > 0) {
      userUpdate.params.push(userId);
      await client.query(
        `UPDATE users SET ${userUpdate.setClauses.join(', ')}, updated_at = NOW() WHERE id = $${userUpdate.nextIdx}`,
        userUpdate.params
      );
    }

    if (profileUpdate.setClauses.length > 0) {
      profileUpdate.params.push(id);
      await client.query(
        `UPDATE patients SET ${profileUpdate.setClauses.join(', ')}, updated_at = NOW() WHERE id = $${profileUpdate.nextIdx}`,
        profileUpdate.params
      );
    }

    const result = await client.query(
      `SELECT p.id, p.user_id, u.first_name, u.last_name, u.email, u.phone,
              p.date_of_birth, p.gender, p.blood_type, p.address, p.profile_image_url,
              p.emergency_contact, p.emergency_relationship, p.emergency_phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    await client.query('COMMIT');

    res.json({ status: 'success', data: await mapPatient(result.rows[0]) });
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
              p.date_of_birth, p.gender, p.blood_type, p.address, p.profile_image_url,
              p.emergency_contact, p.emergency_relationship, p.emergency_phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Patient profile not found.', 404);
    }

    res.json({ status: 'success', data: await mapPatient(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

async function mapPatient(row) {
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
    profileImageUrl: await getPresignedImageUrl(row.profile_image_url),
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

const uploadProfileImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return next(new AppError('No image file provided.', 400));
    }

    // Get current image URL for cleanup
    const current = await db.query(
      'SELECT profile_image_url FROM patients WHERE id = $1',
      [id]
    );
    if (current.rows.length === 0) {
      return next(new AppError('Patient not found.', 404));
    }

    const oldKey = current.rows[0].profile_image_url;
    const newKey = await uploadToS3(req.file, id);

    await db.query(
      'UPDATE patients SET profile_image_url = $1, updated_at = NOW() WHERE id = $2',
      [newKey, id]
    );

    // Clean up old image (best-effort)
    deleteFromS3(oldKey);

    // Return the full updated profile
    const result = await db.query(
      `SELECT p.id, p.user_id, u.first_name, u.last_name, u.email, u.phone,
              p.date_of_birth, p.gender, p.blood_type, p.address, p.profile_image_url,
              p.emergency_contact, p.emergency_relationship, p.emergency_phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    res.json({ status: 'success', data: await mapPatient(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const deleteProfileImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const current = await db.query(
      'SELECT profile_image_url FROM patients WHERE id = $1',
      [id]
    );
    if (current.rows.length === 0) {
      return next(new AppError('Patient not found.', 404));
    }

    const oldKey = current.rows[0].profile_image_url;
    if (!oldKey) {
      return next(new AppError('No profile image to delete.', 400));
    }

    await db.query(
      'UPDATE patients SET profile_image_url = NULL, updated_at = NOW() WHERE id = $1',
      [id]
    );

    deleteFromS3(oldKey);

    const result = await db.query(
      `SELECT p.id, p.user_id, u.first_name, u.last_name, u.email, u.phone,
              p.date_of_birth, p.gender, p.blood_type, p.address, p.profile_image_url,
              p.emergency_contact, p.emergency_relationship, p.emergency_phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    res.json({ status: 'success', data: await mapPatient(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, getMe, updateById, uploadProfileImage, deleteProfileImage };
