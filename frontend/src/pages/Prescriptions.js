import { useState } from 'react';
import { prescriptions, prescriptionStatuses } from '../data/prescriptions';
import { patients } from '../data/patients';
import { useAuth } from '../data/AuthContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import './Appointments.css';

export default function Prescriptions() {
  const [filter, setFilter] = useState('all');
  const { currentUser } = useAuth();

  const patient = currentUser?.role === 'patient'
    ? patients.find((p) => p.userId === currentUser.id)
    : null;

  const baseData = patient
    ? prescriptions.filter((p) => p.patientId === patient.id)
    : prescriptions;

  const filtered = filter === 'all'
    ? baseData
    : baseData.filter((p) => p.status === filter);

  const columns = [
    ...(patient ? [] : [{ key: 'patientName', label: 'Patient' }]),
    { key: 'doctorName', label: 'Doctor' },
    { key: 'medication', label: 'Medication' },
    { key: 'dosage', label: 'Dosage' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'duration', label: 'Duration' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{patient ? 'My Prescriptions' : 'Prescriptions'}</h2>
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
