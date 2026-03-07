const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const redis = require('../config/redis');
const config = require('../config');
const AppError = require('../utils/AppError');
const auditLog = require('../utils/auditLog');
const { sendLoginOtpEmail, sendRegistrationVerificationEmail, sendPasswordResetOtpEmail } = require('../utils/emailService');
const { getUserPermissions } = require('../utils/permissions');

/** Masks most of an email address for safe display, e.g. jo***@example.com */
function maskEmail(email) {
  const atIndex = email.lastIndexOf('@');
  if (atIndex < 1) return '***@***';
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

/** Redis key helpers */
const otpKey = (userId) => `login_otp:${userId}`;
const pwdResetOtpKey = (userId) => `pwd_reset_otp:${userId}`;
const pwdResetTokenKey = (userId) => `pwd_reset_token:${userId}`;

const SALT_ROUNDS = 12;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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

    // Admins are auto-verified; all other roles must verify via email
    if (role === 'admin') {
      await db.query(
        'UPDATE users SET email_verified = TRUE WHERE id = $1',
        [user.id]
      );
    } else {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
      await db.query(
        'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
        [verificationToken, verificationExpires, user.id]
      );

      // Send verification email (fire-and-forget; registration still succeeds if SMTP is down)
      try {
        await sendRegistrationVerificationEmail(email, firstName, verificationToken);
      } catch (emailErr) {
        console.error('Failed to send verification email:', emailErr.message);
      }
    }

    await auditLog({
      userId: user.id,
      action: 'REGISTER',
      resourceType: 'user',
      resourceId: user.id,
      ip: req.ip,
    });

    res.status(201).json({
      status: 'success',
      message: role === 'admin'
        ? 'Registration successful. Your account is pending approval.'
        : 'Registration successful. Please verify your email before logging in.',
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

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active, email_verified FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    // Use the same error message for wrong email or password to prevent enumeration
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

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

    // Generate a cryptographically-random 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Session-binding token to prevent OTP from being used from a different client
    const pendingLoginToken = crypto.randomBytes(32).toString('hex');

    // Store in Redis: { otp, attempts, pendingLoginToken } - expires after OTP_TTL_SECONDS
    await redis.set(
      otpKey(user.id),
      JSON.stringify({ otp, attempts: 0, pendingLoginToken }),
      'EX',
      config.otp.ttlSeconds
    );

    // Send OTP email
    await sendLoginOtpEmail(user.email, user.first_name, otp);

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
        pendingLoginToken,
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

/**
 * POST /auth/verify-otp
 * Validates the emailed OTP and, on success, returns the JWT access + refresh tokens.
 */
const verifyOtp = async (req, res, next) => {
  const { email, otp, pendingLoginToken } = req.body;

  try {
    const result = await db.query(
      'SELECT id, email, first_name, last_name, role, is_active, email_verified FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    // Single generic error for all invalid states to prevent user enumeration
    const genericError = new AppError('Invalid or expired verification code.', 401);

    if (!user || !user.is_active || !user.email_verified) {
      throw genericError;
    }

    const raw = await redis.get(otpKey(user.id));
    if (!raw) {
      throw genericError;
    }

    const record = JSON.parse(raw);

    // Verify session binding — the pendingLoginToken must match the one issued at login
    if (record.pendingLoginToken && record.pendingLoginToken !== pendingLoginToken) {
      throw genericError;
    }

    if (record.attempts >= config.otp.maxAttempts) {
      await redis.del(otpKey(user.id));
      throw new AppError(
        'Too many incorrect attempts. Please log in again to request a new code.',
        429
      );
    }

    if (record.otp !== otp.trim()) {
      await redis.set(
        otpKey(user.id),
        JSON.stringify({ ...record, attempts: record.attempts + 1 }),
        'KEEPTTL'
      );
      const remaining = config.otp.maxAttempts - record.attempts - 1;
      throw new AppError(
        `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        401
      );
    }

    // OTP is valid - delete it from Redis immediately (single-use)
    await redis.del(otpKey(user.id));

    await auditLog({
      userId: user.id,
      action: 'LOGIN',
      resourceType: 'session',
      ip: req.ip,
    });

    const token = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    return res.json({
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
    if (!err.isOperational) {
      await auditLog({
        userId: null,
        action: 'LOGIN',
        resourceType: 'session',
        ip: req.ip,
        success: false,
      });
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

    const genericMessage = 'If that email is registered, a new verification link has been sent.';

    if (result.rows.length === 0) {
      return res.json({ status: 'success', message: genericMessage });
    }

    const user = result.rows[0];

    // Already verified — return same generic message to prevent enumeration
    if (user.email_verified) {
      return res.json({ status: 'success', message: genericMessage });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

    await db.query(
      'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
      [verificationToken, verificationExpires, user.id]
    );

    await sendRegistrationVerificationEmail(email, user.first_name, verificationToken);

    res.json({
      status: 'success',
      message: genericMessage,
    });
  } catch (err) {
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

    if (result.rows.length === 0 || !result.rows[0].email_verified) {
      return res.json({
        status: 'success',
        message: 'If that email is registered and verified, a reset code has been sent.',
      });
    }

    const user = result.rows[0];
    const otp = crypto.randomInt(100000, 999999).toString();

    await redis.set(
      pwdResetOtpKey(user.id),
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
    const raw = await redis.get(pwdResetOtpKey(user.id));

    if (!raw) {
      throw new AppError('Reset code has expired. Please request a new one.', 401);
    }

    const record = JSON.parse(raw);

    if (record.attempts >= config.otp.maxAttempts) {
      await redis.del(pwdResetOtpKey(user.id));
      throw new AppError('Too many incorrect attempts. Please request a new reset code.', 429);
    }

    if (record.otp !== otp.trim()) {
      await redis.set(
        pwdResetOtpKey(user.id),
        JSON.stringify({ otp: record.otp, attempts: record.attempts + 1 }),
        'KEEPTTL'
      );
      const remaining = config.otp.maxAttempts - record.attempts - 1;
      throw new AppError(
        `Invalid reset code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        401
      );
    }

    // OTP valid - delete it and issue a one-time reset token (5 minutes)
    await redis.del(pwdResetOtpKey(user.id));
    const resetToken = crypto.randomBytes(32).toString('hex');
    await redis.set(pwdResetTokenKey(user.id), resetToken, 'EX', 300);

    return res.json({
      status: 'success',
      message: 'Code verified. You may now reset your password.',
      data: { resetToken, userId: user.id },
    });
  } catch (err) {
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
    const storedToken = await redis.get(pwdResetTokenKey(userId));

    if (!storedToken || storedToken !== resetToken) {
      throw new AppError('Invalid or expired reset token. Please start over.', 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );

    await redis.del(pwdResetTokenKey(userId));

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

const getMyPermissions = async (req, res, next) => {
  try {
    const permissions = await getUserPermissions(req.user.id);
    res.json({ status: 'success', data: permissions });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  register, login, verifyOtp, verifyEmail, resendVerification,
  forgotPassword, verifyResetOtp, resetPassword,
  refresh, logout, getMyPermissions,
};
