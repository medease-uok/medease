import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { roles } from '../data/users';
import './Login.css';
import './Register.css';

export default function Register() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'patient',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const success = register(form);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('An account with this email already exists.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card register-card">
        <div className="login-brand">
          <span className="login-logo">+</span>
          <h1 className="login-title">MedEase</h1>
          <p className="login-subtitle">Create an Account</p>
        </div>
        {error && <div className="register-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="register-row">
            <div className="login-field">
              <label className="login-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                className="login-input"
                value={form.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="login-field">
              <label className="login-label">Last Name *</label>
              <input
                type="text"
                name="lastName"
                className="login-input"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="login-field">
            <label className="login-label">Email *</label>
            <input
              type="email"
              name="email"
              className="login-input"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="login-field">
            <label className="login-label">Phone</label>
            <input
              type="tel"
              name="phone"
              className="login-input"
              placeholder="+94XXXXXXXXX"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div className="login-field">
            <label className="login-label">Role</label>
            <select
              name="role"
              className="login-select"
              value={form.role}
              onChange={handleChange}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div className="register-row">
            <div className="login-field">
              <label className="login-label">Password *</label>
              <input
                type="password"
                name="password"
                className="login-input"
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <div className="login-field">
              <label className="login-label">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                className="login-input"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>
          <button type="submit" className="login-button">
            Create Account
          </button>
        </form>
        <div className="register-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
