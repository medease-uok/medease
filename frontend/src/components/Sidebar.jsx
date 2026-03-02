import { NavLink } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import './Sidebar.css';

const navConfig = [
  { path: '/dashboard', label: 'Dashboard', roles: ['patient', 'doctor', 'nurse', 'lab_technician', 'pharmacist', 'admin'] },
  { path: '/patients', label: 'Patients', roles: ['doctor', 'nurse', 'admin'] },
  { path: '/doctors', label: 'Doctors', roles: ['patient', 'admin'] },
  { path: '/appointments', label: 'Appointments', roles: ['patient', 'doctor', 'nurse', 'admin'] },
  { path: '/medical-records', label: 'Medical Records', roles: ['patient', 'doctor', 'nurse', 'admin'] },
  { path: '/prescriptions', label: 'Prescriptions', roles: ['patient', 'doctor', 'pharmacist', 'admin'] },
  { path: '/lab-reports', label: 'Lab Reports', roles: ['patient', 'doctor', 'lab_technician', 'admin'] },
  { path: '/admin', label: 'Admin Panel', roles: ['admin'] },
];

export default function Sidebar() {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'patient';
  const links = navConfig.filter((item) => item.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">+</span>
        <span className="sidebar-title">MedEase</span>
      </div>
      <div className="sidebar-user">
        <div className="sidebar-user-name">
          {currentUser?.firstName} {currentUser?.lastName}
        </div>
        <div className="sidebar-user-role">
          {role.replace('_', ' ')}
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              'sidebar-link' + (isActive ? ' sidebar-link-active' : '')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
