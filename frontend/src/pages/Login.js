import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    const result = login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else if (result.reason === 'pending') {
      setError('Your account is pending admin approval.');
    } else {
      setError('Invalid email or password.');
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
        {error && <div className="register-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              type="email"
              className="login-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
            />
          </div>
          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              type="password"
              className="login-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
          </div>
          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>
        <div className="register-footer">
          Don't have an account? <Link to="/register">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
