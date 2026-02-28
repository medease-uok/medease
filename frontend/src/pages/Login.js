import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { users, roles } from '../data/users';
import './Login.css';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [email, setEmail] = useState('admin@medease.com');
  const { login } = useAuth();
  const navigate = useNavigate();

  const roleUsers = users.filter((u) => u.role === selectedRole);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    const first = users.find((u) => u.role === role);
    if (first) setEmail(first.email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = users.find((u) => u.email === email);
    if (user) {
      login(user.id);
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-logo">+</span>
          <h1 className="login-title">MedEase</h1>
          <p className="login-subtitle">Hospital Management System</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Role</label>
            <select
              className="login-select"
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div className="login-field">
            <label className="login-label">Email</label>
            <select
              className="login-select"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            >
              {roleUsers.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              type="password"
              className="login-input"
              value="password123"
              readOnly
            />
          </div>
          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
