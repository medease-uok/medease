import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

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
    <div className="layout">
      <Sidebar />
      <Header title={title} />
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
}
