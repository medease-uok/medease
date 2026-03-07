import { usePermissions } from '../hooks/usePermissions';

/**
 * Conditionally render children based on permissions.
 *
 * Props:
 *   permission  - single permission string (renders if user has it)
 *   any         - array of permissions (renders if user has ANY)
 *   all         - array of permissions (renders if user has ALL)
 *   fallback    - optional element to render when permission check fails
 *
 * Usage:
 *   <Can permission="create_appointment"><button>New</button></Can>
 *   <Can any={['view_prescriptions', 'view_own_prescriptions']}>...</Can>
 *   <Can permission="manage_users" fallback={<p>Access denied</p>}>...</Can>
 */
export default function Can({ permission, any, all, fallback = null, children }) {
  const { can, canAny, canAll } = usePermissions();

  let allowed = false;

  if (permission) {
    allowed = can(permission);
  } else if (any) {
    allowed = canAny(...any);
  } else if (all) {
    allowed = canAll(...all);
  }

  return allowed ? children : fallback;
}
