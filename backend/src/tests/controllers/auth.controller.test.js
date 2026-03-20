const mockQuery = jest.fn()
const mockRedisGet = jest.fn()
const mockRedisSet = jest.fn()
const mockRedisDel = jest.fn()

jest.mock('../../config/database', () => ({
  query: (...args) => mockQuery(...args),
  getClient: jest.fn(),
}))

jest.mock('../../config/redis', () => ({
  get: (...args) => mockRedisGet(...args),
  set: (...args) => mockRedisSet(...args),
  del: (...args) => mockRedisDel(...args),
}))

jest.mock('../../config', () => ({
  jwtSecret: 'test-secret',
  jwtExpiresIn: '15m',
  refreshTokenTTL: 604800,
  otp: { ttlSeconds: 600, maxAttempts: 3 },
}))

jest.mock('../../utils/auditLog', () => jest.fn().mockResolvedValue(undefined))
jest.mock('../../utils/emailService', () => ({
  sendLoginOtpEmail: jest.fn().mockResolvedValue(undefined),
  sendRegistrationVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetOtpEmail: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('../../utils/permissions', () => ({
  getUserPermissions: jest.fn().mockResolvedValue(['view_own_profile']),
}))

const bcrypt = require('bcryptjs')
const { login, verifyOtp, verifyEmail, resendVerification, forgotPassword, verifyResetOtp, resetPassword, refresh, logout, getMyPermissions } = require('../../controllers/auth.controller')

function makeReq(body = {}, query = {}) {
  return { body, query, ip: '127.0.0.1', user: null }
}

function makeRes() {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
  return res
}

beforeEach(() => {
  mockQuery.mockReset()
  mockRedisGet.mockReset()
  mockRedisSet.mockReset()
  mockRedisDel.mockReset()
  jest.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────────────────────
describe('login', () => {
  const HASHED = bcrypt.hashSync('Str0ng@Pass', 10)

  const ACTIVE_USER = {
    id: 'usr-1',
    email: 'doc@example.com',
    password_hash: HASHED,
    first_name: 'Kamal',
    last_name: 'Perera',
    role: 'doctor',
    is_active: true,
    email_verified: true,
  }

  test('returns otp_required with masked email on valid credentials', async () => {
    mockQuery.mockResolvedValue({ rows: [ACTIVE_USER] })
    mockRedisSet.mockResolvedValue('OK')
    const { sendLoginOtpEmail } = require('../../utils/emailService')
    sendLoginOtpEmail.mockResolvedValue(undefined)

    const req = makeReq({ email: 'doc@example.com', password: 'Str0ng@Pass' })
    const res = makeRes()
    const next = jest.fn()

    await login(req, res, next)

    expect(res.status).toHaveBeenCalledWith(200)
    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('otp_required')
    expect(body.data.email).toMatch(/\*\*\*/)
    expect(body.data.pendingLoginToken).toBeDefined()
    expect(next).not.toHaveBeenCalled()
  })

  test('calls next with 401 for wrong password', async () => {
    mockQuery.mockResolvedValue({ rows: [ACTIVE_USER] })

    const req = makeReq({ email: 'doc@example.com', password: 'WrongPass@1' })
    const res = makeRes()
    const next = jest.fn()

    await login(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  test('calls next with 401 for unknown email', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ email: 'nobody@example.com', password: 'Str0ng@Pass' })
    const res = makeRes()
    const next = jest.fn()

    await login(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  test('calls next with 403 when email is not verified', async () => {
    mockQuery.mockResolvedValue({ rows: [{ ...ACTIVE_USER, email_verified: false }] })

    const req = makeReq({ email: 'doc@example.com', password: 'Str0ng@Pass' })
    const res = makeRes()
    const next = jest.fn()

    await login(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('calls next with 403 when account is inactive', async () => {
    mockQuery.mockResolvedValue({ rows: [{ ...ACTIVE_USER, is_active: false }] })

    const req = makeReq({ email: 'doc@example.com', password: 'Str0ng@Pass' })
    const res = makeRes()
    const next = jest.fn()

    await login(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })
})

// ──────────────────────────────────────────────────────────────
// VERIFY OTP
// ──────────────────────────────────────────────────────────────
describe('verifyOtp', () => {
  const ACTIVE_USER = {
    id: 'usr-1',
    email: 'doc@example.com',
    first_name: 'Kamal',
    last_name: 'Perera',
    role: 'doctor',
    is_active: true,
    email_verified: true,
  }

  const PENDING_TOKEN = 'pending-token-abc'
  const OTP_RECORD = JSON.stringify({ otp: '123456', attempts: 0, pendingLoginToken: PENDING_TOKEN })

  test('returns JWT tokens on valid OTP', async () => {
    mockQuery.mockResolvedValue({ rows: [ACTIVE_USER] })
    mockRedisGet.mockResolvedValue(OTP_RECORD)
    mockRedisDel.mockResolvedValue(1)
    mockRedisSet.mockResolvedValue('OK')

    const req = makeReq({ email: 'doc@example.com', otp: '123456', pendingLoginToken: PENDING_TOKEN })
    const res = makeRes()
    const next = jest.fn()

    await verifyOtp(req, res, next)

    expect(next).not.toHaveBeenCalled()
    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('success')
    expect(body.data.token).toBeDefined()
    expect(body.data.refreshToken).toBeDefined()
    expect(body.data.user.role).toBe('doctor')
  })

  test('returns 401 for wrong OTP', async () => {
    mockQuery.mockResolvedValue({ rows: [ACTIVE_USER] })
    mockRedisGet.mockResolvedValue(OTP_RECORD)
    mockRedisSet.mockResolvedValue('OK')

    const req = makeReq({ email: 'doc@example.com', otp: '999999', pendingLoginToken: PENDING_TOKEN })
    const res = makeRes()
    const next = jest.fn()

    await verifyOtp(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  test('returns 401 when OTP has expired (no Redis record)', async () => {
    mockQuery.mockResolvedValue({ rows: [ACTIVE_USER] })
    mockRedisGet.mockResolvedValue(null)

    const req = makeReq({ email: 'doc@example.com', otp: '123456', pendingLoginToken: PENDING_TOKEN })
    const res = makeRes()
    const next = jest.fn()

    await verifyOtp(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  test('returns 429 when max attempts exceeded', async () => {
    mockQuery.mockResolvedValue({ rows: [ACTIVE_USER] })
    mockRedisGet.mockResolvedValue(
      JSON.stringify({ otp: '123456', attempts: 3, pendingLoginToken: PENDING_TOKEN })
    )
    mockRedisDel.mockResolvedValue(1)

    const req = makeReq({ email: 'doc@example.com', otp: '123456', pendingLoginToken: PENDING_TOKEN })
    const res = makeRes()
    const next = jest.fn()

    await verifyOtp(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 429 }))
  })

  test('returns 401 for wrong pendingLoginToken', async () => {
    mockQuery.mockResolvedValue({ rows: [ACTIVE_USER] })
    mockRedisGet.mockResolvedValue(OTP_RECORD)

    const req = makeReq({ email: 'doc@example.com', otp: '123456', pendingLoginToken: 'wrong-token' })
    const res = makeRes()
    const next = jest.fn()

    await verifyOtp(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  test('returns 401 for nonexistent user', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ email: 'nobody@example.com', otp: '123456', pendingLoginToken: PENDING_TOKEN })
    const res = makeRes()
    const next = jest.fn()

    await verifyOtp(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })
})

// ──────────────────────────────────────────────────────────────
// VERIFY EMAIL
// ──────────────────────────────────────────────────────────────
describe('verifyEmail', () => {
  test('verifies email with valid token', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'usr-1', first_name: 'John' }] })
      .mockResolvedValueOnce({ rows: [] })

    const req = makeReq({}, { token: 'valid-token-abc' })
    const res = makeRes()
    const next = jest.fn()

    await verifyEmail(req, res, next)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }))
  })

  test('returns 400 for missing token', async () => {
    const req = makeReq({}, {})
    const res = makeRes()
    const next = jest.fn()

    await verifyEmail(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 400 for invalid or expired token', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({}, { token: 'invalid-token' })
    const res = makeRes()
    const next = jest.fn()

    await verifyEmail(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })
})

// ──────────────────────────────────────────────────────────────
// RESEND VERIFICATION
// ──────────────────────────────────────────────────────────────
describe('resendVerification', () => {
  test('returns generic success for unregistered email', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ email: 'nobody@example.com' })
    const res = makeRes()
    const next = jest.fn()

    await resendVerification(req, res, next)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }))
  })

  test('returns generic success for already-verified email', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 'usr-1', first_name: 'John', email_verified: true }] })

    const req = makeReq({ email: 'verified@example.com' })
    const res = makeRes()
    const next = jest.fn()

    await resendVerification(req, res, next)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }))
  })

  test('sends new verification email for unverified account', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'usr-1', first_name: 'John', email_verified: false }] })
      .mockResolvedValueOnce({ rows: [] })

    const { sendRegistrationVerificationEmail } = require('../../utils/emailService')
    sendRegistrationVerificationEmail.mockResolvedValue(undefined)

    const req = makeReq({ email: 'unverified@example.com' })
    const res = makeRes()
    const next = jest.fn()

    await resendVerification(req, res, next)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }))
  })
})

