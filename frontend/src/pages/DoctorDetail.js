import { useParams, Link } from 'react-router-dom';
import { doctors } from '../data/doctors';
import { appointments } from '../data/appointments';
import { prescriptions } from '../data/prescriptions';
import DetailCard from '../components/DetailCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

export default function DoctorDetail() {
  const { id } = useParams();
  const doctor = doctors.find((d) => d.id === id);

  if (!doctor) {
    return <div>Doctor not found. <Link to="/doctors">Back to Doctors</Link></div>;
  }

  const appts = appointments.filter((a) => a.doctorId === id);
  const rxs = prescriptions.filter((p) => p.doctorId === id);

  return (
    <div>
      <Link to="/doctors" style={{ marginBottom: 16, display: 'inline-block' }}>
        Back to Doctors
      </Link>
      <DetailCard
        title={`Dr. ${doctor.firstName} ${doctor.lastName}`}
        fields={[
          { label: 'Email', value: doctor.email },
          { label: 'Phone', value: doctor.phone },
          { label: 'Specialization', value: doctor.specialization },
          { label: 'Department', value: doctor.department },
          { label: 'License Number', value: doctor.licenseNumber },
          { label: 'Available', value: doctor.available ? 'Yes' : 'No' },
        ]}
      />

      <h3 style={{ marginBottom: 12 }}>Appointments ({appts.length})</h3>
      <div style={{ marginBottom: 24 }}>
        <DataTable
          columns={[
            { key: 'patientName', label: 'Patient' },
            { key: 'scheduledAt', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
            { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
            { key: 'notes', label: 'Notes', render: (val) => val?.substring(0, 50) + '...' },
          ]}
          data={appts}
        />
      </div>

      <h3 style={{ marginBottom: 12 }}>Prescriptions Written ({rxs.length})</h3>
      <DataTable
        columns={[
          { key: 'patientName', label: 'Patient' },
          { key: 'medication', label: 'Medication' },
          { key: 'dosage', label: 'Dosage' },
          { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
        ]}
        data={rxs}
      />
    </div>
  );
}
