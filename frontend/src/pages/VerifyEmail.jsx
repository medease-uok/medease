import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';
import './VerifyEmail.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { resendVerification } = useAuth();
  
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error' | 'prompt'
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const verifyAttempted = useRef(false);

  const pendingEmail = location.state?.email;

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      if (pendingEmail) {
        setStatus('prompt');
        setMessage('Registration successful!');
      } else {
        setStatus('error');
        setMessage('No verification token found in the link.');
      }
      return;
    }
    
    if (verifyAttempted.current) return;
    verifyAttempted.current = true;
    
    let timeoutId;
    api.get(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Email verified successfully.');
        timeoutId = setTimeout(() => navigate('/login'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'This verification link is invalid or has expired.');
      });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchParams, navigate, pendingEmail]);

  return (
    <div className="ve-page">
      <div className="ve-card">
        <div className="login-brand">
          <span className="login-logo">+</span>
          <h1 className="login-title">MedEase</h1>
          <p className="login-subtitle">Hospital Management System</p>
        </div>

        {status === 'verifying' && (
          <>
            <div className="ve-spinner" />
            <h2 className="ve-heading">Verifying your email...</h2>
            <p className="ve-hint">Please wait a moment.</p>
          </>
        )}

        {status === 'prompt' && (
          <>
            <div className="ve-icon ve-icon--success">✅</div>
            <h2 className="ve-heading">{message}</h2>
            {!resendSent ? (
              <>
                <p className="ve-hint">To start using your account, you need to verify your email address.</p>
                <button
                  className="login-button"
                  disabled={resendLoading}
                  onClick={async () => {
                    setResendLoading(true);
                    const r = await resendVerification(pendingEmail);
                    setResendLoading(false);
                    if (r.success) setResendSent(true);
                    else {
                      setStatus('error');
                      setMessage(r.error || 'Could not send verification email. Try again.');
                    }
                  }}
                  style={{ marginTop: '16px' }}
                >
                  {resendLoading ? 'Sending...' : 'Send Verification Email'}
                </button>
              </>
            ) : (
              <>
                <p className="ve-hint">📧 A verification link has been sent to <strong>{pendingEmail}</strong>.</p>
                <p className="ve-hint" style={{ color: '#2ecc71', fontWeight: 'bold' }}>✓ Check your inbox and click the link to verify.</p>
              </>
            )}
            <p className="ve-hint" style={{ fontSize: '0.85rem', marginTop: '16px' }}>
              After verification, wait for admin approval to access the system.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="ve-icon ve-icon--success">✓</div>
            <h2 className="ve-heading">Email Verified!</h2>
            <p className="ve-hint">{message}</p>
            <p className="ve-redirect">Redirecting to login in 3 seconds...</p>
            <button className="login-button" onClick={() => navigate('/login')}>
              Go to Login Now
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="ve-icon ve-icon--error">✗</div>
            <h2 className="ve-heading">Verification Failed</h2>
            <p className="ve-hint ve-hint--error">{message}</p>
            <button className="login-button" onClick={() => navigate('/register')}>
              Register Again
            </button>
            <p className="ve-back"><a href="/login">Back to Login</a></p>
          </>
        )}
      </div>
    </div>
  );
}
