import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { Activity, Mail, Lock, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';


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

  // Step 1 - submit email + password
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
    } else if (result.reason === 'unverified') {
      setError('Please verify your email address before logging in. Check your inbox.');
    } else if (result.reason === 'pending') {
      setError('Your account is pending admin approval.');
    } else {
      setError('Invalid email or password.');
    }
  };

  // Step 2 - submit OTP
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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-cta/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl shadow-primary/20 overflow-hidden">

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

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {step === 'credentials' ? (
              <form onSubmit={handleCredentials} className="space-y-6">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="Enter your email"
                      className="
                        w-full pl-11 pr-4 py-3
                        border border-slate-300 rounded-lg
                        focus:ring-2 focus:ring-primary focus:border-transparent
                        transition-all
                        placeholder:text-slate-400
                      "
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter your password"
                      className="
                        w-full pl-11 pr-4 py-3
                        border border-slate-300 rounded-lg
                        focus:ring-2 focus:ring-primary focus:border-transparent
                        transition-all
                        placeholder:text-slate-400
                      "
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full py-3 px-4
                    bg-gradient-to-r from-primary to-cta
                    text-white font-semibold rounded-lg
                    hover:shadow-lg hover:shadow-primary/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-300
                    flex items-center justify-center gap-2
                  "
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center mb-2">
                  <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-sm text-slate-600 leading-relaxed">
                    A 6-digit verification code was sent to <strong className="text-slate-800">{maskedEmail}</strong>.
                    Enter it below to complete sign-in.
                  </p>
                </div>

                <div>
                  <label htmlFor="login-otp" className="block text-sm font-medium text-slate-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="login-otp"
                    type="text"
                    value={otp}
                    maxLength={6}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                    placeholder="Enter 6-digit code"
                    className="
                      w-full py-3 px-4
                      border border-slate-300 rounded-lg
                      focus:ring-2 focus:ring-primary focus:border-transparent
                      transition-all
                      text-center text-2xl font-bold tracking-[0.3em] text-primary
                      placeholder:text-slate-400 placeholder:text-base placeholder:font-normal placeholder:tracking-normal
                    "
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full py-3 px-4
                    bg-gradient-to-r from-primary to-cta
                    text-white font-semibold rounded-lg
                    hover:shadow-lg hover:shadow-primary/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-300
                    flex items-center justify-center gap-2
                  "
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  disabled={loading}
                  className="
                    w-full py-2.5 px-4
                    border border-slate-300 rounded-lg
                    text-sm text-slate-600
                    hover:bg-slate-50 hover:text-slate-800
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all
                    flex items-center justify-center gap-2
                  "
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </form>
            )}

            {step === 'credentials' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
