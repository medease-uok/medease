import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { Activity, Mail, Lock, AlertCircle } from 'lucide-react';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else if (result.reason === 'pending') {
      setError('Your account is pending admin approval.');
    } else {
      setError('Invalid email or password.');
    }
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

            <form onSubmit={handleSubmit} className="space-y-6">
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
          </div>
        </div>

      </div>
    </div>
  );
}
