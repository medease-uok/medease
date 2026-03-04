import { useState, useEffect } from 'react';
import { useAuth } from '../data/AuthContext';
import api from '../services/api';
import DataTable from '../components/DataTable';

export default function MedicalRecords() {
  const { currentUser } = useAuth();
  const isPatient = currentUser?.role === 'patient';
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/medical-records')
      .then((res) => setRecords(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    ...(isPatient ? [] : [{ key: 'patientName', label: 'Patient' }]),
    { key: 'doctorName', label: 'Doctor' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'treatment', label: 'Treatment', render: (val) => val?.substring(0, 60) + '...' },
    { key: 'createdAt', label: 'Date' },
  ];

  if (loading) return <div style={{ padding: 32 }}>Loading records...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{isPatient ? 'My Medical Records' : 'Medical Records'}</h2>
        <span className="count-badge">{records.length}</span>
      </div>
      <DataTable columns={columns} data={records} />
    </div>
  );
}
