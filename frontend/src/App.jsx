import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './data/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import RegisterEnhanced from './pages/RegisterEnhanced';
import DashboardEnhanced from './pages/DashboardEnhanced';
import PatientsEnhanced from './pages/PatientsEnhanced'; // ✨ NEW
import PatientDetail from './pages/PatientDetail';
import Doctors from './pages/Doctors';
import DoctorDetail from './pages/DoctorDetail';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import Prescriptions from './pages/Prescriptions';
import LabReports from './pages/LabReports';
import './App.css';

/**
 * ✨ FULLY MODERNIZED APP
 *
 * UPDATED COMPONENTS:
 * ✅ Login - Modern with gradient
 * ✅ Sidebar - Icons, avatar, modern nav
 * ✅ Header - Search, notifications, user menu
 * ✅ Layout - Fixed positioning
 * ✅ Dashboard - Animated stats, quick actions, activity feed
 * ✅ Patients - Patient cards with avatars
 * ✅ StatusBadge - Consistent design system
 *
 * STILL USING ORIGINAL (can be enhanced later):
 * - Register, PatientDetail, Doctors, DoctorDetail
 * - Appointments, MedicalRecords, Prescriptions, LabReports
 * - AdminPanel
 *
 * These will work fine with the new layout!
 */

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterEnhanced />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardEnhanced />} />
            <Route path="patients" element={<PatientsEnhanced />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/:id" element={<DoctorDetail />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="medical-records" element={<MedicalRecords />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="lab-reports" element={<LabReports />} />
            <Route path="admin" element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
