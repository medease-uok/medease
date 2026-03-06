const db = require('../config/database');
const redis = require('../config/redis');

const CACHE_TTL = 300; // 5 minutes

/**
 * Get all permission names for a user (via their role assignments).
 * Results are cached in Redis to avoid hitting the DB on every request.
 */
async function getUserPermissions(userId) {
  const cacheKey = `perms:${userId}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Try user_roles first (new system)
  let result = await db.query(
    `SELECT DISTINCT p.name
     FROM user_roles ur
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = $1`,
    [userId]
  );

  // Fallback: if no user_roles entry, resolve via users.role column
  if (result.rows.length === 0) {
    result = await db.query(
      `SELECT DISTINCT p.name
       FROM users u
       JOIN roles r ON r.name = u.role::text
       JOIN role_permissions rp ON rp.role_id = r.id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE u.id = $1`,
      [userId]
    );
  }

  const permissions = result.rows.map((r) => r.name);
  await redis.set(cacheKey, JSON.stringify(permissions), 'EX', CACHE_TTL);
  return permissions;
}

/**
 * Check if a user has a specific permission.
 */
async function hasPermission(userId, permissionName) {
  const perms = await getUserPermissions(userId);
  return perms.includes(permissionName);
}

/**
 * Check if a user has ALL of the given permissions.
 */
async function hasAllPermissions(userId, permissionNames) {
  const perms = await getUserPermissions(userId);
  return permissionNames.every((p) => perms.includes(p));
}

/**
 * Check if a user has ANY of the given permissions.
 */
async function hasAnyPermission(userId, permissionNames) {
  const perms = await getUserPermissions(userId);
  return permissionNames.some((p) => perms.includes(p));
}

/**
 * Invalidate the cached permissions for a user (call after role/permission changes).
 */
async function invalidatePermissionCache(userId) {
  await redis.del(`perms:${userId}`);
}

module.exports = {
  getUserPermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  invalidatePermissionCache,
};
