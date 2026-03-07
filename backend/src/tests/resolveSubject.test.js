const { ADMIN, DOCTOR, PATIENT, NURSE, PHARMACIST, LAB_TECH } = require('./fixtures/rbac.fixtures');

const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();

jest.mock('../config/redis', () => ({
  get: (...args) => mockRedisGet(...args),
  set: (...args) => mockRedisSet(...args),
  del: jest.fn(),
}));

const mockDbQuery = jest.fn();
jest.mock('../config/database', () => ({
  query: (...args) => mockDbQuery(...args),
}));

const resolveSubject = require('../middleware/resolveSubject');

function runMiddleware(user) {
  return new Promise((resolve) => {
    const req = { user: user ? { ...user } : undefined };
    const res = {};
    resolveSubject(req, res, (err) => {
      resolve({ err, req });
    });
  });
}

beforeEach(() => {
  mockRedisGet.mockReset();
  mockRedisSet.mockReset();
  mockDbQuery.mockReset();
});

describe('resolveSubject middleware', () => {
  test('skips when no user is attached', async () => {
    const { err, req } = await runMiddleware(undefined);
    expect(err).toBeUndefined();
    expect(req.user).toBeUndefined();
    expect(mockRedisGet).not.toHaveBeenCalled();
  });

  test('uses cached subject from Redis', async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify({ patientId: 'pat-1' }));

    const { req } = await runMiddleware(PATIENT);
    expect(req.user.patientId).toBe('pat-1');
    expect(mockDbQuery).not.toHaveBeenCalled();
  });

  test('queries database for patient profile ID', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery.mockResolvedValue({ rows: [{ id: 'pat-profile-1' }] });

    const { req } = await runMiddleware({ id: 'patient-uuid', role: 'patient' });
    expect(req.user.patientId).toBe('pat-profile-1');
    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.stringContaining('patients'),
      ['patient-uuid']
    );
  });

  test('queries database for doctor profile ID', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery.mockResolvedValue({ rows: [{ id: 'doc-profile-1' }] });

    const { req } = await runMiddleware({ id: 'doctor-uuid', role: 'doctor' });
    expect(req.user.doctorId).toBe('doc-profile-1');
  });

  test('queries database for nurse profile ID', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery.mockResolvedValue({ rows: [{ id: 'nurse-profile-1' }] });

    const { req } = await runMiddleware({ id: 'nurse-uuid', role: 'nurse' });
    expect(req.user.nurseId).toBe('nurse-profile-1');
  });

  test('queries database for pharmacist profile ID', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery.mockResolvedValue({ rows: [{ id: 'pharma-profile-1' }] });

    const { req } = await runMiddleware({ id: 'pharma-uuid', role: 'pharmacist' });
    expect(req.user.pharmacistId).toBe('pharma-profile-1');
  });

  test('does not query profile table for admin', async () => {
    mockRedisGet.mockResolvedValue(null);

    const { req } = await runMiddleware({ id: 'admin-uuid', role: 'admin' });
    expect(mockDbQuery).not.toHaveBeenCalled();
    expect(req.user.patientId).toBeUndefined();
  });

  test('does not query profile table for lab_technician', async () => {
    mockRedisGet.mockResolvedValue(null);

    const { req } = await runMiddleware({ id: 'lab-uuid', role: 'lab_technician' });
    expect(mockDbQuery).not.toHaveBeenCalled();
  });

  test('caches result in Redis with 5 minute TTL', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery.mockResolvedValue({ rows: [{ id: 'doc-1' }] });

    await runMiddleware({ id: 'doctor-uuid', role: 'doctor' });
    expect(mockRedisSet).toHaveBeenCalledWith(
      'subject:doctor-uuid',
      JSON.stringify({ doctorId: 'doc-1' }),
      'EX',
      300
    );
  });

  test('handles missing profile gracefully', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery.mockResolvedValue({ rows: [] });

    const { err, req } = await runMiddleware({ id: 'patient-uuid', role: 'patient' });
    expect(err).toBeUndefined();
    expect(req.user.patientId).toBeUndefined();
  });

  test('handles database error gracefully', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery.mockRejectedValue(new Error('table does not exist'));

    const { err, req } = await runMiddleware({ id: 'patient-uuid', role: 'patient' });
    expect(err).toBeUndefined();
    expect(req.user.patientId).toBeUndefined();
  });
});
