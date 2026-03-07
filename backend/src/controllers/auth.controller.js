const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const redis = require('../config/redis');
const config = require('../config');
const AppError = require('../utils/AppError');
const auditLog = require('../utils/auditLog');

const SALT_ROUNDS = 12;

const DEFAULT_AVATARS = {
  Male: [
    'default-images/58509043_9439678.jpg',
    'default-images/58509054_9441186.jpg',
    'default-images/58509057_9440461.jpg',
  ],
  Female: [
    'default-images/58509051_9439729.jpg',
    'default-images/58509055_9439726.jpg',
    'default-images/58509058_9442242.jpg',
  ],
};

function pickDefaultAvatar(gender) {
  const list = DEFAULT_AVATARS[gender];
  if (list) return list[Math.floor(Math.random() * list.length)];
  const all = [...DEFAULT_AVATARS.Male, ...DEFAULT_AVATARS.Female];
  return all[Math.floor(Math.random() * all.length)];
}

const register = async (req, res, next) => {
  const {
    firstName, lastName, email, phone, role, password,
    dateOfBirth, gender, bloodType, address,
    emergencyContact, emergencyRelationship, emergencyPhone,
    specialization, licenseNumber, department,
  } = req.body;

  const client = await db.getClient();

  try {
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      throw new AppError('An account with this email already exists.', 409);
    }

    if (licenseNumber && ['doctor', 'nurse', 'pharmacist'].includes(role)) {
      const tableMap = { doctor: 'doctors', nurse: 'nurses', pharmacist: 'pharmacists' };
      const table = tableMap[role];
      const dupLicense = await client.query(
        `SELECT id FROM ${table} WHERE license_number = $1`,
        [licenseNumber]
      );
      if (dupLicense.rows.length > 0) {
        throw new AppError('This license number is already registered.', 409);
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await client.query('BEGIN');

    const defaultAvatar = role !== 'patient' ? pickDefaultAvatar(gender) : null;

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, date_of_birth, is_active, profile_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8)
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [email, passwordHash, firstName, lastName, role, phone || null, dateOfBirth || null, defaultAvatar]
    );
    const user = userResult.rows[0];

    switch (role) {
      case 'patient':
        await client.query(
          `INSERT INTO patients (user_id, date_of_birth, gender, blood_type, address,
             emergency_contact, emergency_relationship, emergency_phone, profile_image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [user.id, dateOfBirth, gender, bloodType || null, address || null,
           emergencyContact || null, emergencyRelationship || null, emergencyPhone || null,
           pickDefaultAvatar(gender)]
        );
        break;

      case 'doctor':
        await client.query(
          `INSERT INTO doctors (user_id, specialization, license_number, department, available)
           VALUES ($1, $2, $3, $4, true)`,
          [user.id, specialization, licenseNumber, department]
        );
        break;

      case 'nurse':
        await client.query(
          `INSERT INTO nurses (user_id, license_number, department)
           VALUES ($1, $2, $3)`,
          [user.id, licenseNumber, department]
        );
        break;

      case 'pharmacist':
        await client.query(
          `INSERT INTO pharmacists (user_id, license_number)
           VALUES ($1, $2)`,
          [user.id, licenseNumber]
        );
        break;

      case 'lab_technician':
        break;
    }

    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE name = $2`,
      [user.id, role]
    );

    await client.query('COMMIT');

    await auditLog({
      userId: user.id,
      action: 'REGISTER',
      resourceType: 'user',
      resourceId: user.id,
      ip: req.ip,
    });

    res.status(201).json({
      status: 'success',
      message: 'Registration successful. Your account is pending admin approval.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at,
        },
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');

    await auditLog({
      userId: null,
      action: 'REGISTER',
      resourceType: 'user',
      ip: req.ip,
      success: false,
    });

    if (err.isOperational) {
      return next(err);
    }

    // Handle PostgreSQL unique constraint violations
    if (err.code === '23505') {
      if (err.constraint && err.constraint.includes('email')) {
        return next(new AppError('An account with this email already exists.', 409));
      }
      if (err.constraint && err.constraint.includes('license_number')) {
        return next(new AppError('This license number is already registered.', 409));
      }
      return next(new AppError('A record with this information already exists.', 409));
    }

    return next(err);
  } finally {
    client.release();
  }
};

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(40).toString('hex');
  const key = `refresh:${token}`;
  await redis.set(key, String(userId), 'EX', config.refreshTokenTTL);
  return token;
}

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.is_active) {
      throw new AppError('Your account is pending admin approval.', 403);
    }

    await auditLog({
      userId: user.id,
      action: 'LOGIN',
      resourceType: 'session',
      ip: req.ip,
    });

    const token = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    res.json({
      status: 'success',
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
        },
      },
    });
  } catch (err) {
    await auditLog({
      userId: null,
      action: 'LOGIN',
      resourceType: 'session',
      ip: req.ip,
      success: false,
    });

    return next(err);
  }
};

const refresh = async (req, res, next) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      throw new AppError('Refresh token is required.', 400);
    }

    const key = `refresh:${refreshToken}`;
    const userId = await redis.get(key);

    if (!userId) {
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    const result = await db.query(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];

    if (!user || !user.is_active) {
      await redis.del(key);
      throw new AppError('Account not found or inactive.', 401);
    }

    // Rotate: delete old refresh token, issue new pair
    await redis.del(key);
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = await createRefreshToken(user.id);

    res.json({
      status: 'success',
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
};

const logout = async (req, res, next) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      await redis.del(`refresh:${refreshToken}`);
    }

    if (req.user) {
      await auditLog({
        userId: req.user.id,
        action: 'LOGOUT',
        resourceType: 'session',
        ip: req.ip,
      });
    }

    res.json({ status: 'success', message: 'Logged out successfully.' });
  } catch (err) {
    return next(err);
  }
};

const { getUserPermissions } = require('../utils/permissions');

const getMyPermissions = async (req, res, next) => {
  try {
    const permissions = await getUserPermissions(req.user.id);
    res.json({ status: 'success', data: permissions });
  } catch (err) {
    return next(err);
  }
};

module.exports = { register, login, refresh, logout, getMyPermissions };
