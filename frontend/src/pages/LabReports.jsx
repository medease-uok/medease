import { useState, useEffect } from 'react';
import { useAuth } from '../data/AuthContext';
import api from '../services/api';
import DataTable from '../components/DataTable';

export default function LabReports() {
  const { currentUser } = useAuth();
  const isPatient = currentUser?.role === 'patient';
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/lab-reports')
      .then((res) => setReports(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    ...(isPatient ? [] : [{ key: 'patientName', label: 'Patient' }]),
    { key: 'testName', label: 'Test Name' },
    { key: 'technicianName', label: 'Technician' },
    { key: 'reportDate', label: 'Date' },
    { key: 'result', label: 'Result', render: (val) => val?.substring(0, 60) + '...' },
  ];

  if (loading) return <div style={{ padding: 32 }}>Loading lab reports...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{isPatient ? 'My Lab Reports' : 'Lab Reports'}</h2>
        <span className="count-badge">{reports.length}</span>
      </div>
      <DataTable columns={columns} data={reports} />
    </div>
  );
}
