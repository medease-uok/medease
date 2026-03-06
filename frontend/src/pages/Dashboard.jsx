import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import './Dashboard.css';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
};

const GREETINGS = {
  admin: { title: 'Admin Dashboard', subtitle: 'System overview and management' },
  doctor: { title: 'Doctor Dashboard', subtitle: 'Your patients and appointments' },
  nurse: { title: 'Nurse Dashboard', subtitle: 'Patient care overview' },
  patient: { title: 'My Health Dashboard', subtitle: 'Your health at a glance' },
  lab_technician: { title: 'Lab Dashboard', subtitle: 'Tests and reports overview' },
  pharmacist: { title: 'Pharmacy Dashboard', subtitle: 'Prescriptions and dispensing' },
};

const QUICK_ACTIONS = {
  admin: [
    { label: 'Manage Users', path: '/admin', icon: 'U' },
    { label: 'View Patients', path: '/patients', icon: 'P' },
    { label: 'Appointments', path: '/appointments', icon: 'A' },
    { label: 'View Doctors', path: '/doctors', icon: 'D' },
  ],
  doctor: [
    { label: 'My Appointments', path: '/appointments', icon: 'A' },
    { label: 'View Patients', path: '/patients', icon: 'P' },
    { label: 'Prescriptions', path: '/prescriptions', icon: 'R' },
    { label: 'Medical Records', path: '/medical-records', icon: 'M' },
  ],
  nurse: [
    { label: 'Appointments', path: '/appointments', icon: 'A' },
    { label: 'View Patients', path: '/patients', icon: 'P' },
    { label: 'Medical Records', path: '/medical-records', icon: 'M' },
    { label: 'Prescriptions', path: '/prescriptions', icon: 'R' },
  ],
  patient: [
    { label: 'My Appointments', path: '/appointments', icon: 'A' },
    { label: 'My Prescriptions', path: '/prescriptions', icon: 'R' },
    { label: 'Lab Reports', path: '/lab-reports', icon: 'L' },
    { label: 'Medical Records', path: '/medical-records', icon: 'M' },
  ],
  lab_technician: [
    { label: 'Lab Reports', path: '/lab-reports', icon: 'L' },
    { label: 'View Patients', path: '/patients', icon: 'P' },
  ],
  pharmacist: [
    { label: 'Prescriptions', path: '/prescriptions', icon: 'R' },
  ],
};

const ACTIVITY_ICONS = {
  'appointment-scheduled': { icon: 'A', color: '#3182ce', bg: '#ebf4ff' },
  'appointment-completed': { icon: 'C', color: '#38a169', bg: '#e6ffed' },
  'appointment-cancelled': { icon: 'X', color: '#e53e3e', bg: '#fed7d7' },
  'prescription': { icon: 'R', color: '#805ad5', bg: '#faf5ff' },
  'record-created': { icon: 'M', color: '#d69e2e', bg: '#fffff0' },
  'lab-report': { icon: 'L', color: '#319795', bg: '#e6fffa' },
  'audit-login': { icon: 'I', color: '#38a169', bg: '#e6ffed' },
  'audit-logout': { icon: 'O', color: '#718096', bg: '#edf2f7' },
  'audit-admin': { icon: 'S', color: '#d69e2e', bg: '#fffff0' },
  'audit-view': { icon: 'V', color: '#3182ce', bg: '#ebf4ff' },
  'audit-create': { icon: '+', color: '#38a169', bg: '#e6ffed' },
  'audit-update': { icon: 'E', color: '#d69e2e', bg: '#fffff0' },
  'audit-delete': { icon: 'D', color: '#e53e3e', bg: '#fed7d7' },
  'audit': { icon: 'A', color: '#718096', bg: '#edf2f7' },
};

