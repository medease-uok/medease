import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import './AdminPanel.css';

function ProfileDetails({ profileData }) {
  const entries = Object.entries(profileData || {}).filter(([, v]) => v);
  if (entries.length === 0) return <span className="admin-detail-empty">No additional details</span>;
  return (
    <div className="admin-profile-details">
      {entries.map(([key, val]) => (
        <div key={key} className="admin-detail-item">
          <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</strong>
          {String(val)}
        </div>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('users');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/users/pending'),
      api.get('/admin/users'),
      api.get('/admin/audit-logs'),
    ])
      .then(([pendingRes, usersRes, logsRes]) => {
        setPendingUsers(pendingRes.data);
        setActiveUsers(usersRes.data.filter((u) => u.isActive));
        setAuditLogs(logsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
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

  const logColumns = [
    { key: 'userName', label: 'User' },
    { key: 'action', label: 'Action' },
    { key: 'resourceType', label: 'Resource' },
    { key: 'ipAddress', label: 'IP Address' },
    {
      key: 'success',
      label: 'Status',
      render: (val) => (
        <span style={{ color: val ? '#38a169' : '#e53e3e', fontWeight: 600 }}>
          {val ? 'Success' : 'Failed'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Timestamp',
      render: (val) => new Date(val).toLocaleString(),
    },
  ];

  if (loading) return <div style={{ padding: 32 }}>Loading admin panel...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Admin Panel</h2>
      </div>
      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === 'users' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('users')}
        >
          User Management
        </button>
        <button
          className={`admin-tab ${tab === 'pending' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Pending Approvals
          {pendingUsers.length > 0 && (
            <span className="admin-pending-count">{pendingUsers.length}</span>
          )}
        </button>
        <button
          className={`admin-tab ${tab === 'logs' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('logs')}
        >
          Audit Logs
        </button>
      </div>
      {tab === 'users' && <DataTable columns={userColumns} data={activeUsers} />}
      {tab === 'pending' && (
        pendingUsers.length > 0 ? (
          <>
            <div className="admin-pending-banner">
              <span className="admin-pending-banner-icon">!</span>
              <span>{pendingUsers.length} user{pendingUsers.length > 1 ? 's' : ''} waiting for approval</span>
            </div>
            <div className="admin-pending-list">
              {pendingUsers.map((user) => (
                <div key={user.id} className="admin-pending-card">
                  <div className="admin-pending-header">
                    <div className="admin-pending-info">
                      <div className="admin-pending-name">{user.firstName} {user.lastName}</div>
                      <div className="admin-pending-meta">
                        {user.email} &middot; {user.phone || 'No phone'}
                      </div>
                    </div>
                    <div className="admin-pending-role">
                      <StatusBadge status={user.role} />
                    </div>
                  </div>
                  <div className="admin-pending-body">
                    <div className="admin-pending-body-title">Registration Details</div>
                    <ProfileDetails profileData={user.profileData} />
                  </div>
                  <div className="admin-pending-footer">
                    <button className="admin-btn admin-btn-approve" onClick={() => handleApprove(user.id)}>
                      Approve User
                    </button>
                    <button className="admin-btn admin-btn-reject" onClick={() => handleReject(user.id)}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">&#10003;</div>
            <p className="admin-empty-title">All caught up!</p>
            <p className="admin-empty-desc">No pending approvals at the moment.</p>
          </div>
        )
      )}
      {tab === 'logs' && <DataTable columns={logColumns} data={auditLogs} />}
    </div>
  );
}
