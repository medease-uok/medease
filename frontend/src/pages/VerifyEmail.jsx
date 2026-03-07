import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';
import { Activity, CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { resendVerification } = useAuth();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error' | 'prompt'
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const verifyAttempted = useRef(false);

  const pendingEmail = location.state?.email;

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    const r = await resendVerification(pendingEmail);
    setResendLoading(false);
    if (r.success) {
      setResendSent(true);
      setCooldown(30);
    } else {
      setStatus('error');
      setMessage(r.error || 'Could not send verification email. Try again.');
    }
  }, [cooldown, resendLoading, pendingEmail, resendVerification]);

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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-cta/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl shadow-primary/20 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-cta p-8 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white font-heading mb-2">
              MedEase
            </h1>
            <p className="text-white/90 text-sm">
              Hospital Management System
            </p>
          </div>

          {/* Body */}
          <div className="p-8">

            {/* --- Verifying (spinner) --- */}
            {status === 'verifying' && (
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Verifying your email...</h2>
                <p className="text-sm text-slate-500">Please wait a moment.</p>
              </div>
            )}

            {/* --- Prompt (post-registration) --- */}
            {status === 'prompt' && (
              <div className="text-center">
                <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">{message}</h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-1">
                  We've sent a verification link to <strong className="text-slate-800">{pendingEmail}</strong>.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Click the link in the email to verify your account.
                </p>

                {/* Spam note */}
                <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700">
                    Don't see the email? Check your <strong>spam or junk</strong> folder.
                  </p>
                </div>

                {/* Resend button with cooldown */}
                <button
                  type="button"
                  disabled={resendLoading || cooldown > 0}
                  onClick={handleResend}
                  className="
                    w-full py-3 px-4
                    border border-slate-300 rounded-lg
                    text-sm font-medium text-slate-700
                    hover:bg-slate-50 hover:text-slate-900
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all
                    flex items-center justify-center gap-2
                  "
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : cooldown > 0 ? (
                    `Resend Email (${cooldown}s)`
                  ) : resendSent ? (
                    'Resend Verification Email'
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>

                {resendSent && cooldown > 0 && (
                  <p className="mt-3 text-sm text-green-600 font-medium">
                    Verification email sent!
                  </p>
                )}

                <p className="mt-5 text-xs text-slate-400">
                  After verification, wait for admin approval to access the system.
                </p>
              </div>
            )}

            {/* --- Success (token verified) --- */}
            {status === 'success' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Email Verified!</h2>
                <p className="text-sm text-slate-600 mb-2">{message}</p>
                <p className="text-xs text-slate-400 mb-5">Redirecting to login in 3 seconds...</p>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="
                    w-full py-3 px-4
                    bg-gradient-to-r from-primary to-cta
                    text-white font-semibold rounded-lg
                    hover:shadow-lg hover:shadow-primary/30
                    transition-all duration-300
                  "
                >
                  Go to Login Now
                </button>
              </div>
            )}

            {/* --- Error --- */}
            {status === 'error' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Verification Failed</h2>

                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{message}</p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="
                    w-full py-3 px-4
                    bg-gradient-to-r from-primary to-cta
                    text-white font-semibold rounded-lg
                    hover:shadow-lg hover:shadow-primary/30
                    transition-all duration-300
                    mb-3
                  "
                >
                  Register Again
                </button>

                <Link
                  to="/login"
                  className="
                    inline-flex items-center gap-1
                    text-sm text-primary hover:text-primary/80
                    font-semibold transition-colors
                  "
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
