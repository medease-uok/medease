import { useState, useEffect } from 'react'
import {
  X, Search, Stethoscope, Building2, BadgeCheck, Calendar,
  Clock, AlertCircle, FileText, Repeat, ArrowLeft, CheckCircle,
} from 'lucide-react'
import api from '../services/api'
import VoiceNoteButton from './VoiceNoteButton'

function formatSlotTime(time) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

const RECURRENCE_OPTIONS = [
  { value: '', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
]

function DoctorPicker({ onSelect }) {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/doctors')
      .then((res) => setDoctors(res.data || []))
      .catch(() => setError('Failed to load doctors.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = doctors.filter((d) => {
    if (!search) return d.available
    const q = search.toLowerCase()
    return d.available && (
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(q)
      || d.specialization?.toLowerCase().includes(q)
      || d.department?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="search"
          placeholder="Search by name, specialization, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          autoFocus
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">
          {search ? 'No available doctors match your search.' : 'No available doctors found.'}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {filtered.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-green-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  Dr. {d.firstName} {d.lastName}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  {d.specialization && (
                    <span className="flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      {d.specialization}
                    </span>
                  )}
                  {d.department && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {d.department}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SlotBooking({ doctor, onBack, onBooked }) {
  const [date, setDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [notes, setNotes] = useState('')
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [recurrencePattern, setRecurrencePattern] = useState('')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!date) {
      setSlots([])
      setSelectedSlot(null)
      return
    }
    setLoadingSlots(true)
    setSelectedSlot(null)
    setError(null)
    api.get(`/schedules/${doctor.id}/slots?date=${date}`)
      .then((res) => setSlots(res.data?.slots || []))
      .catch(() => {
        setError('Failed to load available slots.')
        setSlots([])
      })
      .finally(() => setLoadingSlots(false))
  }, [date, doctor.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date || !selectedSlot) return

    setSubmitting(true)
    setError(null)

    try {
      const scheduledAt = `${date}T${selectedSlot}:00Z`
      if (recurrencePattern) {
        await api.post('/appointments/recurring', {
          doctorId: doctor.id,
          scheduledAt,
          notes: notes.trim() || undefined,
          recurrencePattern,
          recurrenceEndDate,
        })
      } else {
        await api.post('/appointments', {
          doctorId: doctor.id,
          scheduledAt,
          notes: notes.trim() || undefined,
        })
      }
      onBooked()
    } catch (err) {
      setError(err?.response?.data?.message || err?.data?.message || err.message || 'Failed to book appointment.')
    } finally {
      setSubmitting(false)
    }
  }

  const availableSlots = slots.filter((s) => s.available)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Change doctor
      </button>

      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
        <Stethoscope className="w-5 h-5 text-green-600" />
        <div>
          <p className="font-medium text-slate-900">Dr. {doctor.firstName} {doctor.lastName}</p>
          <p className="text-sm text-slate-500">{doctor.specialization} - {doctor.department}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="book-date" className="block text-sm font-medium text-slate-700 mb-1">
          Date
        </label>
        <input
          id="book-date"
          type="date"
          required
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {date && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Available Slots
          </label>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              Doctor is not available on this day.
            </p>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-amber-600 text-center py-4">
              No slots available for this day. All slots are booked.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={`px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    selectedSlot === slot.time
                      ? 'bg-primary text-white border-primary'
                      : slot.available
                        ? 'bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary'
                        : 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                  }`}
                >
                  {formatSlotTime(slot.time)}
                </button>
              ))}
            </div>
          )}
          {availableSlots.length > 0 && (
            <p className="text-xs text-slate-400 mt-2">
              {availableSlots.length} of {slots.length} slots available
            </p>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="book-notes" className="block text-sm font-medium text-slate-700">
            Notes <span className="text-slate-400">(optional)</span>
          </label>
          <VoiceNoteButton onTranscript={(t) => setNotes((v) => v ? `${v} ${t}` : t)} maxLength={500} currentLength={notes.length} />
        </div>
        <textarea
          id="book-notes"
          rows={3}
          maxLength={500}
          placeholder="Reason for visit, symptoms, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
          <Repeat className="w-3.5 h-3.5 text-slate-400" />
          Repeat
        </label>
        <select
          value={recurrencePattern}
          onChange={(e) => {
            setRecurrencePattern(e.target.value)
            if (!e.target.value) setRecurrenceEndDate('')
          }}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {RECURRENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {recurrencePattern && (
        <div>
          <label htmlFor="book-recurrence-end" className="block text-sm font-medium text-slate-700 mb-1">
            Repeat until
          </label>
          <input
            id="book-recurrence-end"
            type="date"
            required
            min={date || today}
            value={recurrenceEndDate}
            onChange={(e) => setRecurrenceEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={submitting || !date || !selectedSlot || (recurrencePattern && !recurrenceEndDate)}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Booking...' : selectedSlot ? (recurrencePattern ? `Book Recurring ${formatSlotTime(selectedSlot)}` : `Book ${formatSlotTime(selectedSlot)}`) : 'Select a slot'}
        </button>
      </div>
    </form>
  )
}

export default function BookAppointmentModal({ onClose, onBooked }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleBooked = () => {
    setSuccess(true)
    setTimeout(() => {
      onBooked()
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {success ? 'Booked!' : selectedDoctor ? 'Book Appointment' : 'Select a Doctor'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5">
          {success ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-lg font-medium text-slate-900">Appointment booked successfully!</p>
            </div>
          ) : selectedDoctor ? (
            <SlotBooking
              doctor={selectedDoctor}
              onBack={() => setSelectedDoctor(null)}
              onBooked={handleBooked}
            />
          ) : (
            <DoctorPicker onSelect={setSelectedDoctor} />
          )}
        </div>
      </div>
    </div>
  )
}
