import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import DetailCard from '../components/DetailCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

export default function DoctorDetail() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [appts, setAppts] = useState([]);
  const [rxs, setRxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/doctors/${id}`)
      .then((res) => {
        setDoctor(res.data.doctor);
        setAppts(res.data.appointments);
        setRxs(res.data.prescriptions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 32 }}>Loading doctor...</div>;

  if (!doctor) {
    return <div>Doctor not found. <Link to="/doctors">Back to Doctors</Link></div>;
  }

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
            { key: 'scheduledAt', label: 'Date & Time', render: (val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) },
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
