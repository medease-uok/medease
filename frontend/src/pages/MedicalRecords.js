import { medicalRecords } from '../data/medicalRecords';
import { patients } from '../data/patients';
import { useAuth } from '../data/AuthContext';
import DataTable from '../components/DataTable';

export default function MedicalRecords() {
  const { currentUser } = useAuth();

  const patient = currentUser?.role === 'patient'
    ? patients.find((p) => p.userId === currentUser.id)
    : null;

  const data = patient
    ? medicalRecords.filter((r) => r.patientId === patient.id)
    : medicalRecords;

  const columns = [
    ...(patient ? [] : [{ key: 'patientName', label: 'Patient' }]),
    { key: 'doctorName', label: 'Doctor' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'treatment', label: 'Treatment', render: (val) => val?.substring(0, 60) + '...' },
    { key: 'createdAt', label: 'Date' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{patient ? 'My Medical Records' : 'Medical Records'}</h2>
        <span className="count-badge">{data.length}</span>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
