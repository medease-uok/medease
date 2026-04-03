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
import LabTestRequests from './pages/LabTestRequests';
import PermissionManagement from './pages/PermissionManagement';
import PatientDashboard from './pages/PatientDashboard';
import MedicalHistory from './pages/MedicalHistory';
import MedicalDocuments from './pages/MedicalDocuments';
import Vaccinations from './pages/Vaccinations';
import ChronicConditions from './pages/ChronicConditions';
import Inventory from './pages/Inventory';
import SupplierManagement from './pages/SupplierManagement';
import ScheduleCalendar from './pages/ScheduleCalendar';
import DoctorDashboard from './pages/DoctorDashboard';
import MyRecords from './pages/MyRecords';
import StaffRecords from './pages/StaffRecords';
import PatientSatisfaction from './pages/PatientSatisfaction';
import ForgotPassword from './pages/ForgotPassword';
import './App.css';

const R = ({ roles, children }) => <RoleGuard roles={roles}>{children}</RoleGuard>;

function DashboardRedirect() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === ROLES.PATIENT) return <Navigate to="/my-health" replace />;
  if (currentUser.role === ROLES.DOCTOR) return <Navigate to="/doctor-dashboard" replace />;
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardRedirect />} />
            <Route path="dashboard" element={<R roles={ROLE_GROUPS.STAFF}><DashboardEnhanced /></R>} />
            <Route path="doctor-dashboard" element={<R roles={[ROLES.DOCTOR]}><DoctorDashboard /></R>} />
            <Route path="my-health" element={<R roles={ROLE_GROUPS.PATIENT_ONLY}><PatientDashboard /></R>} />
            <Route path="my-records" element={<R roles={ROLE_GROUPS.PATIENT_ONLY}><MyRecords /></R>} />
            <Route path="health-profile" element={<Navigate to="/my-records?tab=conditions" replace />} />
            <Route path="patients" element={<R roles={ROLE_GROUPS.CLINICAL}><PatientsEnhanced /></R>} />
            <Route path="patients/:id" element={<R roles={ROLE_GROUPS.CLINICAL}><PatientDetail /></R>} />
            <Route path="doctors" element={<R roles={[ROLES.PATIENT, ROLES.ADMIN]}><Doctors /></R>} />
            <Route path="doctors/:id" element={<R roles={[ROLES.PATIENT, ROLES.ADMIN]}><DoctorDetail /></R>} />
            <Route path="appointments" element={<R roles={ROLE_GROUPS.PATIENT_CARE}><Appointments /></R>} />
            <Route path="schedule" element={<R roles={ROLE_GROUPS.PATIENT_CARE}><ScheduleCalendar /></R>} />
            <Route path="medical-history" element={<R roles={ROLE_GROUPS.PATIENT_ONLY}><MedicalHistory /></R>} />
            <Route path="records" element={<R roles={[...ROLE_GROUPS.CLINICAL, ROLES.LAB_TECHNICIAN]}><StaffRecords /></R>} />
            <Route path="medical-records" element={<R roles={ROLE_GROUPS.PATIENT_CARE}><MedicalRecords /></R>} />
            <Route path="prescriptions" element={<R roles={[ROLES.PATIENT, ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.ADMIN]}><Prescriptions /></R>} />
            <Route path="lab-reports" element={<R roles={[ROLES.PATIENT, ROLES.DOCTOR, ROLES.LAB_TECHNICIAN, ROLES.ADMIN]}><LabReports /></R>} />
            <Route path="lab-test-requests" element={<R roles={[ROLES.DOCTOR, ROLES.LAB_TECHNICIAN, ROLES.NURSE, ROLES.ADMIN]}><LabTestRequests /></R>} />
            <Route path="documents" element={<R roles={ROLE_GROUPS.PATIENT_CARE}><MedicalDocuments /></R>} />
            <Route path="vaccinations" element={<R roles={ROLE_GROUPS.PATIENT_CARE}><Vaccinations /></R>} />
            <Route path="chronic-conditions" element={<R roles={ROLE_GROUPS.PATIENT_CARE}><ChronicConditions /></R>} />
            <Route path="inventory" element={<R roles={[...ROLE_GROUPS.CLINICAL, ROLES.PHARMACIST, ROLES.LAB_TECHNICIAN]}><Inventory /></R>} />
            <Route path="patient-satisfaction" element={<R roles={[ROLES.DOCTOR, ROLES.ADMIN]}><PatientSatisfaction /></R>} />
            <Route path="suppliers" element={<R roles={[ROLES.ADMIN]}><SupplierManagement /></R>} />
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
