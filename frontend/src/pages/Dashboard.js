import { useAuth } from '../data/AuthContext';
import { patients } from '../data/patients';
import { doctors } from '../data/doctors';
import { appointments } from '../data/appointments';
import { prescriptions } from '../data/prescriptions';
import { labReports } from '../data/labReports';
import { medicalRecords } from '../data/medicalRecords';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import './Dashboard.css';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const recentAppointmentCols = [
  { key: 'patientName', label: 'Patient' },
  { key: 'doctorName', label: 'Doctor' },
  { key: 'scheduledAt', label: 'Date', render: (val) => formatDate(val) },
  { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  const activeRx = prescriptions.filter((p) => p.status === 'active').length;
  const todayAppts = appointments.filter((a) => a.status === 'in_progress').length;
  const recentAppts = [...appointments]
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
    .slice(0, 5);

  const getStats = () => {
    switch (role) {
      case 'admin':
        return [
          { label: 'Total Patients', value: patients.length, color: '#3182ce' },
          { label: 'Total Doctors', value: doctors.length, color: '#38a169' },
          { label: 'Appointments Today', value: todayAppts, color: '#d69e2e' },
          { label: 'Active Prescriptions', value: activeRx, color: '#e53e3e' },
        ];
      case 'doctor':
        return [
          { label: 'Appointments Today', value: todayAppts, color: '#3182ce' },
          { label: 'Total Patients', value: patients.length, color: '#38a169' },
          { label: 'Active Prescriptions', value: activeRx, color: '#d69e2e' },
          { label: 'Lab Reports', value: labReports.length, color: '#e53e3e' },
        ];
      case 'nurse':
        return [
          { label: 'Appointments Today', value: todayAppts, color: '#3182ce' },
          { label: 'Total Patients', value: patients.length, color: '#38a169' },
          { label: 'Medical Records', value: medicalRecords.length, color: '#d69e2e' },
          { label: 'Completed', value: appointments.filter((a) => a.status === 'completed').length, color: '#e53e3e' },
        ];
      case 'lab_technician':
        return [
          { label: 'Total Reports', value: labReports.length, color: '#3182ce' },
          { label: 'Patients Tested', value: new Set(labReports.map((r) => r.patientId)).size, color: '#38a169' },
          { label: 'Tests This Month', value: labReports.length, color: '#d69e2e' },
          { label: 'Pending Reviews', value: 3, color: '#e53e3e' },
        ];
      case 'pharmacist':
        return [
          { label: 'Active Prescriptions', value: activeRx, color: '#3182ce' },
          { label: 'Dispensed', value: prescriptions.filter((p) => p.status === 'dispensed').length, color: '#38a169' },
          { label: 'Expired', value: prescriptions.filter((p) => p.status === 'expired').length, color: '#d69e2e' },
          { label: 'Total Medications', value: prescriptions.length, color: '#e53e3e' },
        ];
      case 'patient':
      default:
        return [
          { label: 'My Appointments', value: appointments.filter((a) => a.patientName.includes('Sarah')).length, color: '#3182ce' },
          { label: 'My Prescriptions', value: prescriptions.filter((p) => p.patientName.includes('Sarah')).length, color: '#38a169' },
          { label: 'My Lab Reports', value: labReports.filter((r) => r.patientName.includes('Sarah')).length, color: '#d69e2e' },
          { label: 'My Records', value: medicalRecords.filter((r) => r.patientName.includes('Sarah')).length, color: '#e53e3e' },
        ];
    }
  };

  const stats = getStats();

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
      </div>
      <div className="dashboard-stats">
        {stats.map((s, i) => (
          <StatsCard key={i} label={s.label} value={s.value} accentColor={s.color} />
        ))}
      </div>
      <h3 className="dashboard-section-title">Recent Appointments</h3>
      <DataTable columns={recentAppointmentCols} data={recentAppts} />
    </div>
  );
}
