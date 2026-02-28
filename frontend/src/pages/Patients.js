import { useNavigate } from 'react-router-dom';
import { patients } from '../data/patients';
import DataTable from '../components/DataTable';

const columns = [
  { key: 'name', label: 'Name', render: (_, row) => `${row.firstName} ${row.lastName}` },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'gender', label: 'Gender' },
  { key: 'bloodType', label: 'Blood Type' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
];

export default function Patients() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Patients</h2>
        <span className="count-badge">{patients.length}</span>
      </div>
      <DataTable
        columns={columns}
        data={patients}
        onRowClick={(row) => navigate(`/patients/${row.id}`)}
      />
    </div>
  );
}
