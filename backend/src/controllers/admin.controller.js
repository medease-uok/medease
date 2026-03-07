const db = require('../config/database');
const AppError = require('../utils/AppError');
const auditLog = require('../utils/auditLog');

const getUsers = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, phone, is_active, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    const users = result.rows.map(mapUser);
    res.json({ status: 'success', data: users });
  } catch (err) {
    return next(err);
  }
};

const getPendingUsers = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, phone, is_active, created_at
       FROM users
       WHERE is_active = false
       ORDER BY created_at DESC`
    );

    const users = await Promise.all(result.rows.map(async (user) => {
      const mapped = mapUser(user);
      mapped.profileData = await getProfileData(user.id, user.role);
      return mapped;
    }));

    res.json({ status: 'success', data: users });
  } catch (err) {
    return next(err);
  }
};

const approveUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE users SET is_active = true, updated_at = NOW()
       WHERE id = $1 AND is_active = false
       RETURNING id, email, first_name, last_name, role`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found or already active.', 404);
    }

    await auditLog({
      userId: req.user.id,
      action: 'APPROVE_USER',
      resourceType: 'user',
      resourceId: id,
      ip: req.ip,
    });

    res.json({ status: 'success', message: 'User approved successfully.' });
  } catch (err) {
    return next(err);
  }
};

const rejectUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM users WHERE id = $1 AND is_active = false RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found or already active.', 404);
    }

    await auditLog({
      userId: req.user.id,
      action: 'REJECT_USER',
      resourceType: 'user',
      resourceId: id,
      ip: req.ip,
    });

    res.json({ status: 'success', message: 'User rejected and removed.' });
  } catch (err) {
    return next(err);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT al.id, al.user_id,
              COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') AS user_name,
              al.action, al.resource_type, al.resource_id,
              al.ip_address, al.success, al.created_at
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC`
    );

    const logs = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      ipAddress: row.ip_address,
      success: row.success,
      createdAt: row.created_at,
    }));

    res.json({ status: 'success', data: logs });
  } catch (err) {
    return next(err);
  }
};

function mapUser(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

async function getProfileData(userId, role) {
  const profileQueries = {
    patient: `SELECT date_of_birth, gender, blood_type, organ_donor, organ_donor_card_no, organs_to_donate, address, emergency_contact, emergency_relationship, emergency_phone FROM patients WHERE user_id = $1`,
    doctor: `SELECT specialization, license_number, department FROM doctors WHERE user_id = $1`,
    nurse: `SELECT license_number, department FROM nurses WHERE user_id = $1`,
    pharmacist: `SELECT license_number FROM pharmacists WHERE user_id = $1`,
  };

  const query = profileQueries[role];
  if (!query) return {};

  const result = await db.query(query, [userId]);
  if (result.rows.length === 0) return {};

  const row = result.rows[0];
  const data = {};

  const keyMap = {
    date_of_birth: 'dateOfBirth',
    gender: 'gender',
    blood_type: 'bloodType',
    organ_donor: 'organDonor',
    organ_donor_card_no: 'organDonorCardNo',
    organs_to_donate: 'organsToDonate',
    address: 'address',
    emergency_contact: 'emergencyContact',
    emergency_relationship: 'emergencyRelationship',
    emergency_phone: 'emergencyPhone',
    specialization: 'specialization',
    license_number: 'licenseNumber',
    department: 'department',
  };

  for (const [dbKey, camelKey] of Object.entries(keyMap)) {
    if (row[dbKey] !== undefined && row[dbKey] !== null && row[dbKey] !== '') {
      data[camelKey] = row[dbKey];
    }
  }

  return data;
}

module.exports = { getUsers, getPendingUsers, approveUser, rejectUser, getAuditLogs };
