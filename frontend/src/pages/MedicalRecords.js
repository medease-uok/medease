import { medicalRecords } from '../data/medicalRecords';
import DataTable from '../components/DataTable';

const columns = [
  { key: 'patientName', label: 'Patient' },
  { key: 'doctorName', label: 'Doctor' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'treatment', label: 'Treatment', render: (val) => val?.substring(0, 60) + '...' },
  { key: 'createdAt', label: 'Date' },
];

export default function MedicalRecords() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Medical Records</h2>
        <span className="count-badge">{medicalRecords.length}</span>
      </div>
      <DataTable columns={columns} data={medicalRecords} />
    </div>
  );
}
