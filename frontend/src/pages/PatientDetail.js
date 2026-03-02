import { useParams, Link } from 'react-router-dom';
import { patients } from '../data/patients';
import { medicalRecords } from '../data/medicalRecords';
import { prescriptions } from '../data/prescriptions';
import { labReports } from '../data/labReports';
import DetailCard from '../components/DetailCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

export default function PatientDetail() {
  const { id } = useParams();
  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return <div>Patient not found. <Link to="/patients">Back to Patients</Link></div>;
  }

  const records = medicalRecords.filter((r) => r.patientId === id);
  const rxs = prescriptions.filter((p) => p.patientId === id);
  const labs = labReports.filter((r) => r.patientId === id);

  return (
    <div>
      <Link to="/patients" style={{ marginBottom: 16, display: 'inline-block' }}>
        Back to Patients
      </Link>
      <DetailCard
        title={`${patient.firstName} ${patient.lastName}`}
        fields={[
          { label: 'Email', value: patient.email },
          { label: 'Phone', value: patient.phone },
          { label: 'Date of Birth', value: patient.dateOfBirth },
          { label: 'Gender', value: patient.gender },
          { label: 'Blood Type', value: patient.bloodType },
          { label: 'Address', value: patient.address },
          { label: 'Emergency Contact', value: patient.emergencyContact },
          { label: 'Relationship', value: patient.emergencyRelationship },
          { label: 'Emergency Phone', value: patient.emergencyPhone },
        ]}
      />

      <h3 style={{ marginBottom: 12 }}>Medical Records ({records.length})</h3>
      <div style={{ marginBottom: 24 }}>
        <DataTable
          columns={[
            { key: 'doctorName', label: 'Doctor' },
            { key: 'diagnosis', label: 'Diagnosis' },
            { key: 'treatment', label: 'Treatment', render: (val) => val?.substring(0, 60) + '...' },
            { key: 'createdAt', label: 'Date' },
          ]}
          data={records}
        />
      </div>

      <h3 style={{ marginBottom: 12 }}>Prescriptions ({rxs.length})</h3>
      <div style={{ marginBottom: 24 }}>
        <DataTable
          columns={[
            { key: 'medication', label: 'Medication' },
            { key: 'dosage', label: 'Dosage' },
            { key: 'frequency', label: 'Frequency' },
            { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
          ]}
          data={rxs}
        />
      </div>

      <h3 style={{ marginBottom: 12 }}>Lab Reports ({labs.length})</h3>
      <DataTable
        columns={[
          { key: 'testName', label: 'Test' },
          { key: 'technicianName', label: 'Technician' },
          { key: 'result', label: 'Result', render: (val) => val?.substring(0, 60) + '...' },
          { key: 'reportDate', label: 'Date' },
        ]}
        data={labs}
      />
    </div>
  );
}
