const db = require('../config/database');
const AppError = require('../utils/AppError');
const { uploadToS3, deleteFromS3, getPresignedImageUrl } = require('../middleware/upload');

const ROLE_QUERIES = {
  patient: {
    query: `SELECT u.id AS user_id, u.first_name, u.last_name, u.email, u.phone, u.role,
                   p.id AS profile_id, p.date_of_birth, p.gender, p.blood_type, p.organ_donor, p.address,
                   p.profile_image_url, p.emergency_contact, p.emergency_relationship, p.emergency_phone,
                   p.insurance_provider, p.insurance_policy_number, p.insurance_plan_type, p.insurance_expiry_date
            FROM users u
            JOIN patients p ON p.user_id = u.id
            WHERE u.id = $1`,
    imageColumn: 'patients',
    imageJoin: 'JOIN patients p ON p.user_id = u.id',
    profileIdQuery: 'SELECT id FROM patients WHERE user_id = $1',
  },
  doctor: {
    query: `SELECT u.id AS user_id, u.first_name, u.last_name, u.email, u.phone, u.role,
                   u.date_of_birth, u.profile_image_url, d.id AS profile_id,
                   d.specialization, d.license_number, d.department, d.available
            FROM users u
            JOIN doctors d ON d.user_id = u.id
            WHERE u.id = $1`,
    imageColumn: 'users',
  },
  nurse: {
    query: `SELECT u.id AS user_id, u.first_name, u.last_name, u.email, u.phone, u.role,
                   u.date_of_birth, u.profile_image_url, n.id AS profile_id,
                   n.license_number, n.department
            FROM users u
            JOIN nurses n ON n.user_id = u.id
            WHERE u.id = $1`,
    imageColumn: 'users',
  },
  pharmacist: {
    query: `SELECT u.id AS user_id, u.first_name, u.last_name, u.email, u.phone, u.role,
                   u.date_of_birth, u.profile_image_url, ph.id AS profile_id,
                   ph.license_number
            FROM users u
            JOIN pharmacists ph ON ph.user_id = u.id
            WHERE u.id = $1`,
    imageColumn: 'users',
  },
  lab_technician: {
    query: `SELECT u.id AS user_id, u.first_name, u.last_name, u.email, u.phone, u.role,
                   u.date_of_birth, u.profile_image_url
            FROM users u
            WHERE u.id = $1`,
    imageColumn: 'users',
  },
};

async function mapProfileRow(row) {
  const base = {
    userId: row.user_id,
    profileId: row.profile_id || null,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    dateOfBirth: row.date_of_birth,
    profileImageUrl: await getPresignedImageUrl(row.profile_image_url),
  };

  switch (row.role) {
    case 'patient':
      return {
        ...base,
        gender: row.gender,
        bloodType: row.blood_type,
        organDonor: row.organ_donor,
        address: row.address,
        emergencyContact: row.emergency_contact,
        emergencyRelationship: row.emergency_relationship,
        emergencyPhone: row.emergency_phone,
        insuranceProvider: row.insurance_provider,
        insurancePolicyNumber: row.insurance_policy_number,
        insurancePlanType: row.insurance_plan_type,
        insuranceExpiryDate: row.insurance_expiry_date,
      };
    case 'doctor':
      return {
        ...base,
        specialization: row.specialization,
        licenseNumber: row.license_number,
        department: row.department,
        available: row.available,
      };
    case 'nurse':
      return { ...base, licenseNumber: row.license_number, department: row.department };
    case 'pharmacist':
      return { ...base, licenseNumber: row.license_number };
    default:
      return base;
  }
}

const getMe = async (req, res, next) => {
  try {
    const role = req.user.role;
    const config = ROLE_QUERIES[role];
    if (!config) throw new AppError('Profile not available for this role.', 400);

    const result = await db.query(config.query, [req.user.id]);
    if (result.rows.length === 0) throw new AppError('Profile not found.', 404);

    res.json({ status: 'success', data: await mapProfileRow(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError('No image file provided.', 400));

    const role = req.user.role;
    const userId = req.user.id;
    const config = ROLE_QUERIES[role];
    if (!config) return next(new AppError('Profile not available for this role.', 400));

    let oldKey, updateQuery, updateParams;

    if (config.imageColumn === 'patients') {
      const current = await db.query(
        'SELECT id, profile_image_url FROM patients WHERE user_id = $1', [userId]
      );
      if (current.rows.length === 0) return next(new AppError('Profile not found.', 404));
      oldKey = current.rows[0].profile_image_url;
      const newKey = await uploadToS3(req.file, current.rows[0].id);
      updateQuery = 'UPDATE patients SET profile_image_url = $1, updated_at = NOW() WHERE user_id = $2';
      updateParams = [newKey, userId];
    } else {
      const current = await db.query(
        'SELECT profile_image_url FROM users WHERE id = $1', [userId]
      );
      if (current.rows.length === 0) return next(new AppError('User not found.', 404));
      oldKey = current.rows[0].profile_image_url;
      const newKey = await uploadToS3(req.file, userId);
      updateQuery = 'UPDATE users SET profile_image_url = $1, updated_at = NOW() WHERE id = $2';
      updateParams = [newKey, userId];
    }

    await db.query(updateQuery, updateParams);
    deleteFromS3(oldKey);

    const result = await db.query(config.query, [userId]);
    res.json({ status: 'success', data: await mapProfileRow(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const deleteProfileImage = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const config = ROLE_QUERIES[role];
    if (!config) return next(new AppError('Profile not available for this role.', 400));

    let oldKey;

    if (config.imageColumn === 'patients') {
      const current = await db.query(
        'SELECT profile_image_url FROM patients WHERE user_id = $1', [userId]
      );
      if (current.rows.length === 0) return next(new AppError('Profile not found.', 404));
      oldKey = current.rows[0].profile_image_url;
      if (!oldKey) return next(new AppError('No profile image to delete.', 400));
      await db.query('UPDATE patients SET profile_image_url = NULL, updated_at = NOW() WHERE user_id = $1', [userId]);
    } else {
      const current = await db.query(
        'SELECT profile_image_url FROM users WHERE id = $1', [userId]
      );
      if (current.rows.length === 0) return next(new AppError('User not found.', 404));
      oldKey = current.rows[0].profile_image_url;
      if (!oldKey) return next(new AppError('No profile image to delete.', 400));
      await db.query('UPDATE users SET profile_image_url = NULL, updated_at = NOW() WHERE id = $1', [userId]);
    }

    deleteFromS3(oldKey);

    const result = await db.query(config.query, [userId]);
    res.json({ status: 'success', data: await mapProfileRow(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const config = ROLE_QUERIES[role];
    if (!config) return next(new AppError('Profile not available for this role.', 400));

    const { firstName, lastName, phone, dateOfBirth } = req.body;
    const sets = [];
    const params = [];
    let idx = 1;

    if (firstName !== undefined) { sets.push(`first_name = $${idx++}`); params.push(firstName); }
    if (lastName !== undefined) { sets.push(`last_name = $${idx++}`); params.push(lastName); }
    if (phone !== undefined) { sets.push(`phone = $${idx++}`); params.push(phone || null); }
    if (dateOfBirth !== undefined) { sets.push(`date_of_birth = $${idx++}`); params.push(dateOfBirth || null); }

    if (sets.length === 0) return next(new AppError('No fields to update.', 400));

    sets.push(`updated_at = NOW()`);
    params.push(userId);

    await db.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`, params);

    const result = await db.query(config.query, [userId]);
    res.json({ status: 'success', data: await mapProfileRow(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getMe, updateMe, uploadProfileImage, deleteProfileImage };
