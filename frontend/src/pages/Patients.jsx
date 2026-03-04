import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DataTable from '../components/DataTable';

const columns = [
  { key: 'name', label: 'Name', render: (_, row) => `${row.firstName} ${row.lastName}` },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'gender', label: 'Gender' },
  { key: 'bloodType', label: 'Blood Type' },
  { key: 'dateOfBirth', label: 'Date of Birth', render: (val) => val ? new Date(val).toLocaleDateString() : '' },
];

export default function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patients')
      .then((res) => setPatients(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 32 }}>Loading patients...</div>;

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
