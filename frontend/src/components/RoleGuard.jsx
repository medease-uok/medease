import { Navigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';

export default function RoleGuard({ roles, children }) {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  if (!role || !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
