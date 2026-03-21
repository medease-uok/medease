import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react'
import api from '../services/api'

const RESEND_COOLDOWN = 60 // seconds

function extractErrorMessage(err, fallback) {
  const data = err.data || {}
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors[0].message || data.errors[0].msg || fallback
  }
  return data.message || err.message || fallback
}

function getPasswordStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  return { score, label: labels[score], color: colors[score] }
}

export default function ForgotPassword() {
  const [step, setStep] = useState('email') // 'email' | 'otp' | 'reset' | 'done'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [userId, setUserId] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const navigate = useNavigate()

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // Auto-redirect after success
  useEffect(() => {
    if (step !== 'done') return
    const timer = setTimeout(() => navigate('/login'), 5000)
    return () => clearTimeout(timer)
  }, [step, navigate])

  // Clear sensitive state on unmount
  useEffect(() => {
    return () => {
      setOtp('')
      setResetToken('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }, [])

  // Step 1 — request OTP
  const handleRequestOtp = useCallback(async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setStep('otp')
      setResendCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to send reset code. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [email])

  // Resend OTP
  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0 || loading) return
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setResendCooldown(RESEND_COOLDOWN)
      setOtp('')
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to resend code. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [email, resendCooldown, loading])

  // Step 2 — verify OTP
  const handleVerifyOtp = useCallback(async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter the 6-digit code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await api.post('/auth/verify-reset-otp', { email, otp })
      setUserId(data.userId)
      setResetToken(data.resetToken)
      setStep('reset')
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid or expired code.'))
    } finally {
      setLoading(false)
    }
  }, [email, otp])

  // Step 3 — set new password
  const handleResetPassword = useCallback(async (e) => {
    e.preventDefault()
    const strength = getPasswordStrength(newPassword)
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (strength.score < 2) {
      setError('Password is too weak. Include uppercase, lowercase, numbers, or special characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', {
        userId,
        resetToken,
        newPassword,
        confirmPassword,
      })
      setStep('done')
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to reset password.'))
    } finally {
      setLoading(false)
    }
  }, [newPassword, confirmPassword, userId, resetToken])

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
              {step === 'done' ? 'Password Reset Complete' : 'Reset Your Password'}
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Step 1: Enter email */}
            {step === 'email' && (
              <form onSubmit={handleRequestOtp} noValidate className="space-y-6">
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                  Enter your email address and we'll send you a verification code to reset your password.
                </p>

                <div>
                  <label htmlFor="fp-email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="fp-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      placeholder="Enter your email"
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-primary to-cta text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Enter OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} noValidate className="space-y-6">
                <div className="text-center mb-2">
                  <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-sm text-slate-600 leading-relaxed">
                    A 6-digit code was sent to <strong className="text-slate-800">{email}</strong>.
                    Enter it below to continue.
                  </p>
                </div>

                <div>
                  <label htmlFor="fp-otp" className="block text-sm font-medium text-slate-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="fp-otp"
                    type="text"
                    value={otp}
                    maxLength={6}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                    placeholder="Enter 6-digit code"
                    className="w-full py-3 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center text-2xl font-bold tracking-[0.3em] text-primary placeholder:text-slate-400 placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-primary to-cta text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setOtp(''); setError('') }}
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Different email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || resendCooldown > 0}
                    className="flex-1 py-2.5 px-4 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: New password */}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword} noValidate className="space-y-6">
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                  Create a new password for your account.
                </p>

                <div>
                  <label htmlFor="fp-new-pw" className="block text-sm font-medium text-slate-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="fp-new-pw"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                      placeholder="At least 8 characters"
                      className="w-full pl-11 pr-11 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {newPassword && (() => {
                    const { score, label, color } = getPasswordStrength(newPassword)
                    return (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded ${i <= score ? color : 'bg-slate-200'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">Strength: <span className="font-semibold">{label}</span></p>
                      </div>
                    )
                  })()}
                </div>

                <div>
                  <label htmlFor="fp-confirm-pw" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="fp-confirm-pw"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                      placeholder="Re-enter your password"
                      className="w-full pl-11 pr-11 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-primary to-cta text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}

            {/* Step 4: Success */}
            {step === 'done' && (
              <div className="text-center space-y-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">Password Reset Successful</h2>
                  <p className="text-sm text-slate-600">
                    Your password has been updated. Redirecting to sign in...
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-primary to-cta text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                >
                  Go to Sign In
                </Link>
              </div>
            )}

            {/* Back to login link */}
            {step !== 'done' && (
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
