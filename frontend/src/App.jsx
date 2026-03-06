import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './data/AuthContext';
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
import './App.css';

const R = ({ roles, children }) => <RoleGuard roles={roles}>{children}</RoleGuard>;

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
            <Route path="patients" element={<R roles={['doctor', 'nurse', 'admin']}><PatientsEnhanced /></R>} />
            <Route path="patients/:id" element={<R roles={['doctor', 'nurse', 'admin']}><PatientDetail /></R>} />
            <Route path="doctors" element={<R roles={['patient', 'admin']}><Doctors /></R>} />
            <Route path="doctors/:id" element={<R roles={['patient', 'admin']}><DoctorDetail /></R>} />
            <Route path="appointments" element={<R roles={['patient', 'doctor', 'nurse', 'admin']}><Appointments /></R>} />
            <Route path="medical-records" element={<R roles={['patient', 'doctor', 'nurse', 'admin']}><MedicalRecords /></R>} />
            <Route path="prescriptions" element={<R roles={['patient', 'doctor', 'pharmacist', 'admin']}><Prescriptions /></R>} />
            <Route path="lab-reports" element={<R roles={['patient', 'doctor', 'lab_technician', 'admin']}><LabReports /></R>} />
            <Route path="admin" element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