const recentAppointmentCols = [
  { key: 'patientName', label: 'Patient' },
  { key: 'doctorName', label: 'Doctor' },
  { key: 'scheduledAt', label: 'Date', render: (val) => formatDate(val) },
  { key: 'time', label: 'Time', render: (_, row) => formatTime(row.scheduledAt) },
  { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
];

function ActivityItem({ activity }) {
  const style = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS['audit'];
  return (
    <div className="dash-activity-item">
      <div className="dash-activity-icon" style={{ backgroundColor: style.bg, color: style.color }}>
        {style.icon}
      </div>
      <div className="dash-activity-content">
        <div className="dash-activity-desc">{activity.description}</div>
        <div className="dash-activity-meta">
          <span className="dash-activity-user">{activity.user}</span>
          <span className="dash-activity-time">{timeAgo(activity.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

function AdminSection() {
  const [tab, setTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/admin/users/pending'),
      api.get('/admin/users'),
    ]).then(([pendingRes, usersRes]) => {
      if (pendingRes.status === 'fulfilled') setPendingUsers(pendingRes.value.data);
      if (usersRes.status === 'fulfilled') setActiveUsers(usersRes.value.data.filter((u) => u.isActive));
    }).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/approve`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}/reject`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  const userColumns = [
    { key: 'name', label: 'Name', render: (_, row) => `${row.firstName} ${row.lastName}` },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (val) => <StatusBadge status={val} /> },
    { key: 'phone', label: 'Phone' },
  ];

  if (loading) return <div className="dash-section-loading">Loading admin data...</div>;

  return (
    <div className="dash-admin-section">
      <div className="dash-admin-tabs">
        <button
          className={`dash-admin-tab ${tab === 'pending' ? 'dash-admin-tab-active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Pending Approvals
          {pendingUsers.length > 0 && (
            <span className="dash-admin-badge">{pendingUsers.length}</span>
          )}
        </button>
        <button
          className={`dash-admin-tab ${tab === 'users' ? 'dash-admin-tab-active' : ''}`}
          onClick={() => setTab('users')}
        >
          All Users
        </button>
      </div>

      {tab === 'pending' && (
        pendingUsers.length > 0 ? (
          <div className="dash-pending-list">
            {pendingUsers.map((user) => (
              <div key={user.id} className="dash-pending-card">
                <div className="dash-pending-info">
                  <div className="dash-pending-name">{user.firstName} {user.lastName}</div>
                  <div className="dash-pending-meta">
                    {user.email} &middot; <StatusBadge status={user.role} />
                  </div>
                </div>
                <div className="dash-pending-actions">
                  <button className="dash-btn dash-btn-approve" onClick={() => handleApprove(user.id)}>Approve</button>
                  <button className="dash-btn dash-btn-reject" onClick={() => handleReject(user.id)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dash-empty-state">
            <span className="dash-empty-check">&#10003;</span>
            No pending approvals
          </div>
        )
      )}

      {tab === 'users' && <DataTable columns={userColumns} data={activeUsers} />}
    </div>
  );
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const role = currentUser?.role || 'patient';
  const greeting = GREETINGS[role] || GREETINGS.patient;
  const quickActions = QUICK_ACTIONS[role] || [];

  const [stats, setStats] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/dashboard/stats'),
      api.get('/dashboard/activity'),
    ]).then(([statsRes, activityRes]) => {
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.stats);
        setRecentAppointments(statsRes.value.data.recentAppointments);
      }
      if (activityRes.status === 'fulfilled') {
        setActivities(activityRes.value.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 32 }}>Loading dashboard...</div>;

  return (
    <div className="dash-root">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">{greeting.title}</h2>
          <p className="dash-subtitle">
            Welcome back, {currentUser?.firstName}. {greeting.subtitle}.
          </p>
        </div>
      </div>

      <div className="dash-stats">
        {stats.map((s, i) => (
          <StatsCard key={i} label={s.label} value={s.value} accentColor={s.color} />
        ))}
      </div>

      {quickActions.length > 0 && (
        <div className="dash-quick-actions">
          <h3 className="dash-section-title">Quick Actions</h3>
          <div className="dash-actions-grid">
            {quickActions.map((action) => (
              <button
                key={action.path}
                className="dash-action-btn"
                onClick={() => navigate(action.path)}
              >
                <span className="dash-action-icon">{action.icon}</span>
                <span className="dash-action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dash-main-grid">
        <div className="dash-main-left">
          {role === 'admin' && (
            <>
              <h3 className="dash-section-title">User Management</h3>
              <AdminSection />
            </>
          )}

          <h3 className="dash-section-title">Recent Appointments</h3>
          <DataTable columns={recentAppointmentCols} data={recentAppointments} />
        </div>

        <div className="dash-main-right">
          <h3 className="dash-section-title">Recent Activity</h3>
          <div className="dash-activity-list">
            {activities.length === 0 ? (
              <div className="dash-empty-state">No recent activity</div>
            ) : (
              activities.map((a) => <ActivityItem key={a.id} activity={a} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
