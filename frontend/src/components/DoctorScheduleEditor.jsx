import { useState, useEffect } from 'react'
import { Clock, Save, RotateCcw } from 'lucide-react'
import api from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SLOT_MINUTES = 20

const DEFAULT_SCHEDULE = DAYS.map((_, i) => ({
  dayOfWeek: i,
  startTime: '08:00',
  endTime: '17:00',
  isActive: i >= 1 && i <= 5, // Mon-Fri active by default
}))

function countSlots(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const total = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(0, Math.floor(total / SLOT_MINUTES))
}

function generateTimeOptions() {
  const options = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      options.push(val)
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

export default function DoctorScheduleEditor({ doctorId, onSave, readOnly = false, initialSchedule = null }) {
  const [schedule, setSchedule] = useState(initialSchedule || DEFAULT_SCHEDULE)
  const [loading, setLoading] = useState(!initialSchedule && !!doctorId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!doctorId || initialSchedule) return
    const fetchSchedule = async () => {
      try {
        const res = await api.get(`/schedules/${doctorId}`)
        const data = res.data.data || res.data
        if (data.schedule && data.schedule.length > 0) {
          // Merge fetched schedule with defaults for any missing days
          const merged = DEFAULT_SCHEDULE.map((def) => {
            const found = data.schedule.find((s) => s.dayOfWeek === def.dayOfWeek)
            return found || def
          })
          setSchedule(merged)
        }
      } catch {
        setError('Failed to load schedule.')
      } finally {
        setLoading(false)
      }
    }
    fetchSchedule()
  }, [doctorId, initialSchedule])

  const updateDay = (dayOfWeek, field, value) => {
    setSchedule((prev) =>
      prev.map((entry) =>
        entry.dayOfWeek === dayOfWeek ? { ...entry, [field]: value } : entry
      )
    )
    setSuccess(null)
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      const res = await api.put(`/schedules/${doctorId}`, { schedule })
      setSuccess('Schedule saved successfully.')
      if (onSave) onSave(res.data.data || res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save schedule.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSchedule(DEFAULT_SCHEDULE)
    setSuccess(null)
    setError(null)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          Weekly Schedule
        </CardTitle>
        <p className="text-sm text-slate-500 mt-0.5">
          {readOnly ? 'Doctor availability' : 'Set your weekly availability. Each appointment slot is 20 minutes.'}
        </p>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 mb-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="space-y-2">
          {schedule.map((entry) => {
            const slots = entry.isActive ? countSlots(entry.startTime, entry.endTime) : 0
            return (
              <div
                key={entry.dayOfWeek}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  entry.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'
                }`}
              >
                {/* Toggle */}
                <label className="flex items-center gap-2 min-w-[120px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entry.isActive}
                    onChange={(e) => updateDay(entry.dayOfWeek, 'isActive', e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm font-medium ${entry.isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {DAYS[entry.dayOfWeek]}
                  </span>
                </label>

                {/* Time pickers */}
                {entry.isActive && (
                  <>
                    <select
                      value={entry.startTime}
                      onChange={(e) => updateDay(entry.dayOfWeek, 'startTime', e.target.value)}
                      disabled={readOnly}
                      className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span className="text-slate-400 text-sm">to</span>
                    <select
                      value={entry.endTime}
                      onChange={(e) => updateDay(entry.dayOfWeek, 'endTime', e.target.value)}
                      disabled={readOnly}
                      className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      {TIME_OPTIONS.filter((t) => t > entry.startTime).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span className="text-xs text-slate-400 ml-auto">
                      {slots} slot{slots !== 1 ? 's' : ''}
                    </span>
                  </>
                )}

                {!entry.isActive && (
                  <span className="text-xs text-slate-400 ml-auto">Closed</span>
                )}
              </div>
            )
          })}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Schedule'}
            </button>
            <button
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { DEFAULT_SCHEDULE, DAYS, countSlots }
