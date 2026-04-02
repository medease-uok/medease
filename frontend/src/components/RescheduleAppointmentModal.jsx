import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Calendar, Clock, AlertCircle, CheckCircle,
  Stethoscope,
} from 'lucide-react'
import api from '../services/api'
import TimeSlotPicker from './TimeSlotPicker'

export default function RescheduleAppointmentModal({ appointmentId, onClose, onRescheduled }) {
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [date, setDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!appointmentId) return
    setLoading(true)
    setError(null)
    api.get(`/appointments/${appointmentId}`)
      .then((res) => {
        setAppointment(res.data)
        // Pre-fill current date, but clamp to today if appointment is in the past
        const currentDate = new Date(res.data.scheduledAt)
        const apptDate = currentDate.toISOString().split('T')[0]
        setDate(apptDate >= today ? apptDate : today)
      })
      .catch(() => setError('Failed to load appointment details.'))
      .finally(() => setLoading(false))
  }, [appointmentId, today])

  useEffect(() => {
    if (!date || !appointment?.doctorId) {
      setSlots([])
      setSelectedSlot(null)
      return
    }

    const controller = new AbortController()
    setLoadingSlots(true)
    setSelectedSlot(null)
    setError(null)

    api.get(`/schedules/${appointment.doctorId}/slots?date=${date}`, { signal: controller.signal })
      .then((res) => setSlots(res.data?.slots || []))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Failed to load available slots.')
          setSlots([])
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingSlots(false)
        }
      })

    return () => controller.abort()
  }, [date, appointment?.doctorId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date || !selectedSlot || submitting) return

    // Validate slot format
    if (!/^\d{2}:\d{2}$/.test(selectedSlot)) {
      setError('Invalid time slot selected.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Construct ISO string with explicit Sri Lanka timezone offset
      // selectedSlot is in 24h format (e.g., "08:00") representing Sri Lanka time
      // Sri Lanka is UTC+05:30, so we append that offset and let JavaScript convert to UTC
      const scheduledAt = new Date(`${date}T${selectedSlot}:00+05:30`).toISOString()

      await api.put(`/appointments/${appointmentId}/reschedule`, { scheduledAt })
      onRescheduled()
    } catch (err) {
      setError(err?.response?.data?.message || err?.data?.message || err.message || 'Failed to reschedule appointment.')
    } finally {
      setSubmitting(false)
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
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Reschedule Appointment</h2>
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
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {appointment && !loading && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current appointment info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-slate-900">Current Appointment</h3>

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

                <div className="grid grid-cols-2 gap-3 text-sm">
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

              {/* New date selection */}
              <div>
                <label htmlFor="reschedule-date" className="block text-sm font-medium text-slate-700 mb-1">
                  New Date
                </label>
                <input
                  id="reschedule-date"
                  type="date"
                  required
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Available slots */}
              {date && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Available Slots
                  </label>
                  <TimeSlotPicker
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                    loading={loadingSlots}
                    allBookedSubMessage="Please select a different date."
                  />
                </div>
              )}

              {/* Submit buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedSlot}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Rescheduling...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm Reschedule
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
