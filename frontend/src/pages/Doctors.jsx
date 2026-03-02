import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DataTable from '../components/DataTable';

const columns = [
  { key: 'name', label: 'Name', render: (_, row) => `Dr. ${row.firstName} ${row.lastName}` },
  { key: 'specialization', label: 'Specialization' },
  { key: 'department', label: 'Department' },
  { key: 'licenseNumber', label: 'License' },
  {
    key: 'available',
    label: 'Available',
    render: (val) => (
      <span style={{ color: val ? '#38a169' : '#e53e3e', fontWeight: 600 }}>
        {val ? 'Yes' : 'No'}
      </span>
    ),
  },
  { key: 'phone', label: 'Phone' },
];

export default function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/doctors')
      .then((res) => setDoctors(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 32 }}>Loading doctors...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Doctors</h2>
        <span className="count-badge">{doctors.length}</span>
      </div>
      <DataTable
        columns={columns}
        data={doctors}
        onRowClick={(row) => navigate(`/doctors/${row.id}`)}
      />
    </div>
  );
}
