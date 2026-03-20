const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisDel = jest.fn();

jest.mock('../../config/redis', () => ({
  get: (...args) => mockRedisGet(...args),
  set: (...args) => mockRedisSet(...args),
  del: (...args) => mockRedisDel(...args),
}));

const mockDbQuery = jest.fn();
jest.mock('../../config/database', () => ({
  query: (...args) => mockDbQuery(...args),
}));

const {
  getUserPermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  invalidatePermissionCache,
} = require('../../utils/permissions');

beforeEach(() => {
  mockRedisGet.mockReset();
  mockRedisSet.mockReset();
  mockRedisDel.mockReset();
  mockDbQuery.mockReset();
});

describe('getUserPermissions', () => {
  test('returns cached permissions from Redis', async () => {
    const perms = ['view_patients', 'edit_patient'];
    mockRedisGet.mockResolvedValue(JSON.stringify(perms));

    const result = await getUserPermissions('user-1');
    expect(result).toEqual(perms);
    expect(mockDbQuery).not.toHaveBeenCalled();
  });

  test('queries database when cache is empty', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery.mockResolvedValue({
      rows: [{ name: 'view_patients' }, { name: 'edit_patient' }],
    });

    const result = await getUserPermissions('user-1');
    expect(result).toEqual(['view_patients', 'edit_patient']);
    expect(mockRedisSet).toHaveBeenCalledWith('perms:user-1', expect.any(String), 'EX', 300);
  });

  test('falls back to users.role column when user_roles returns empty', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ name: 'view_own_profile' }] });

    const result = await getUserPermissions('user-1');
    expect(result).toEqual(['view_own_profile']);
    expect(mockDbQuery).toHaveBeenCalledTimes(2);
  });

  test('falls back to hardcoded permissions when RBAC tables do not exist', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery
      .mockRejectedValueOnce(new Error('relation "user_roles" does not exist'))
      .mockResolvedValueOnce({ rows: [{ role: 'patient' }] });

    const result = await getUserPermissions('user-1');
    expect(result).toContain('view_own_profile');
    expect(result).toContain('view_own_appointments');
    expect(result).not.toContain('manage_users');
  });

  test('caches result in Redis with 5 minute TTL', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery.mockResolvedValue({ rows: [{ name: 'view_patients' }] });

    await getUserPermissions('user-1');
    expect(mockRedisSet).toHaveBeenCalledWith(
      'perms:user-1',
      JSON.stringify(['view_patients']),
      'EX',
      300
    );
  });
});

describe('hasPermission', () => {
  test('returns true when user has the permission', async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify(['view_patients', 'edit_patient']));
    expect(await hasPermission('user-1', 'view_patients')).toBe(true);
  });

  test('returns false when user lacks the permission', async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify(['view_own_profile']));
    expect(await hasPermission('user-1', 'manage_users')).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  test('returns true when user has all listed permissions', async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify(['view_patients', 'edit_patient', 'create_appointment']));
    expect(await hasAllPermissions('user-1', ['view_patients', 'edit_patient'])).toBe(true);
  });

  test('returns false when user is missing one permission', async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify(['view_patients']));
    expect(await hasAllPermissions('user-1', ['view_patients', 'edit_patient'])).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  test('returns true when user has at least one permission', async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify(['view_own_appointments']));
    expect(await hasAnyPermission('user-1', ['view_appointments', 'view_own_appointments'])).toBe(true);
  });

  test('returns false when user has none of the permissions', async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify(['view_own_profile']));
    expect(await hasAnyPermission('user-1', ['manage_users', 'manage_roles'])).toBe(false);
  });
});

describe('invalidatePermissionCache', () => {
  test('deletes the user permission cache key', async () => {
    await invalidatePermissionCache('user-1');
    expect(mockRedisDel).toHaveBeenCalledWith('perms:user-1');
  });
});
