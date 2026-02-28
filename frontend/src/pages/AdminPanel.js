import { useState } from 'react';
import { users } from '../data/users';
import { auditLogs } from '../data/auditLogs';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import './AdminPanel.css';

const userColumns = [
  { key: 'name', label: 'Name', render: (_, row) => `${row.firstName} ${row.lastName}` },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', render: (val) => <StatusBadge status={val} /> },
  { key: 'phone', label: 'Phone' },
  {
    key: 'isActive',
    label: 'Active',
    render: (val) => (
      <span style={{ color: val ? '#38a169' : '#e53e3e', fontWeight: 600 }}>
        {val ? 'Yes' : 'No'}
      </span>
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

export default function AdminPanel() {
  const [tab, setTab] = useState('users');

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
          className={`admin-tab ${tab === 'logs' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('logs')}
        >
          Audit Logs
        </button>
      </div>
      {tab === 'users' ? (
        <DataTable columns={userColumns} data={users} />
      ) : (
        <DataTable columns={logColumns} data={[...auditLogs].reverse()} />
      )}
    </div>
  );
}
