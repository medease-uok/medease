import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * ✨ MODERNIZED LAYOUT
 *
 * IMPROVEMENTS:
 * - Fixed sidebar and header positioning
 * - Better spacing with Tailwind
 * - Smooth background gradient
 * - Proper content padding for fixed elements
 * - Responsive design
 */

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patients',
  '/doctors': 'Doctors',
  '/appointments': 'Appointments',
  '/medical-records': 'Medical Records',
  '/prescriptions': 'Prescriptions',
  '/lab-reports': 'Lab Reports',
  '/admin': 'Admin Panel',
};

export default function Layout() {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const basePath = '/' + location.pathname.split('/')[1];
  const title = pageTitles[basePath] || 'MedEase';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* ✨ FIXED SIDEBAR */}
      <Sidebar />

      {/* ✨ FIXED HEADER */}
      <Header title={title} />

      {/* ✨ MAIN CONTENT with proper padding */}
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
