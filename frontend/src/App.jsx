import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './data/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Doctors from './pages/Doctors';
import DoctorDetail from './pages/DoctorDetail';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import Prescriptions from './pages/Prescriptions';
import LabReports from './pages/LabReports';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/:id" element={<DoctorDetail />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="medical-records" element={<MedicalRecords />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="lab-reports" element={<LabReports />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