// ──────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ──────────────────────────────────────────────────────────────
describe('forgotPassword', () => {
  test('returns generic message for unknown email', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ email: 'nobody@example.com' })
    const res = makeRes()
    const next = jest.fn()

    await forgotPassword(req, res, next)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }))
  })

  test('returns generic message for unverified email', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 'usr-1', first_name: 'John', email_verified: false }] })

    const req = makeReq({ email: 'unverified@example.com' })
    const res = makeRes()
    const next = jest.fn()

    await forgotPassword(req, res, next)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }))
  })

  test('sends reset OTP for verified email', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 'usr-1', first_name: 'John', email_verified: true }] })
    mockRedisSet.mockResolvedValue('OK')
    const { sendPasswordResetOtpEmail } = require('../../utils/emailService')
    sendPasswordResetOtpEmail.mockResolvedValue(undefined)

    const req = makeReq({ email: 'verified@example.com' })
    const res = makeRes()
    const next = jest.fn()

    await forgotPassword(req, res, next)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }))
    expect(mockRedisSet).toHaveBeenCalled()
  })
})

// ──────────────────────────────────────────────────────────────
// VERIFY RESET OTP
// ──────────────────────────────────────────────────────────────
describe('verifyResetOtp', () => {
  test('returns resetToken on valid OTP', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 'usr-1' }] })
    mockRedisGet.mockResolvedValue(JSON.stringify({ otp: '654321', attempts: 0 }))
    mockRedisDel.mockResolvedValue(1)
    mockRedisSet.mockResolvedValue('OK')

    const req = makeReq({ email: 'user@example.com', otp: '654321' })
    const res = makeRes()
    const next = jest.fn()

    await verifyResetOtp(req, res, next)

    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('success')
    expect(body.data.resetToken).toBeDefined()
    expect(body.data.userId).toBe('usr-1')
  })

  test('returns 401 for wrong OTP', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 'usr-1' }] })
    mockRedisGet.mockResolvedValue(JSON.stringify({ otp: '654321', attempts: 0 }))
    mockRedisSet.mockResolvedValue('OK')

    const req = makeReq({ email: 'user@example.com', otp: '000000' })
    const res = makeRes()
    const next = jest.fn()

    await verifyResetOtp(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  test('returns 401 when OTP not found in Redis', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 'usr-1' }] })
    mockRedisGet.mockResolvedValue(null)

    const req = makeReq({ email: 'user@example.com', otp: '654321' })
    const res = makeRes()
    const next = jest.fn()

    await verifyResetOtp(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  test('returns 429 when max attempts exceeded', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 'usr-1' }] })
    mockRedisGet.mockResolvedValue(JSON.stringify({ otp: '654321', attempts: 3 }))
    mockRedisDel.mockResolvedValue(1)

    const req = makeReq({ email: 'user@example.com', otp: '654321' })
    const res = makeRes()
    const next = jest.fn()

    await verifyResetOtp(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 429 }))
  })
})

