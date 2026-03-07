import { useAuth } from '../data/AuthContext';

/**
 * Hook for checking user permissions.
 *
 * Usage:
 *   const { can, canAny, canAll } = usePermissions();
 *   if (can('create_appointment')) { ... }
 *   if (canAny('view_prescriptions', 'view_own_prescriptions')) { ... }
 */
export function usePermissions() {
  const { permissions } = useAuth();
  const perms = permissions || [];

  return {
    permissions: perms,
    can: (permission) => perms.includes(permission),
    canAny: (...list) => list.some((p) => perms.includes(p)),
    canAll: (...list) => list.every((p) => perms.includes(p)),
  };
}
