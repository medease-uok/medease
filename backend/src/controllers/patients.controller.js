const db = require('../config/database');
const AppError = require('../utils/AppError');
const { uploadToS3, deleteFromS3, getPresignedImageUrl } = require('../middleware/upload');
const { maskSensitiveFields } = require('../utils/maskSensitiveFields');
const auditLog = require('../utils/auditLog');

// Human-readable labels for profile change tracking
const TRACK_FIELDS = {
  first_name: 'First Name', last_name: 'Last Name', phone: 'Phone',
  date_of_birth: 'Date of Birth', gender: 'Gender', blood_type: 'Blood Type',
  organ_donor: 'Organ Donor', organ_donor_card_no: 'Donor Card No.',
  organs_to_donate: 'Organs to Donate', address: 'Address',
  emergency_contact: 'Emergency Contact', emergency_relationship: 'Emergency Relationship',
  emergency_phone: 'Emergency Phone', insurance_provider: 'Insurance Provider',
  insurance_policy_number: 'Policy Number', insurance_plan_type: 'Plan Type',
  insurance_expiry_date: 'Insurance Expiry',
};

/** Safely convert a DB value to a comparable string. */
function toStr(val) {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return [...val].sort().join(', ');
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val);
}

const PATIENT_SELECT = `
  SELECT p.id, p.user_id, u.first_name, u.last_name, u.email, u.phone,
         p.date_of_birth, p.gender, p.blood_type, p.organ_donor, p.organ_donor_card_no, p.organs_to_donate, p.address, p.profile_image_url,
         p.emergency_contact, p.emergency_relationship, p.emergency_phone,
         p.insurance_provider, p.insurance_policy_number, p.insurance_plan_type, p.insurance_expiry_date
  FROM patients p
  JOIN users u ON p.user_id = u.id`;

