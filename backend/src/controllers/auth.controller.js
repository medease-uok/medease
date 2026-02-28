const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 12;

const register = async (req, res, next) => {
  const {
    firstName, lastName, email, phone, role, password,
    dateOfBirth, gender, bloodType, address,
    emergencyContact, emergencyRelationship, emergencyPhone,
    specialization, licenseNumber, department,
  } = req.body;

  const client = await db.getClient();

  try {
    // Check for duplicate email
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      throw new AppError('An account with this email already exists.', 409);
    }

    // Check for duplicate license number if applicable
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Begin transaction
    await client.query('BEGIN');

    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [email, passwordHash, firstName, lastName, role, phone || null]
    );
    const user = userResult.rows[0];

    // Insert role-specific profile
    switch (role) {
      case 'patient':
        await client.query(
          `INSERT INTO patients (user_id, date_of_birth, gender, blood_type, address,
             emergency_contact, emergency_relationship, emergency_phone)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [user.id, dateOfBirth, gender, bloodType || null, address || null,
           emergencyContact || null, emergencyRelationship || null, emergencyPhone || null]
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
        // No dedicated table for lab technicians in the current schema.
        // Department is accepted but not persisted beyond the user record.
        // TODO: Add lab_technicians table or department column to users table.
        break;
    }

    // Commit transaction
    await client.query('COMMIT');

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

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const result = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Check if account is active
    if (!user.is_active) {
      throw new AppError('Your account is pending admin approval.', 403);
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      status: 'success',
      data: {
        token,
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
    if (err.isOperational) {
      return next(err);
    }
    return next(err);
  }
};

module.exports = { register, login };
