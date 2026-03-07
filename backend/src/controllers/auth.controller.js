const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const redis = require('../config/redis');
const config = require('../config');
const AppError = require('../utils/AppError');
const auditLog = require('../utils/auditLog');
const { sendLoginOtpEmail, sendRegistrationVerificationEmail, sendPasswordResetOtpEmail } = require('../utils/emailService');

/** Masks most of an email address for safe display, e.g. jo***@example.com */
function maskEmail(email) {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

/** Redis key for a user's pending login OTP */
const otpKey = (userId) => `login_otp:${userId}`;

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

    // Generate email verification token and save it
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await db.query(
      'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
      [verificationToken, verificationExpires, user.id]
    );

    // Audit log: successful registration
    await auditLog({
      userId: user.id,
      action: 'REGISTER',
      resourceType: 'user',
      resourceId: user.id,
      ip: req.ip,
    });

    res.status(201).json({
      status: 'success',
      message: 'Registration successful. Please verify your email before logging in.',
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

    // Audit log: failed registration attempt
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

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const result = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active, email_verified FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    // Use the same error message for wrong email or password to prevent enumeration
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Check if email address has been verified
    if (!user.email_verified) {
      throw new AppError('Please verify your email address before logging in. Check your inbox for the verification link.', 403);
    }

    // Check if account is active
    if (!user.is_active) {
      throw new AppError('Your account is pending admin approval.', 403);
    }

    // -------------------------------------------------------------------
    // Email OTP Verification
    // -------------------------------------------------------------------
    // Generate a cryptographically-random 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store in Redis: { otp, attempts } – expires after OTP_TTL_SECONDS
    await redis.set(
      otpKey(user.id),
      JSON.stringify({ otp, attempts: 0 }),
      'EX',
      config.otp.ttlSeconds
    );

    // Send OTP email (non-blocking audit is still recorded below on failure)
    await sendLoginOtpEmail(user.email, user.first_name, otp);

    // Audit log: OTP sent (maps to 'LOGIN_OTP_SENT' action – logged as pending)
    await auditLog({
      userId: user.id,
      action: 'LOGIN_OTP_SENT',
      resourceType: 'session',
      ip: req.ip,
    });

    return res.status(200).json({
      status: 'otp_required',
      message: `A verification code has been sent to ${maskEmail(user.email)}. It expires in ${config.otp.ttlSeconds / 60} minutes.`,
      data: {
        email: maskEmail(user.email),
      },
    });
  } catch (err) {
    // Audit log: failed login attempt
    await auditLog({
      userId: null,
      action: 'LOGIN',
      resourceType: 'session',
      ip: req.ip,
      success: false,
    });

    if (err.isOperational) {
      return next(err);
    }
    return next(err);
  }
};

/**
 * POST /auth/verify-otp
 * Validates the emailed OTP and, on success, returns the JWT access token.
 */
const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    // Fetch user
    const result = await db.query(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user || !user.is_active) {
      throw new AppError('Invalid or expired verification code.', 401);
    }

    // Retrieve OTP record from Redis
    const raw = await redis.get(otpKey(user.id));
    if (!raw) {
      throw new AppError('Verification code has expired. Please log in again.', 401);
    }

    const record = JSON.parse(raw);

    // Enforce max-attempt limit (prevent brute-force)
    if (record.attempts >= config.otp.maxAttempts) {
      await redis.del(otpKey(user.id));
      throw new AppError(
        `Too many incorrect attempts. Please log in again to request a new code.`,
        429
      );
    }

    // Compare OTP
    if (record.otp !== otp.trim()) {
      // Increment attempt counter but keep the same TTL
      const ttl = await redis.ttl(otpKey(user.id));
      await redis.set(
        otpKey(user.id),
        JSON.stringify({ otp: record.otp, attempts: record.attempts + 1 }),
        'EX',
        ttl > 0 ? ttl : config.otp.ttlSeconds
      );
      const remaining = config.otp.maxAttempts - record.attempts - 1;
      throw new AppError(
        `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        401
      );
    }

    // OTP is valid — delete it from Redis immediately (single-use)
    await redis.del(otpKey(user.id));

    // Audit log: successful login
    await auditLog({
      userId: user.id,
      action: 'LOGIN',
      resourceType: 'session',
      ip: req.ip,
    });

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.json({
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
    // Only log as failed LOGIN if it wasn't an OTP-stage error (to avoid duplicate entries)
    if (!err.isOperational) {
      await auditLog({
        userId: null,
        action: 'LOGIN',
        resourceType: 'session',
        ip: req.ip,
        success: false,
      });
    }

    if (err.isOperational) {
      return next(err);
    }
    return next(err);
  }
};

/**
 * GET /auth/verify-email?token=...
 * Marks the user's email as verified.
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      throw new AppError('Verification token is required.', 400);
    }

    const result = await db.query(
      `SELECT id, first_name FROM users
       WHERE verification_token = $1
         AND verification_token_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('This verification link is invalid or has expired.', 400);
    }

    const user = result.rows[0];

    await db.query(
      `UPDATE users
       SET email_verified = TRUE,
           verification_token = NULL,
           verification_token_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    await auditLog({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      resourceType: 'user',
      resourceId: user.id,
      ip: req.ip,
    });

    res.json({
      status: 'success',
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (err) {
    if (err.isOperational) return next(err);
    return next(err);
  }
};

/**
 * POST /auth/resend-verification
 * Re-sends the verification email for an unverified account.
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required.', 400);
    }

    const result = await db.query(
      'SELECT id, first_name, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Don't leak whether the email exists
      return res.json({ status: 'success', message: 'If that email is registered, a new verification link has been sent.' });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      throw new AppError('This email address is already verified.', 400);
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
      [verificationToken, verificationExpires, user.id]
    );

    await sendRegistrationVerificationEmail(email, user.first_name, verificationToken);

    res.json({
      status: 'success',
      message: 'If that email is registered, a new verification link has been sent.',
    });
  } catch (err) {
    if (err.isOperational) return next(err);
    return next(err);
  }
};

/**
 * POST /auth/forgot-password
 * Sends a 6-digit OTP to the user's email to begin the password-reset flow.
 */
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const result = await db.query(
      'SELECT id, first_name, email_verified FROM users WHERE email = $1',
      [email]
    );

    // Always respond the same way to prevent email enumeration
    if (result.rows.length === 0 || !result.rows[0].email_verified) {
      return res.json({
        status: 'success',
        message: 'If that email is registered and verified, a reset code has been sent.',
      });
    }

    const user = result.rows[0];
    const otp = crypto.randomInt(100000, 999999).toString();

    await redis.set(
      `pwd_reset_otp:${user.id}`,
      JSON.stringify({ otp, attempts: 0 }),
      'EX',
      config.otp.ttlSeconds
    );

    await sendPasswordResetOtpEmail(email, user.first_name, otp);

    await auditLog({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resourceType: 'user',
      resourceId: user.id,
      ip: req.ip,
    });

    return res.json({
      status: 'success',
      message: 'If that email is registered and verified, a reset code has been sent.',
    });
  } catch (err) {
    if (err.isOperational) return next(err);
    return next(err);
  }
};

/**
 * POST /auth/verify-reset-otp
 * Validates the OTP and returns a short-lived reset token.
 */
const verifyResetOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  try {
    const result = await db.query(
      'SELECT id FROM users WHERE email = $1 AND email_verified = TRUE',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired reset code.', 401);
    }

    const user = result.rows[0];
    const raw = await redis.get(`pwd_reset_otp:${user.id}`);

    if (!raw) {
      throw new AppError('Reset code has expired. Please request a new one.', 401);
    }

    const record = JSON.parse(raw);

    if (record.attempts >= config.otp.maxAttempts) {
      await redis.del(`pwd_reset_otp:${user.id}`);
      throw new AppError('Too many incorrect attempts. Please request a new reset code.', 429);
    }

    if (record.otp !== otp.trim()) {
      const ttl = await redis.ttl(`pwd_reset_otp:${user.id}`);
      await redis.set(
        `pwd_reset_otp:${user.id}`,
        JSON.stringify({ otp: record.otp, attempts: record.attempts + 1 }),
        'EX',
        ttl > 0 ? ttl : config.otp.ttlSeconds
      );
      const remaining = config.otp.maxAttempts - record.attempts - 1;
      throw new AppError(
        `Invalid reset code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        401
      );
    }

    // OTP valid — delete it and issue a one-time reset token (5 minutes)
    await redis.del(`pwd_reset_otp:${user.id}`);
    const resetToken = crypto.randomBytes(32).toString('hex');
    await redis.set(`pwd_reset_token:${user.id}`, resetToken, 'EX', 300);

    return res.json({
      status: 'success',
      message: 'Code verified. You may now reset your password.',
      data: { resetToken, userId: user.id },
    });
  } catch (err) {
    if (err.isOperational) return next(err);
    return next(err);
  }
};

/**
 * POST /auth/reset-password
 * Sets a new password using the reset token issued by verifyResetOtp.
 */
const resetPassword = async (req, res, next) => {
  const { userId, resetToken, newPassword } = req.body;
  try {
    const storedToken = await redis.get(`pwd_reset_token:${userId}`);

    if (!storedToken || storedToken !== resetToken) {
      throw new AppError('Invalid or expired reset token. Please start over.', 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );

    // Invalidate reset token immediately
    await redis.del(`pwd_reset_token:${userId}`);

    await auditLog({
      userId,
      action: 'PASSWORD_RESET',
      resourceType: 'user',
      resourceId: userId,
      ip: req.ip,
    });

    return res.json({
      status: 'success',
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (err) {
    if (err.isOperational) return next(err);
    return next(err);
  }
};

module.exports = { register, login, verifyOtp, verifyEmail, resendVerification, forgotPassword, verifyResetOtp, resetPassword };
