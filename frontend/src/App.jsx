import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './data/AuthContext';
import { ROLES, ROLE_GROUPS } from './data/roles';
import Layout from './components/Layout';
import RoleGuard from './components/RoleGuard';
import Login from './pages/Login';
import RegisterEnhanced from './pages/RegisterEnhanced';
import VerifyEmail from './pages/VerifyEmail';
import DashboardEnhanced from './pages/DashboardEnhanced';
import PatientsEnhanced from './pages/PatientsEnhanced';
import PatientDetail from './pages/PatientDetail';
import Doctors from './pages/Doctors';
import DoctorDetail from './pages/DoctorDetail';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import Prescriptions from './pages/Prescriptions';
import LabReports from './pages/LabReports';
import PermissionManagement from './pages/PermissionManagement';
import PatientDashboard from './pages/PatientDashboard';
import MedicalHistory from './pages/MedicalHistory';
import './App.css';

const R = ({ roles, children }) => <RoleGuard roles={roles}>{children}</RoleGuard>;

function DashboardRedirect() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === ROLES.PATIENT) return <Navigate to="/my-health" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterEnhanced />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardRedirect />} />
            <Route path="dashboard" element={<R roles={ROLE_GROUPS.STAFF}><DashboardEnhanced /></R>} />
            <Route path="my-health" element={<R roles={ROLE_GROUPS.PATIENT_ONLY}><PatientDashboard /></R>} />
            <Route path="patients" element={<R roles={ROLE_GROUPS.CLINICAL}><PatientsEnhanced /></R>} />
            <Route path="patients/:id" element={<R roles={ROLE_GROUPS.CLINICAL}><PatientDetail /></R>} />
            <Route path="doctors" element={<R roles={[ROLES.PATIENT, ROLES.ADMIN]}><Doctors /></R>} />
            <Route path="doctors/:id" element={<R roles={[ROLES.PATIENT, ROLES.ADMIN]}><DoctorDetail /></R>} />
            <Route path="appointments" element={<R roles={ROLE_GROUPS.PATIENT_CARE}><Appointments /></R>} />
            <Route path="medical-history" element={<R roles={ROLE_GROUPS.PATIENT_ONLY}><MedicalHistory /></R>} />
            <Route path="medical-records" element={<R roles={ROLE_GROUPS.PATIENT_CARE}><MedicalRecords /></R>} />
            <Route path="prescriptions" element={<R roles={[ROLES.PATIENT, ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.ADMIN]}><Prescriptions /></R>} />
            <Route path="lab-reports" element={<R roles={[ROLES.PATIENT, ROLES.DOCTOR, ROLES.LAB_TECHNICIAN, ROLES.ADMIN]}><LabReports /></R>} />
            <Route path="permissions" element={<R roles={[ROLES.ADMIN]}><PermissionManagement /></R>} />
            <Route path="admin" element={<DashboardRedirect />} />
          </Route>
          <Route path="*" element={<DashboardRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
