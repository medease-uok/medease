const db = require('../config/database');
const redis = require('../config/redis');

const CACHE_TTL = 300; // 5 minutes

const ROLE_PERMISSIONS_FALLBACK = {
  admin: [
    'view_patients', 'view_own_profile', 'edit_own_profile', 'edit_patient',
    'view_appointments', 'view_own_appointments', 'create_appointment', 'cancel_appointment', 'update_appointment_status',
    'view_medical_records', 'view_own_medical_records', 'create_medical_record', 'edit_medical_record',
    'view_prescriptions', 'view_own_prescriptions', 'create_prescription', 'dispense_prescription', 'cancel_prescription',
    'request_refill', 'view_refill_requests', 'view_own_refill_requests', 'respond_refill_request',
    'view_lab_reports', 'view_own_lab_reports', 'create_lab_report', 'edit_lab_report',
    'manage_users', 'manage_roles', 'view_audit_logs', 'view_dashboard',
  ],
  doctor: [
    'view_patients', 'edit_patient',
    'view_appointments', 'create_appointment', 'cancel_appointment', 'update_appointment_status',
    'view_medical_records', 'create_medical_record', 'edit_medical_record',
    'view_prescriptions', 'create_prescription', 'cancel_prescription',
    'view_refill_requests', 'respond_refill_request',
    'view_lab_reports',
  ],
  nurse: [
    'view_patients',
    'view_appointments', 'update_appointment_status',
    'view_medical_records',
    'view_prescriptions',
    'view_refill_requests',
    'view_lab_reports',
  ],
  patient: [
    'view_own_profile', 'edit_own_profile',
    'view_own_appointments', 'create_appointment', 'cancel_appointment',
    'view_own_medical_records',
    'view_own_prescriptions',
    'request_refill', 'view_own_refill_requests',
    'view_own_lab_reports',
  ],
  lab_technician: [
    'view_patients',
    'view_lab_reports', 'create_lab_report', 'edit_lab_report',
  ],
  pharmacist: [
    'view_patients',
    'view_prescriptions', 'dispense_prescription',
    'view_refill_requests',
  ],
};

/**
 * Get all permission names for a user (via their role assignments).
 * Results are cached in Redis. Falls back to ROLE_PERMISSIONS_FALLBACK
 * when the RBAC tables (roles, permissions, etc.) don't exist yet.
 */
async function getUserPermissions(userId) {
  const cacheKey = `perms:${userId}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  let permissions;

  try {
    // Recursive CTE walks the role hierarchy (child -> parent -> grandparent...)
    // collecting permissions from each level
    let result = await db.query(
      `WITH RECURSIVE role_chain AS (
         SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = $1
         UNION
         SELECT r.parent_role_id FROM roles r
         JOIN role_chain rc ON rc.role_id = r.id
         WHERE r.parent_role_id IS NOT NULL
       )
       SELECT DISTINCT p.name
       FROM role_chain rc
       JOIN role_permissions rp ON rp.role_id = rc.role_id
       JOIN permissions p ON p.id = rp.permission_id`,
      [userId]
    );

    // Fallback: if no user_roles entry, resolve via users.role column
    if (result.rows.length === 0) {
      result = await db.query(
        `WITH RECURSIVE role_chain AS (
           SELECT r.id AS role_id FROM users u
           JOIN roles r ON r.name = u.role::text
           WHERE u.id = $1
           UNION
           SELECT r.parent_role_id FROM roles r
           JOIN role_chain rc ON rc.role_id = r.id
           WHERE r.parent_role_id IS NOT NULL
         )
         SELECT DISTINCT p.name
         FROM role_chain rc
         JOIN role_permissions rp ON rp.role_id = rc.role_id
         JOIN permissions p ON p.id = rp.permission_id`,
        [userId]
      );
    }

    permissions = result.rows.map((r) => r.name);
  } catch {
    // RBAC tables don't exist yet — resolve from users.role column
    const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
    const role = userResult.rows[0]?.role;
    permissions = ROLE_PERMISSIONS_FALLBACK[role] || [];
  }

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
