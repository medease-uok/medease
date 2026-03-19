import { useState, useEffect } from 'react'
import {
  X, Calendar, Clock, Stethoscope, User, FileText,
  Building2, BadgeCheck, AlertCircle,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../data/AuthContext'
import StatusBadge from './StatusBadge'

export default function AppointmentDetailModal({ appointmentId, onClose, onStatusChange }) {
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const { currentUser } = useAuth()
  const isPatient = currentUser?.role === 'patient'

  useEffect(() => {
    if (!appointmentId) return
    setLoading(true)
    setError(null)
    api.get(`/appointments/${appointmentId}`)
      .then((res) => setAppointment(res.data))
      .catch(() => setError('Failed to load appointment details.'))
      .finally(() => setLoading(false))
  }, [appointmentId])

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    setCancelling(true)
    try {
      await api.patch(`/appointments/${appointmentId}/status`, { status: 'cancelled' })
      if (onStatusChange) onStatusChange()
      onClose()
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to cancel appointment.')
    } finally {
      setCancelling(false)
    }
  }

  const canCancel = appointment && appointment.status === 'scheduled'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Appointment Details</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
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
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {appointment && !loading && (
            <div className="space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between">
                <StatusBadge status={appointment.status} />
                {appointment.createdAt && (
                  <span className="text-xs text-slate-400">
                    Booked {new Date(appointment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Doctor info */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Stethoscope className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-slate-900">{appointment.doctorName}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                    {appointment.specialization && (
                      <span className="flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {appointment.specialization}
                      </span>
                    )}
                    {appointment.department && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {appointment.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Patient info (for non-patients) */}
              {!isPatient && appointment.patientName && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Patient</p>
                    <p className="font-medium text-slate-900">{appointment.patientName}</p>
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Date</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(appointment.scheduledAt).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Time</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(appointment.scheduledAt).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {appointment.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Notes</p>
                    <p className="text-sm text-slate-700 mt-0.5">{appointment.notes}</p>
                  </div>
                </div>
              )}

              {/* Cancel button */}
              {canCancel && (
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
