import { useState, useEffect } from 'react';
import { prescriptionStatuses } from '../constants';
import { useAuth } from '../data/AuthContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import './Appointments.css';

export default function Prescriptions() {
  const [filter, setFilter] = useState('all');
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const isPatient = currentUser?.role === 'patient';

  useEffect(() => {
    api.get('/prescriptions')
      .then((res) => setPrescriptions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? prescriptions
    : prescriptions.filter((p) => p.status === filter);

  const columns = [
    ...(isPatient ? [] : [{ key: 'patientName', label: 'Patient' }]),
    { key: 'doctorName', label: 'Doctor' },
    { key: 'medication', label: 'Medication' },
    { key: 'dosage', label: 'Dosage' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'duration', label: 'Duration' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  if (loading) return <div style={{ padding: 32 }}>Loading prescriptions...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{isPatient ? 'My Prescriptions' : 'Prescriptions'}</h2>
        <span className="count-badge">{filtered.length}</span>
      </div>
      <div className="filter-bar">
        <button
          className={`filter-pill ${filter === 'all' ? 'filter-pill-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        {prescriptionStatuses.map((s) => (
          <button
            key={s}
            className={`filter-pill ${filter === s ? 'filter-pill-active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
