import { useState, useEffect } from 'react';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import './Dashboard.css';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const recentAppointmentCols = [
  { key: 'patientName', label: 'Patient' },
  { key: 'doctorName', label: 'Doctor' },
  { key: 'scheduledAt', label: 'Date', render: (val) => formatDate(val) },
  { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
];

export default function Dashboard() {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setDashData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 32 }}>Loading dashboard...</div>;
  if (!dashData) return <div style={{ padding: 32 }}>Failed to load dashboard.</div>;

  const { stats, recentAppointments } = dashData;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
      </div>
      <div className="dashboard-stats">
        {stats.map((s, i) => (
          <StatsCard key={i} label={s.label} value={s.value} accentColor={s.color} />
        ))}
      </div>
      <h3 className="dashboard-section-title">Recent Appointments</h3>
      <DataTable columns={recentAppointmentCols} data={recentAppointments} />
    </div>
  );
}
