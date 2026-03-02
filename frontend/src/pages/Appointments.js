import { useState } from 'react';
import { appointments, appointmentStatuses } from '../data/appointments';
import { patients } from '../data/patients';
import { useAuth } from '../data/AuthContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import './Appointments.css';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export default function Appointments() {
  const [filter, setFilter] = useState('all');
  const { currentUser } = useAuth();

  const patient = currentUser?.role === 'patient'
    ? patients.find((p) => p.userId === currentUser.id)
    : null;

  const baseData = patient
    ? appointments.filter((a) => a.patientId === patient.id)
    : appointments;

  const filtered = filter === 'all'
    ? baseData
    : baseData.filter((a) => a.status === filter);

  const columns = [
    ...(patient ? [] : [{ key: 'patientName', label: 'Patient' }]),
    { key: 'doctorName', label: 'Doctor' },
    { key: 'scheduledAt', label: 'Scheduled', render: (val) => formatDate(val) },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'notes', label: 'Notes', render: (val) => val?.substring(0, 50) + '...' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{patient ? 'My Appointments' : 'Appointments'}</h2>
        <span className="count-badge">{filtered.length}</span>
      </div>
      <div className="filter-bar">
        <button
          className={`filter-pill ${filter === 'all' ? 'filter-pill-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        {appointmentStatuses.map((s) => (
          <button
            key={s}
            className={`filter-pill ${filter === s ? 'filter-pill-active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
