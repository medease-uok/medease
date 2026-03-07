import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import DetailCard from '../components/DetailCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

const SEVERITY_COLORS = {
  severe: 'bg-red-100 text-red-700',
  moderate: 'bg-amber-100 text-amber-700',
  mild: 'bg-green-100 text-green-700',
};

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [records, setRecords] = useState([]);
  const [rxs, setRxs] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/patients/${id}`)
      .then((res) => {
        setPatient(res.data.patient);
        setAllergies(res.data.allergies || []);
        setRecords(res.data.medicalRecords);
        setRxs(res.data.prescriptions);
        setLabs(res.data.labReports);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 32 }}>Loading patient...</div>;

  if (!patient) {
    return <div>Patient not found. <Link to="/patients">Back to Patients</Link></div>;
  }

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
          { label: 'Date of Birth', value: new Date(patient.dateOfBirth).toLocaleDateString() },
          { label: 'Gender', value: patient.gender },
          { label: 'Blood Type', value: patient.bloodType },
          { label: 'Address', value: patient.address },
          { label: 'Emergency Contact', value: patient.emergencyContact },
          { label: 'Relationship', value: patient.emergencyRelationship },
          { label: 'Emergency Phone', value: patient.emergencyPhone },
          { label: 'Insurance Provider', value: patient.insuranceProvider },
          { label: 'Policy No.', value: patient.insurancePolicyNumber },
          { label: 'Plan Type', value: patient.insurancePlanType },
          { label: 'Insurance Expiry', value: patient.insuranceExpiryDate ? new Date(patient.insuranceExpiryDate).toLocaleDateString() : null },
        ]}
      />

      {allergies.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12, marginTop: 24 }}>Allergies ({allergies.length})</h3>
          <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allergies.map((a) => (
              <span
                key={a.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${SEVERITY_COLORS[a.severity] || SEVERITY_COLORS.mild}`}
                title={a.reaction ? `Reaction: ${a.reaction}` : undefined}
              >
                {a.allergen}
                <span className="text-xs opacity-70">({a.severity})</span>
              </span>
            ))}
          </div>
        </>
      )}

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
