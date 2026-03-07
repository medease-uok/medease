import { Navigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { ROLES } from '../data/roles';

export default function RoleGuard({ roles, children }) {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  if (!role) return <Navigate to="/login" replace />;

  if (!roles.includes(role)) {
    return <Navigate to={role === ROLES.PATIENT ? '/my-health' : '/dashboard'} replace />;
  }

  return children;
}
