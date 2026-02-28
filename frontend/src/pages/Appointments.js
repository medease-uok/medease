import { useState } from 'react';
import { appointments, appointmentStatuses } from '../data/appointments';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import './Appointments.css';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const columns = [
  { key: 'patientName', label: 'Patient' },
  { key: 'doctorName', label: 'Doctor' },
  { key: 'scheduledAt', label: 'Scheduled', render: (val) => formatDate(val) },
  { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  { key: 'notes', label: 'Notes', render: (val) => val?.substring(0, 50) + '...' },
];

export default function Appointments() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filter);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Appointments</h2>
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