const getAll = async (req, res, next) => {
  try {
    const result = await db.query(
      `${PATIENT_SELECT}
       WHERE u.is_active = true
       ORDER BY u.last_name, u.first_name`
    );

    const patients = await Promise.all(result.rows.map(mapPatient));
    const masked = maskSensitiveFields(patients, req.user.role, false);

    auditLog({ userId: req.user.id, action: 'VIEW_PATIENTS_LIST', resourceType: 'patient', ip: req.ip });

    res.json({ status: 'success', data: masked });
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
      `${PATIENT_SELECT} WHERE p.id = $1`,
      [id]
    );

    if (patientResult.rows.length === 0) {
      throw new AppError('Patient not found.', 404);
    }

    const patient = await mapPatient(patientResult.rows[0]);
    const isOwner = req.user.id === patientResult.rows[0].user_id;
    const maskedPatient = maskSensitiveFields(patient, req.user.role, isOwner);

    auditLog({ userId: req.user.id, action: 'VIEW_PATIENT', resourceType: 'patient', resourceId: id, ip: req.ip });

    const [recordsResult, rxResult, labsResult, allergiesResult] = await Promise.all([
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
      db.query(
        `SELECT id, patient_id, allergen, severity, reaction, noted_at, created_at
         FROM patient_allergies
         WHERE patient_id = $1
         ORDER BY severity DESC, allergen`,
        [id]
      ),
    ]);

    res.json({
      status: 'success',
      data: {
        patient: maskedPatient,
        allergies: allergiesResult.rows.map(mapAllergy),
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
      dateOfBirth, gender, bloodType, organDonor, organDonorCardNo, organsToDonate, address,
      emergencyContact, emergencyRelationship, emergencyPhone,
      insuranceProvider, insurancePolicyNumber, insurancePlanType, insuranceExpiryDate,
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
      organ_donor: organDonor !== undefined ? (organDonor === true) : undefined,
      organ_donor_card_no: organDonorCardNo !== undefined ? (organDonorCardNo || null) : undefined,
      organs_to_donate: organsToDonate !== undefined ? (organsToDonate?.length ? organsToDonate : null) : undefined,
      address: address !== undefined ? (address || null) : undefined,
      emergency_contact: emergencyContact !== undefined ? (emergencyContact || null) : undefined,
      emergency_relationship: emergencyRelationship !== undefined ? (emergencyRelationship || null) : undefined,
      emergency_phone: emergencyPhone !== undefined ? (emergencyPhone || null) : undefined,
      insurance_provider: insuranceProvider !== undefined ? (insuranceProvider || null) : undefined,
      insurance_policy_number: insurancePolicyNumber !== undefined ? (insurancePolicyNumber || null) : undefined,
      insurance_plan_type: insurancePlanType !== undefined ? (insurancePlanType || null) : undefined,
      insurance_expiry_date: insuranceExpiryDate !== undefined ? (insuranceExpiryDate || null) : undefined,
    });

    if (userUpdate.setClauses.length === 0 && profileUpdate.setClauses.length === 0) {
      return next(new AppError('No valid fields provided for update.', 400));
    }

    await client.query('BEGIN');

    // Snapshot old values before update
    const oldResult = await client.query(
      `${PATIENT_SELECT} WHERE p.id = $1 FOR UPDATE`,
      [id]
    );
    if (oldResult.rows.length === 0) {
      throw new AppError('Resource not found.', 404);
    }
    const oldRow = oldResult.rows[0];
    const userId = oldRow.user_id;

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
      `${PATIENT_SELECT} WHERE p.id = $1`,
      [id]
    );
    const newRow = result.rows[0];

    // Log changed fields to profile_change_history
    for (const [col, label] of Object.entries(TRACK_FIELDS)) {
      const oldStr = toStr(oldRow[col]);
      const newStr = toStr(newRow[col]);
      if (oldStr !== newStr) {
        await client.query(
          `INSERT INTO profile_change_history (patient_id, changed_by, field_name, old_value, new_value)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, req.user.id, label, oldStr || null, newStr || null]
        );
      }
    }

    await client.query('COMMIT');

    const updated = await mapPatient(result.rows[0]);
    const isOwner = req.user.id === result.rows[0].user_id;

    auditLog({ userId: req.user.id, action: 'UPDATE_PATIENT', resourceType: 'patient', resourceId: id, ip: req.ip });

    res.json({ status: 'success', data: maskSensitiveFields(updated, req.user.role, isOwner) });
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
      `${PATIENT_SELECT} WHERE p.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Patient profile not found.', 404);
    }

    const patient = await mapPatient(result.rows[0]);

    const allergiesResult = await db.query(
      `SELECT id, patient_id, allergen, severity, reaction, noted_at, created_at
       FROM patient_allergies
       WHERE patient_id = $1
       ORDER BY severity DESC, allergen`,
      [patient.id]
    );

    patient.allergies = allergiesResult.rows.map(mapAllergy);

    res.json({ status: 'success', data: patient });
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
    organDonor: row.organ_donor,
    organDonorCardNo: row.organ_donor_card_no,
    organsToDonate: row.organs_to_donate,
    address: row.address,
    profileImageUrl: await getPresignedImageUrl(row.profile_image_url),
    emergencyContact: row.emergency_contact,
    emergencyRelationship: row.emergency_relationship,
    emergencyPhone: row.emergency_phone,
    insuranceProvider: row.insurance_provider,
    insurancePolicyNumber: row.insurance_policy_number,
    insurancePlanType: row.insurance_plan_type,
    insuranceExpiryDate: row.insurance_expiry_date,
  };
}

function mapAllergy(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    allergen: row.allergen,
    severity: row.severity,
    reaction: row.reaction,
    notedAt: row.noted_at,
    createdAt: row.created_at,
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

    const result = await db.query(
      `${PATIENT_SELECT} WHERE p.id = $1`,
      [id]
    );

    const mapped = await mapPatient(result.rows[0]);
    const isOwner = req.user.id === result.rows[0].user_id;
    res.json({ status: 'success', data: maskSensitiveFields(mapped, req.user.role, isOwner) });
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
      `${PATIENT_SELECT} WHERE p.id = $1`,
      [id]
    );

    const mapped2 = await mapPatient(result.rows[0]);
    const isOwner2 = req.user.id === result.rows[0].user_id;
    res.json({ status: 'success', data: maskSensitiveFields(mapped2, req.user.role, isOwner2) });
  } catch (err) {
    return next(err);
  }
};

