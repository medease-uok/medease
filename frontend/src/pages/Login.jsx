import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Step 1 – submit email + password
  const handleCredentials = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.reason === 'otp_required') {
      setMaskedEmail(result.maskedEmail);
      setStep('otp');
      setError('');
    } else if (result.success) {
      navigate('/dashboard');
    } else if (result.reason === 'pending') {
      setError('Your account is pending admin approval.');
    } else {
      setError('Invalid email or password.');
    }
  };

  // Step 2 – submit OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the verification code.');
      return;
    }
    setLoading(true);
    const result = await verifyOtp(email, otp);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid verification code.');
    }
  };

  const handleBackToLogin = () => {
    setStep('credentials');
    setOtp('');
    setError('');
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

        {step === 'credentials' ? (
          <form onSubmit={handleCredentials}>
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
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <p className="login-otp-info">
              A 6-digit verification code was sent to <strong>{maskedEmail}</strong>.
              Enter it below to complete sign-in.
            </p>
            <div className="login-field">
              <label className="login-label">Verification Code</label>
              <input
                type="text"
                className="login-input login-otp-input"
                placeholder="Enter 6-digit code"
                value={otp}
                maxLength={6}
                autoComplete="one-time-code"
                inputMode="numeric"
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
              />
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              className="login-back-btn"
              onClick={handleBackToLogin}
              disabled={loading}
            >
              ← Back to Login
            </button>
          </form>
        )}

        {step === 'credentials' && (
          <div className="register-footer">
            Don&apos;t have an account? <Link to="/register">Create Account</Link>
          </div>
        )}
      </div>
    </div>
  );
}
