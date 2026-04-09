import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/doctor-dashboard': 'Doctor Dashboard',
  '/patients': 'Patients',
  '/doctors': 'Doctors',
  '/appointments': 'Appointments',
  '/schedule': 'Schedule',
  '/notifications': 'Notifications',
  '/medical-history': 'Medical History',
  '/records': 'Records',
  '/medical-records': 'Medical Records',
  '/prescriptions': 'Prescriptions',
  '/lab-reports': 'Lab Reports',
  '/lab-test-requests': 'Lab Test Requests',
  '/vaccinations': 'Vaccinations',
  '/chronic-conditions': 'Chronic Conditions',
  '/documents': 'Medical Documents',
  '/patient-satisfaction': 'Patient Satisfaction',
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
