import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Calendar, Clock, AlertCircle, XCircle,
  Stethoscope, User, AlertTriangle,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../data/AuthContext'

const CANCELLATION_POLICY = {
  patient: { minHoursBeforeCancel: 24 },
  doctor: { minHoursBeforeCancel: 2 },
}

export default function CancelAppointmentModal({ appointmentId, appointment: appointmentProp, onClose, onCancelled }) {
  const [appointment, setAppointment] = useState(appointmentProp || null)
  const [loading, setLoading] = useState(!appointmentProp)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const { currentUser } = useAuth()

  const userRole = currentUser?.role
  const canBypassPolicy = userRole === 'nurse' || userRole === 'admin'

  useEffect(() => {
    if (appointmentProp) {
      setAppointment(appointmentProp)
      setLoading(false)
      return
    }

    if (!appointmentId) return

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    api.get(`/appointments/${appointmentId}`, { signal: controller.signal })
      .then((res) => setAppointment(res.data))
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError('Failed to load appointment details.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [appointmentId, appointmentProp])

  const calculateHoursUntil = (scheduledAt) => {
    const now = new Date()
    const appointmentTime = new Date(scheduledAt)
    const diffMs = appointmentTime - now
    return Math.floor(diffMs / (1000 * 60 * 60))
  }

  const formatTimeUntil = (hours) => {
    if (hours < 48) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`
    }
    const days = Math.floor(hours / 24)
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  const policyWarning = useMemo(() => {
    if (!appointment || canBypassPolicy) return null

    const hoursUntil = calculateHoursUntil(appointment.scheduledAt)

    if (hoursUntil < 0) {
      return {
        type: 'info',
        message: 'This appointment has already passed.',
        canCancel: true,
      }
    }

    const timeUntilText = formatTimeUntil(hoursUntil)

    if (userRole === 'patient') {
      const minHours = CANCELLATION_POLICY.patient.minHoursBeforeCancel
      if (hoursUntil < minHours) {
        return {
          type: 'error',
          message: `Patients cannot cancel appointments less than ${minHours} hours before the scheduled time. Please contact the clinic for assistance.`,
          canCancel: false,
        }
      }
      return {
        type: 'warning',
        message: `This appointment is in ${timeUntilText}. You can cancel it now, but please note our 24-hour cancellation policy for future reference.`,
        canCancel: true,
      }
    }

    if (userRole === 'doctor') {
      const minHours = CANCELLATION_POLICY.doctor.minHoursBeforeCancel
      if (hoursUntil < minHours) {
        return {
          type: 'error',
          message: `Doctors cannot cancel appointments less than ${minHours} hours before the scheduled time. Please contact administration for assistance.`,
          canCancel: false,
        }
      }
      return {
        type: 'warning',
        message: `This appointment is in ${timeUntilText}. Please ensure you notify the patient and administration.`,
        canCancel: true,
      }
    }

    return { type: 'info', message: null, canCancel: true }
  }, [appointment, userRole, canBypassPolicy])

  const handleCancel = async () => {
    if (cancelling) return

    setCancelling(true)
    setError(null)

    try {
      await api.delete(`/appointments/${appointmentId}`)
      try {
        onCancelled()
      } catch (callbackErr) {
        console.error('Error in onCancelled callback:', callbackErr)
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.data?.message || err.message || 'Failed to cancel appointment.'
      setError(errorMessage)
    } finally {
      setCancelling(false)
    }
  }

  const currentScheduledAt = appointment ? new Date(appointment.scheduledAt) : null
  const currentDate = currentScheduledAt?.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const currentTime = currentScheduledAt?.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 id="cancel-modal-title" className="text-lg font-semibold text-slate-900">Cancel Appointment</h2>
          <button onClick={onClose} aria-label="Close modal" className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {appointment && !loading && (
            <div className="space-y-5">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-slate-900">Appointment to Cancel</h3>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{appointment.doctorName}</p>
                    {appointment.specialization && (
                      <p className="text-xs text-slate-500">{appointment.specialization}</p>
                    )}
                  </div>
                </div>

                {!isPatient && appointment.patientName && (
                  <div className="flex items-center gap-3 pt-2 border-t border-red-100">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Patient</p>
                      <p className="text-sm font-medium text-slate-900">{appointment.patientName}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-red-100">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentTime}</span>
                  </div>
                </div>
              </div>

              {policyWarning && policyWarning.message && (
                <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                  policyWarning.type === 'error'
                    ? 'bg-red-50 border-red-200'
                    : policyWarning.type === 'warning'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-blue-50 border-blue-200'
                }`}>
                  <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    policyWarning.type === 'error'
                      ? 'text-red-600'
                      : policyWarning.type === 'warning'
                        ? 'text-amber-600'
                        : 'text-blue-600'
                  }`} />
                  <p className={`text-sm ${
                    policyWarning.type === 'error'
                      ? 'text-red-700'
                      : policyWarning.type === 'warning'
                        ? 'text-amber-700'
                        : 'text-blue-700'
                  }`}>
                    {policyWarning.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling || (policyWarning && !policyWarning.canCancel)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Cancel Appointment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
