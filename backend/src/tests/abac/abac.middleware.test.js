const { ADMIN, DOCTOR, PATIENT, PHARMACIST, APPOINTMENT } = require('../fixtures/rbac.fixtures');

const mockDbQuery = jest.fn();
jest.mock('../../config/database', () => ({
  query: (...args) => mockDbQuery(...args),
}));

const mockEvaluateAccess = jest.fn();
jest.mock('../../utils/abac', () => ({
  evaluateAccess: (...args) => mockEvaluateAccess(...args),
}));

const { checkResourceAccess } = require('../../middleware/abac');

function runMiddleware(resourceType, user, params = {}) {
  return new Promise((resolve) => {
    const req = { user, params };
    const res = {};
    const middleware = checkResourceAccess(resourceType);
    middleware(req, res, (err) => {
      resolve({ err, req });
    });
  });
}

beforeEach(() => {
  mockDbQuery.mockReset();
  mockEvaluateAccess.mockReset();
});

describe('checkResourceAccess middleware', () => {
  test('attaches resource to req and calls next on allowed access', async () => {
    mockDbQuery.mockResolvedValue({ rows: [APPOINTMENT] });
    mockEvaluateAccess.mockResolvedValue(true);

    const { err, req } = await runMiddleware('appointment', ADMIN, { id: 'appt-1' });
    expect(err).toBeUndefined();
    expect(req.resource).toEqual(APPOINTMENT);
  });

  test('returns 404 when resource is not found', async () => {
    mockDbQuery.mockResolvedValue({ rows: [] });

    const { err } = await runMiddleware('appointment', ADMIN, { id: 'nonexistent' });
    expect(err.statusCode).toBe(404);
    expect(err.message).toMatch(/not found/i);
  });

  test('returns 403 when access is denied by ABAC', async () => {
    mockDbQuery.mockResolvedValue({ rows: [APPOINTMENT] });
    mockEvaluateAccess.mockResolvedValue(false);

    const { err } = await runMiddleware('appointment', PHARMACIST, { id: 'appt-1' });
    expect(err.statusCode).toBe(403);
    expect(err.message).toMatch(/do not have access/i);
  });

  test('returns 400 when resource ID is missing', async () => {
    const { err } = await runMiddleware('appointment', ADMIN, {});
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/resource id/i);
  });

  test('passes subject with profile IDs to evaluateAccess', async () => {
    mockDbQuery.mockResolvedValue({ rows: [APPOINTMENT] });
    mockEvaluateAccess.mockResolvedValue(true);

    await runMiddleware('appointment', DOCTOR, { id: 'appt-1' });
    expect(mockEvaluateAccess).toHaveBeenCalledWith(
      'appointment',
      expect.objectContaining({
        id: DOCTOR.id,
        role: 'doctor',
        doctorId: DOCTOR.doctorId,
      }),
      APPOINTMENT
    );
  });

  test('passes database errors to next()', async () => {
    mockDbQuery.mockRejectedValue(new Error('Connection lost'));

    const { err } = await runMiddleware('appointment', ADMIN, { id: 'appt-1' });
    expect(err.message).toBe('Connection lost');
  });

  test('throws on unknown resource type during factory call', () => {
    expect(() => checkResourceAccess('unknown_type')).toThrow(/unknown abac resource type/i);
  });

  test('supports custom param name', async () => {
    mockDbQuery.mockResolvedValue({ rows: [APPOINTMENT] });
    mockEvaluateAccess.mockResolvedValue(true);

    const middleware = checkResourceAccess('appointment', 'appointmentId');
    const req = { user: ADMIN, params: { appointmentId: 'appt-1' } };
    const res = {};
    await new Promise((resolve) => middleware(req, res, resolve));

    expect(mockDbQuery).toHaveBeenCalledWith(expect.any(String), ['appt-1']);
  });
});