const getPrescriptions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
    const offset = (page - 1) * limit;
    const status = req.query.status;

    // Verify patient exists
    const patientCheck = await db.query('SELECT id FROM patients WHERE id = $1', [id]);
    if (patientCheck.rows.length === 0) {
      throw new AppError('Patient not found.', 404);
    }

    const params = [id];
    let whereClause = 'WHERE rx.patient_id = $1';

    if (status) {
      params.push(status);
      whereClause += ` AND rx.status = $${params.length}`;
    }

    // NOTE: whereClause is shared between countQuery and dataQuery.
    // Any changes to filters must be reflected in both.
    const countResult = await db.query(
      `SELECT COUNT(*) FROM prescriptions rx ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await db.query(
      `SELECT rx.id, rx.patient_id, rx.doctor_id, rx.medication, rx.dosage,
              rx.frequency, rx.duration, rx.status, rx.created_at,
              'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
       FROM prescriptions rx
       LEFT JOIN doctors d ON rx.doctor_id = d.id
       LEFT JOIN users du ON d.user_id = du.id
       ${whereClause}
       ORDER BY rx.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const prescriptions = dataResult.rows.map(mapPrescription);

    auditLog({ userId: req.user.id, action: 'VIEW_PATIENT_PRESCRIPTIONS', resourceType: 'patient', resourceId: id, ip: req.ip });

    res.json({
      status: 'success',
      data: prescriptions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
    const offset = (page - 1) * limit;
    const type = req.query.type; // optional filter: 'visit', 'diagnosis', 'prescription', 'lab'

    // Verify patient exists
    const patientCheck = await db.query('SELECT id FROM patients WHERE id = $1', [id]);
    if (patientCheck.rows.length === 0) {
      throw new AppError('Patient not found.', 404);
    }

    // Build a UNION ALL of all history event types, each tagged with its type
    const typeClauses = [];
    const typeParams = [id];

    if (!type || type === 'visit') {
      typeClauses.push(`
        SELECT a.id, 'visit' AS type, a.scheduled_at AS event_date,
               json_build_object(
                 'status', a.status,
                 'notes', a.notes,
                 'doctorName', 'Dr. ' || u.first_name || ' ' || u.last_name
               ) AS details
        FROM appointments a
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE a.patient_id = $1
      `);
    }

    if (!type || type === 'diagnosis') {
      typeClauses.push(`
        SELECT mr.id, 'diagnosis' AS type, mr.created_at AS event_date,
               json_build_object(
                 'diagnosis', mr.diagnosis,
                 'treatment', mr.treatment,
                 'notes', mr.notes,
                 'doctorName', 'Dr. ' || u.first_name || ' ' || u.last_name
               ) AS details
        FROM medical_records mr
        LEFT JOIN doctors d ON mr.doctor_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE mr.patient_id = $1
      `);
    }

    if (!type || type === 'prescription') {
      typeClauses.push(`
        SELECT rx.id, 'prescription' AS type, rx.created_at AS event_date,
               json_build_object(
                 'medication', rx.medication,
                 'dosage', rx.dosage,
                 'frequency', rx.frequency,
                 'duration', rx.duration,
                 'status', rx.status,
                 'doctorName', 'Dr. ' || u.first_name || ' ' || u.last_name
               ) AS details
        FROM prescriptions rx
        LEFT JOIN doctors d ON rx.doctor_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE rx.patient_id = $1
      `);
    }

    if (!type || type === 'lab') {
      typeClauses.push(`
        SELECT lr.id, 'lab' AS type, lr.report_date AS event_date,
               json_build_object(
                 'testName', lr.test_name,
                 'result', lr.result,
                 'notes', lr.notes,
                 'technicianName', u.first_name || ' ' || u.last_name
               ) AS details
        FROM lab_reports lr
        LEFT JOIN users u ON lr.technician_id = u.id
        WHERE lr.patient_id = $1
      `);
    }

    if (typeClauses.length === 0) {
      return res.json({ status: 'success', data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const unionQuery = typeClauses.join(' UNION ALL ');

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM (${unionQuery}) AS history`,
      typeParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const dataResult = await db.query(
      `SELECT * FROM (${unionQuery}) AS history
       ORDER BY event_date DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    const history = dataResult.rows.map((row) => ({
      id: row.id,
      type: row.type,
      eventDate: row.event_date,
      ...row.details,
    }));

    auditLog({ userId: req.user.id, action: 'VIEW_PATIENT_HISTORY', resourceType: 'patient', resourceId: id, ip: req.ip });

    res.json({
      status: 'success',
      data: history,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return next(err);
  }
};

const getMyHistory = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id FROM patients WHERE user_id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      throw new AppError('Patient profile not found.', 404);
    }
    req.params.id = result.rows[0].id;
    return getHistory(req, res, next);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, getMe, getHistory, getMyHistory, getPrescriptions, updateById, uploadProfileImage, deleteProfileImage };
