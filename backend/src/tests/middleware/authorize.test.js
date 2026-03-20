const { ADMIN, DOCTOR, NURSE, PATIENT, PHARMACIST, LAB_TECH } = require('../fixtures/rbac.fixtures');

const mockGetUserPermissions = jest.fn();
jest.mock('../../utils/permissions', () => ({
  getUserPermissions: (...args) => mockGetUserPermissions(...args),
  hasPermission: jest.fn(),
  hasAllPermissions: jest.fn(),
  hasAnyPermission: async (userId, perms) => {
    const userPerms = await mockGetUserPermissions(userId);
    return perms.some((p) => userPerms.includes(p));
  },
  invalidatePermissionCache: jest.fn(),
}));

const authorize = require('../../middleware/authorize');
const { requirePermission } = require('../../middleware/authorize');

function runAuthorize(roles, user) {
  return new Promise((resolve) => {
    const req = { user };
    const res = {};
    authorize(...roles)(req, res, (err) => {
      resolve({ err, req });
    });
  });
}

function runRequirePermission(permissions, user) {
  return new Promise((resolve) => {
    const req = { user };
    const res = {};
    requirePermission(...permissions)(req, res, (err) => {
      resolve({ err, req });
    });
  });
}

describe('authorize (role-based)', () => {
  test('allows admin when admin role is listed', async () => {
    const { err } = await runAuthorize(['admin'], ADMIN);
    expect(err).toBeUndefined();
  });

  test('allows doctor when doctor is in the role list', async () => {
    const { err } = await runAuthorize(['admin', 'doctor'], DOCTOR);
    expect(err).toBeUndefined();
  });

  test('rejects patient when only admin/doctor are allowed', async () => {
    const { err } = await runAuthorize(['admin', 'doctor'], PATIENT);
    expect(err.statusCode).toBe(403);
  });

  test('rejects nurse when only admin is allowed', async () => {
    const { err } = await runAuthorize(['admin'], NURSE);
    expect(err.statusCode).toBe(403);
  });

  test('returns 401 when no user is attached', async () => {
    const { err } = await runAuthorize(['admin'], undefined);
    expect(err.statusCode).toBe(401);
  });

  test.each([
    ['admin', ADMIN],
    ['doctor', DOCTOR],
    ['nurse', NURSE],
    ['patient', PATIENT],
    ['pharmacist', PHARMACIST],
    ['lab_technician', LAB_TECH],
  ])('allows %s when their own role is listed', async (role, user) => {
    const { err } = await runAuthorize([role], user);
    expect(err).toBeUndefined();
  });
});

describe('requirePermission (permission-based)', () => {
  beforeEach(() => {
    mockGetUserPermissions.mockReset();
  });

  test('allows user with the required permission', async () => {
    mockGetUserPermissions.mockResolvedValue(['view_patients', 'edit_patient']);
    const { err } = await runRequirePermission(['view_patients'], DOCTOR);
    expect(err).toBeUndefined();
  });

  test('allows user if they have ANY of the listed permissions', async () => {
    mockGetUserPermissions.mockResolvedValue(['view_own_appointments']);
    const { err } = await runRequirePermission(
      ['view_appointments', 'view_own_appointments'],
      PATIENT
    );
    expect(err).toBeUndefined();
  });

  test('rejects user with none of the required permissions', async () => {
    mockGetUserPermissions.mockResolvedValue(['view_own_profile']);
    const { err } = await runRequirePermission(['view_patients'], PATIENT);
    expect(err.statusCode).toBe(403);
  });

  test('returns 401 when no user is attached', async () => {
    const { err } = await runRequirePermission(['view_patients'], undefined);
    expect(err.statusCode).toBe(401);
  });

  test('admin has access to all permissions', async () => {
    mockGetUserPermissions.mockResolvedValue([
      'view_patients', 'manage_users', 'view_audit_logs', 'manage_roles',
    ]);
    const { err } = await runRequirePermission(['manage_users'], ADMIN);
    expect(err).toBeUndefined();
  });

  test('pharmacist can dispense prescriptions', async () => {
    mockGetUserPermissions.mockResolvedValue(['view_prescriptions', 'dispense_prescription']);
    const { err } = await runRequirePermission(['dispense_prescription'], PHARMACIST);
    expect(err).toBeUndefined();
  });

  test('pharmacist cannot create prescriptions', async () => {
    mockGetUserPermissions.mockResolvedValue(['view_prescriptions', 'dispense_prescription']);
    const { err } = await runRequirePermission(['create_prescription'], PHARMACIST);
    expect(err.statusCode).toBe(403);
  });

  test('lab technician can create lab reports', async () => {
    mockGetUserPermissions.mockResolvedValue(['view_lab_reports', 'create_lab_report', 'edit_lab_report']);
    const { err } = await runRequirePermission(['create_lab_report'], LAB_TECH);
    expect(err).toBeUndefined();
  });

  test('lab technician cannot create prescriptions', async () => {
    mockGetUserPermissions.mockResolvedValue(['view_lab_reports', 'create_lab_report']);
    const { err } = await runRequirePermission(['create_prescription'], LAB_TECH);
    expect(err.statusCode).toBe(403);
  });
});
