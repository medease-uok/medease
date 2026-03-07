import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './data/AuthContext';
import Layout from './components/Layout';
import RoleGuard from './components/RoleGuard';
import Login from './pages/Login';
import RegisterEnhanced from './pages/RegisterEnhanced';
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
import './App.css';

const R = ({ roles, children }) => <RoleGuard roles={roles}>{children}</RoleGuard>;

function DashboardRedirect() {
  const { currentUser } = useAuth();
  if (currentUser?.role === 'patient') return <Navigate to="/my-health" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterEnhanced />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardRedirect />} />
            <Route path="dashboard" element={<R roles={['doctor', 'nurse', 'lab_technician', 'pharmacist', 'admin']}><DashboardEnhanced /></R>} />
            <Route path="my-health" element={<R roles={['patient']}><PatientDashboard /></R>} />
            <Route path="patients" element={<R roles={['doctor', 'nurse', 'admin']}><PatientsEnhanced /></R>} />
            <Route path="patients/:id" element={<R roles={['doctor', 'nurse', 'admin']}><PatientDetail /></R>} />
            <Route path="doctors" element={<R roles={['patient', 'admin']}><Doctors /></R>} />
            <Route path="doctors/:id" element={<R roles={['patient', 'admin']}><DoctorDetail /></R>} />
            <Route path="appointments" element={<R roles={['patient', 'doctor', 'nurse', 'admin']}><Appointments /></R>} />
            <Route path="medical-records" element={<R roles={['patient', 'doctor', 'nurse', 'admin']}><MedicalRecords /></R>} />
            <Route path="prescriptions" element={<R roles={['patient', 'doctor', 'pharmacist', 'admin']}><Prescriptions /></R>} />
            <Route path="lab-reports" element={<R roles={['patient', 'doctor', 'lab_technician', 'admin']}><LabReports /></R>} />
            <Route path="permissions" element={<R roles={['admin']}><PermissionManagement /></R>} />
            <Route path="admin" element={<DashboardRedirect />} />
          </Route>
          <Route path="*" element={<DashboardRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
