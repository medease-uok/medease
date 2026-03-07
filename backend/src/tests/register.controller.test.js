const bcrypt = require('bcryptjs');
const { PATIENT_BODY, DOCTOR_BODY, NURSE_BODY, PHARMACIST_BODY, LAB_TECH_BODY, USER_ROW } = require('./fixtures/register.fixtures');

const mockQuery = jest.fn();
const mockClientQuery = jest.fn();
const mockClientRelease = jest.fn();
const mockGetClient = jest.fn(() => ({
  query: mockClientQuery,
  release: mockClientRelease,
}));

jest.mock('../config/database', () => ({
  query: (...args) => mockQuery(...args),
  getClient: () => mockGetClient(),
}));

jest.mock('../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

jest.mock('../config', () => ({
  jwtSecret: 'test-secret',
  jwtExpiresIn: '1h',
  refreshTokenTTL: 604800,
}));

jest.mock('../utils/auditLog', () => jest.fn().mockResolvedValue(undefined));

const { register } = require('../controllers/auth.controller');
const auditLog = require('../utils/auditLog');

function mockReq(body = {}) {
  return { body, ip: '127.0.0.1' };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockNext() {
  return jest.fn();
}

function setupSuccessfulRegistration(userRow = USER_ROW) {
  mockClientQuery.mockResolvedValueOnce({ rows: [] });
  mockClientQuery.mockResolvedValueOnce(undefined);
  mockClientQuery.mockResolvedValueOnce({ rows: [userRow] });
  mockClientQuery.mockResolvedValueOnce({ rows: [] });
  mockClientQuery.mockResolvedValueOnce({ rows: [] });
  mockClientQuery.mockResolvedValueOnce(undefined);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('register controller', () => {
  describe('successful registration', () => {
    test('registers a patient and returns 201 with user data', async () => {
      setupSuccessfulRegistration();

      const req = mockReq(PATIENT_BODY);
      const res = mockRes();
      const next = mockNext();

      await register(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: expect.stringContaining('verify your email'),
          data: {
            user: expect.objectContaining({
              id: 'uuid-1',
              email: 'sarah@example.com',
              firstName: 'Sarah',
              lastName: 'Fernando',
              role: 'patient',
              isActive: false,
            }),
          },
        })
      );
    });

    test('registers a doctor with specialization and license', async () => {
      const doctorRow = { ...USER_ROW, email: 'kamal@example.com', first_name: 'Kamal', last_name: 'Perera', role: 'doctor' };
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);
      mockClientQuery.mockResolvedValueOnce({ rows: [doctorRow] });
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);

      const req = mockReq(DOCTOR_BODY);
      const res = mockRes();
      const next = mockNext();

      await register(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);

      const doctorInsertCall = mockClientQuery.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO doctors')
      );
      expect(doctorInsertCall).toBeTruthy();
      expect(doctorInsertCall[1]).toEqual(
        expect.arrayContaining(['Cardiology', 'SLMC-12345', 'Cardiology'])
      );
    });

    test('registers a nurse with license and department', async () => {
      const nurseRow = { ...USER_ROW, email: 'malini@example.com', first_name: 'Malini', last_name: 'Bandara', role: 'nurse' };
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);
      mockClientQuery.mockResolvedValueOnce({ rows: [nurseRow] });
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);

      const req = mockReq(NURSE_BODY);
      const res = mockRes();
      const next = mockNext();

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);

      const nurseInsertCall = mockClientQuery.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO nurses')
      );
      expect(nurseInsertCall).toBeTruthy();
      expect(nurseInsertCall[1]).toEqual(
        expect.arrayContaining(['SLNC-54321', 'Emergency'])
      );
    });

    test('registers a pharmacist with license', async () => {
      const pharmacistRow = { ...USER_ROW, email: 'tharindu@example.com', first_name: 'Tharindu', last_name: 'Gamage', role: 'pharmacist' };
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);
      mockClientQuery.mockResolvedValueOnce({ rows: [pharmacistRow] });
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);

      const req = mockReq(PHARMACIST_BODY);
      const res = mockRes();
      const next = mockNext();

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);

      const pharmacistInsertCall = mockClientQuery.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO pharmacists')
      );
      expect(pharmacistInsertCall).toBeTruthy();
    });

    test('registers a lab technician (no profile table insert)', async () => {
      const labRow = { ...USER_ROW, email: 'nimal@example.com', first_name: 'Nimal', last_name: 'Wijesinghe', role: 'lab_technician' };
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);
      mockClientQuery.mockResolvedValueOnce({ rows: [labRow] });
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);

      const req = mockReq(LAB_TECH_BODY);
      const res = mockRes();
      const next = mockNext();

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);

      const profileInserts = mockClientQuery.mock.calls.filter(
        ([sql]) => typeof sql === 'string' && /INSERT INTO (patients|doctors|nurses|pharmacists)/.test(sql)
      );
      expect(profileInserts).toHaveLength(0);
    });

    test('new user is created with is_active = false (pending approval)', async () => {
      setupSuccessfulRegistration();

      const req = mockReq(PATIENT_BODY);
      const res = mockRes();
      const next = mockNext();

      await register(req, res, next);

      const userInsertCall = mockClientQuery.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO users')
      );
      expect(userInsertCall[0]).toContain('false');
      expect(res.json.mock.calls[0][0].data.user.isActive).toBe(false);
    });

    test('assigns the correct role via user_roles table', async () => {
      setupSuccessfulRegistration();

      const req = mockReq(PATIENT_BODY);
      const res = mockRes();
      const next = mockNext();

      await register(req, res, next);

      const roleInsertCall = mockClientQuery.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO user_roles')
      );
      expect(roleInsertCall).toBeTruthy();
      expect(roleInsertCall[1]).toEqual(['uuid-1', 'patient']);
    });
  });

  describe('password hashing', () => {
    test('hashes the password with bcrypt before storing', async () => {
      setupSuccessfulRegistration();
      const hashSpy = jest.spyOn(bcrypt, 'hash');

      await register(mockReq(PATIENT_BODY), mockRes(), mockNext());

      expect(hashSpy).toHaveBeenCalledWith('Str0ng@Pass', 12);
      hashSpy.mockRestore();
    });

    test('stores the hash, not the plaintext password', async () => {
      setupSuccessfulRegistration();

      await register(mockReq(PATIENT_BODY), mockRes(), mockNext());

      const userInsertCall = mockClientQuery.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO users')
      );
      const params = userInsertCall[1];
      expect(params[1]).not.toBe('Str0ng@Pass');
      expect(params[1]).toMatch(/^\$2[aby]\$/);
    });

    test('never returns the password hash in the response', async () => {
      setupSuccessfulRegistration();
      const res = mockRes();

      await register(mockReq(PATIENT_BODY), res, mockNext());

      const responseBody = JSON.stringify(res.json.mock.calls[0][0]);
      expect(responseBody).not.toContain('password');
      expect(responseBody).not.toContain('hash');
    });
  });

  describe('duplicate detection', () => {
    test('rejects duplicate email with 409', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] });
      const next = mockNext();

      await register(mockReq(PATIENT_BODY), mockRes(), next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('email already exists'),
          statusCode: 409,
        })
      );
    });

    test('rejects duplicate license number for doctor with 409', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'dup-license' }] });
      const next = mockNext();

      await register(mockReq(DOCTOR_BODY), mockRes(), next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('license number is already registered'),
          statusCode: 409,
        })
      );
    });

    test('rejects duplicate license number for nurse with 409', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'dup-license' }] });
      const next = mockNext();

      await register(mockReq(NURSE_BODY), mockRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
    });

    test('rejects duplicate license number for pharmacist with 409', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'dup-license' }] });
      const next = mockNext();

      await register(mockReq(PHARMACIST_BODY), mockRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
    });

    test('handles PostgreSQL unique constraint on email (23505)', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);
      const dbError = new Error('unique_violation');
      dbError.code = '23505';
      dbError.constraint = 'users_email_key';
      mockClientQuery.mockRejectedValueOnce(dbError);
      const next = mockNext();

      await register(mockReq(PATIENT_BODY), mockRes(), next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('email already exists'),
          statusCode: 409,
        })
      );
    });

    test('handles PostgreSQL unique constraint on license_number (23505)', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);
      mockClientQuery.mockResolvedValueOnce({ rows: [{ ...USER_ROW, role: 'doctor' }] });
      const dbError = new Error('unique_violation');
      dbError.code = '23505';
      dbError.constraint = 'doctors_license_number_key';
      mockClientQuery.mockRejectedValueOnce(dbError);
      const next = mockNext();

      await register(mockReq(DOCTOR_BODY), mockRes(), next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('license number is already registered'),
          statusCode: 409,
        })
      );
    });

    test('handles generic 23505 constraint violation', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);
      const dbError = new Error('unique_violation');
      dbError.code = '23505';
      dbError.constraint = 'some_other_constraint';
      mockClientQuery.mockRejectedValueOnce(dbError);
      const next = mockNext();

      await register(mockReq(PATIENT_BODY), mockRes(), next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('already exists'),
          statusCode: 409,
        })
      );
    });
  });

  describe('transaction safety', () => {
    test('uses BEGIN and COMMIT for successful registration', async () => {
      setupSuccessfulRegistration();

      await register(mockReq(PATIENT_BODY), mockRes(), mockNext());

      const sqlCalls = mockClientQuery.mock.calls.map(([sql]) => sql);
      expect(sqlCalls).toContain('BEGIN');
      expect(sqlCalls).toContain('COMMIT');
    });

    test('rolls back on database error', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);
      mockClientQuery.mockRejectedValueOnce(new Error('DB error'));

      await register(mockReq(PATIENT_BODY), mockRes(), mockNext());

      const sqlCalls = mockClientQuery.mock.calls.map(([sql]) => sql);
      expect(sqlCalls).toContain('ROLLBACK');
      expect(sqlCalls).not.toContain('COMMIT');
    });

    test('always releases the database client', async () => {
      setupSuccessfulRegistration();

      await register(mockReq(PATIENT_BODY), mockRes(), mockNext());

      expect(mockClientRelease).toHaveBeenCalledTimes(1);
    });

    test('releases the client even after errors', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);
      mockClientQuery.mockRejectedValueOnce(new Error('crash'));

      await register(mockReq(PATIENT_BODY), mockRes(), mockNext());

      expect(mockClientRelease).toHaveBeenCalledTimes(1);
    });
  });

  describe('audit logging', () => {
    test('logs successful registration with user ID', async () => {
      setupSuccessfulRegistration();

      await register(mockReq(PATIENT_BODY), mockRes(), mockNext());

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid-1',
          action: 'REGISTER',
          resourceType: 'user',
          resourceId: 'uuid-1',
          ip: '127.0.0.1',
        })
      );
    });

    test('logs failed registration with success: false', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'existing' }] });

      await register(mockReq(PATIENT_BODY), mockRes(), mockNext());

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
          action: 'REGISTER',
          success: false,
        })
      );
    });
  });

  describe('patient-specific profile', () => {
    test('inserts patient profile with all fields', async () => {
      setupSuccessfulRegistration();

      await register(mockReq(PATIENT_BODY), mockRes(), mockNext());

      const patientInsertCall = mockClientQuery.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO patients')
      );
      expect(patientInsertCall).toBeTruthy();
      const params = patientInsertCall[1];
      expect(params).toContain('1990-05-15');
      expect(params).toContain('female');
      expect(params).toContain('O+');
    });

    test('handles optional patient fields as null', async () => {
      setupSuccessfulRegistration();

      await register(mockReq({
        firstName: 'Min', lastName: 'Pat', email: 'min@example.com',
        role: 'patient', password: 'Str0ng@Pass', confirmPassword: 'Str0ng@Pass',
        dateOfBirth: '2000-01-01', gender: 'male',
      }), mockRes(), mockNext());

      const patientInsertCall = mockClientQuery.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO patients')
      );
      expect(patientInsertCall[1].filter((p) => p === null).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('optional fields', () => {
    test('stores phone as null when not provided', async () => {
      const noPhoneBody = { ...PATIENT_BODY };
      delete noPhoneBody.phone;
      setupSuccessfulRegistration();

      await register(mockReq(noPhoneBody), mockRes(), mockNext());

      const userInsertCall = mockClientQuery.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO users')
      );
      expect(userInsertCall[1][5]).toBeNull();
    });
  });

  describe('error handling', () => {
    test('passes operational errors to next()', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'exists' }] });
      const next = mockNext();

      await register(mockReq(PATIENT_BODY), mockRes(), next);

      const error = next.mock.calls[0][0];
      expect(error.isOperational).toBe(true);
      expect(error.statusCode).toBe(409);
    });

    test('passes unexpected errors to next()', async () => {
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      mockClientQuery.mockResolvedValueOnce(undefined);
      const unexpectedError = new Error('Connection lost');
      mockClientQuery.mockRejectedValueOnce(unexpectedError);
      const next = mockNext();

      await register(mockReq(PATIENT_BODY), mockRes(), next);

      expect(next).toHaveBeenCalledWith(unexpectedError);
    });
  });
});