// ──────────────────────────────────────────────────────────────
// RESET PASSWORD
// ──────────────────────────────────────────────────────────────
describe('resetPassword', () => {
  test('resets password with valid reset token', async () => {
    mockRedisGet.mockResolvedValue('valid-reset-token')
    mockQuery.mockResolvedValue({ rows: [] })
    mockRedisDel.mockResolvedValue(1)

    const req = makeReq({ userId: 'usr-1', resetToken: 'valid-reset-token', newPassword: 'NewStr0ng@Pass' })
    const res = makeRes()
    const next = jest.fn()

    await resetPassword(req, res, next)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }))
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET password_hash'),
      expect.any(Array)
    )
  })

  test('returns 401 for invalid reset token', async () => {
    mockRedisGet.mockResolvedValue('correct-token')

    const req = makeReq({ userId: 'usr-1', resetToken: 'wrong-token', newPassword: 'NewStr0ng@Pass' })
    const res = makeRes()
    const next = jest.fn()

    await resetPassword(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  test('returns 401 when reset token not in Redis', async () => {
    mockRedisGet.mockResolvedValue(null)

    const req = makeReq({ userId: 'usr-1', resetToken: 'any-token', newPassword: 'NewStr0ng@Pass' })
    const res = makeRes()
    const next = jest.fn()

    await resetPassword(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })
})

// ──────────────────────────────────────────────────────────────
// REFRESH TOKEN
// ──────────────────────────────────────────────────────────────
describe('refresh', () => {
  const ACTIVE_USER = {
    id: 'usr-1', email: 'doc@example.com', first_name: 'Kamal',
    last_name: 'Perera', role: 'doctor', is_active: true,
  }

  test('rotates refresh token and returns new tokens', async () => {
    mockRedisGet.mockResolvedValue('usr-1')
    mockQuery.mockResolvedValue({ rows: [ACTIVE_USER] })
    mockRedisDel.mockResolvedValue(1)
    mockRedisSet.mockResolvedValue('OK')

    const req = makeReq({ refreshToken: 'valid-refresh-token' })
    const res = makeRes()
    const next = jest.fn()

    await refresh(req, res, next)

    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('success')
    expect(body.data.token).toBeDefined()
    expect(body.data.refreshToken).toBeDefined()
    expect(mockRedisDel).toHaveBeenCalledWith('refresh:valid-refresh-token')
  })

  test('returns 400 when refreshToken is missing', async () => {
    const req = makeReq({})
    const res = makeRes()
    const next = jest.fn()

    await refresh(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 401 for invalid refresh token', async () => {
    mockRedisGet.mockResolvedValue(null)

    const req = makeReq({ refreshToken: 'invalid-token' })
    const res = makeRes()
    const next = jest.fn()

    await refresh(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  test('returns 401 when user is inactive', async () => {
    mockRedisGet.mockResolvedValue('usr-1')
    mockQuery.mockResolvedValue({ rows: [{ ...ACTIVE_USER, is_active: false }] })
    mockRedisDel.mockResolvedValue(1)

    const req = makeReq({ refreshToken: 'old-token' })
    const res = makeRes()
    const next = jest.fn()

    await refresh(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })
})

// ──────────────────────────────────────────────────────────────
// LOGOUT
// ──────────────────────────────────────────────────────────────
describe('logout', () => {
  test('deletes refresh token from Redis', async () => {
    mockRedisDel.mockResolvedValue(1)

    const req = { ...makeReq({ refreshToken: 'my-token' }), user: { id: 'usr-1' } }
    const res = makeRes()
    const next = jest.fn()

    await logout(req, res, next)

    expect(mockRedisDel).toHaveBeenCalledWith('refresh:my-token')
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }))
  })

  test('succeeds even without refreshToken in body', async () => {
    const req = { ...makeReq({}), user: { id: 'usr-1' } }
    const res = makeRes()
    const next = jest.fn()

    await logout(req, res, next)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }))
  })
})

// ──────────────────────────────────────────────────────────────
// GET MY PERMISSIONS
// ──────────────────────────────────────────────────────────────
describe('getMyPermissions', () => {
  test('returns permissions for authenticated user', async () => {
    const { getUserPermissions } = require('../../utils/permissions')
    getUserPermissions.mockResolvedValue(['view_patients', 'create_appointment'])

    const req = { user: { id: 'usr-1' }, ip: '127.0.0.1' }
    const res = makeRes()
    const next = jest.fn()

    await getMyPermissions(req, res, next)

    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('success')
    expect(body.data).toContain('view_patients')
  })
})
