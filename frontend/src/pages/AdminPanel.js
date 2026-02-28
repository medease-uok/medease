import { useState } from 'react';
import { users } from '../data/users';
import { auditLogs } from '../data/auditLogs';
import { useAuth } from '../data/AuthContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import './AdminPanel.css';

export default function AdminPanel() {
  const [tab, setTab] = useState('users');
  const [, forceUpdate] = useState(0);
  const { approveUser, rejectUser } = useAuth();

  const pendingUsers = users.filter((u) => !u.isActive);
  const activeUsers = users.filter((u) => u.isActive);

  const handleApprove = (userId) => {
    approveUser(userId);
    forceUpdate((n) => n + 1);
  };

  const handleReject = (userId) => {
    rejectUser(userId);
    forceUpdate((n) => n + 1);
  };

  const userColumns = [
    { key: 'name', label: 'Name', render: (_, row) => `${row.firstName} ${row.lastName}` },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (val) => <StatusBadge status={val} /> },
    { key: 'phone', label: 'Phone' },
  ];

  const pendingColumns = [
    ...userColumns,
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="admin-actions">
          <button className="admin-btn admin-btn-approve" onClick={() => handleApprove(row.id)}>
            Approve
          </button>
          <button className="admin-btn admin-btn-reject" onClick={() => handleReject(row.id)}>
            Reject
          </button>
        </div>
      ),
    },
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
          <DataTable columns={pendingColumns} data={pendingUsers} />
        ) : (
          <p className="admin-empty">No pending approvals.</p>
        )
      )}
      {tab === 'logs' && <DataTable columns={logColumns} data={[...auditLogs].reverse()} />}
    </div>
  );
}
