import { NavLink } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  Activity
} from 'lucide-react';


const navConfig = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['patient', 'doctor', 'nurse', 'lab_technician', 'pharmacist', 'admin'] },
  { path: '/patients', label: 'Patients', icon: Users, roles: ['doctor', 'nurse', 'admin'] },
  { path: '/doctors', label: 'Doctors', icon: Stethoscope, roles: ['patient', 'admin'] },
  { path: '/appointments', label: 'Appointments', icon: Calendar, roles: ['patient', 'doctor', 'nurse', 'admin'] },
  { path: '/medical-records', label: 'Medical Records', icon: FileText, roles: ['patient', 'doctor', 'nurse', 'admin'] },
  { path: '/prescriptions', label: 'Prescriptions', icon: Pill, roles: ['patient', 'doctor', 'pharmacist', 'admin'] },
  { path: '/lab-reports', label: 'Lab Reports', icon: FlaskConical, roles: ['patient', 'doctor', 'lab_technician', 'admin'] },
];

const roleColors = {
  patient: 'bg-blue-100 text-blue-700',
  doctor: 'bg-green-100 text-green-700',
  nurse: 'bg-purple-100 text-purple-700',
  lab_technician: 'bg-orange-100 text-orange-700',
  pharmacist: 'bg-pink-100 text-pink-700',
  admin: 'bg-red-100 text-red-700',
};

export default function Sidebar() {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'patient';
  const links = navConfig.filter((item) => item.roles.includes(role));

  // Get user initials for avatar
  const initials = currentUser
    ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-xl z-50 flex flex-col">

      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading">MedEase</h1>
            <p className="text-xs text-slate-400">Hospital Management</p>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-cta flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {currentUser?.firstName} {currentUser?.lastName}
            </p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${roleColors[role] || 'bg-slate-700 text-slate-300'}`}>
              {role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`
                }
              >
                {/* Active indicator bar */}
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                    )}
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

    </aside>
  );
}
