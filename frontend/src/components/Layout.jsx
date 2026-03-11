import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patients',
  '/doctors': 'Doctors',
  '/appointments': 'Appointments',
  '/medical-history': 'Medical History',
  '/medical-records': 'Medical Records',
  '/prescriptions': 'Prescriptions',
  '/lab-reports': 'Lab Reports',
  '/vaccinations': 'Vaccinations',
  '/documents': 'Medical Documents',
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
      <Sidebar />
      <Header title={title} />
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
