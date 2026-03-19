import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarClock,
  AlertCircle, Clock, LayoutGrid,
} from 'lucide-react'
import { useAuth } from '../data/AuthContext'
import api from '../services/api'
import { Card, CardContent } from '../components/ui/card'
import AppointmentDetailModal from '../components/AppointmentDetailModal'

const STATUS_COLORS = {
  scheduled:   { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200',   dot: 'bg-blue-500' },
  in_progress: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-200',  dot: 'bg-amber-500' },
  completed:   { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-200',  dot: 'bg-green-500' },
  cancelled:   { bg: 'bg-red-50',     text: 'text-red-400',    border: 'border-red-200',    dot: 'bg-red-400' },
  no_show:     { bg: 'bg-slate-100',  text: 'text-slate-500',  border: 'border-slate-200',  dot: 'bg-slate-400' },
}

const STATUS_LABELS = {
  scheduled: 'Scheduled', in_progress: 'In Progress',
  completed: 'Completed', cancelled: 'Cancelled', no_show: 'No Show',
}

const VIEWS = [
  { key: 'month', label: 'Month', icon: LayoutGrid },
  { key: 'week', label: 'Week', icon: CalendarDays },
  { key: 'day', label: 'Day', icon: CalendarClock },
]

const HOUR_START = 7
const HOUR_END = 19

function startOfDay(d) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c }
function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }

function getMonthDays(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDay = first.getDay()
  const days = []
  for (let i = startDay - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), outside: true })
  for (let d = 1; d <= last.getDate(); d++) days.push({ date: new Date(year, month, d), outside: false })
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) for (let i = 1; i <= remaining; i++) days.push({ date: new Date(year, month + 1, i), outside: true })
  return days
}

function getWeekDays(date) {
  const d = new Date(date)
  const day = d.getDay()
  const start = new Date(d)
  start.setDate(d.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const wd = new Date(start)
    wd.setDate(start.getDate() + i)
    return wd
  })
}

function formatTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatMonthYear(d) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatWeekRange(days) {
  const first = days[0]
  const last = days[6]
  const opts = { month: 'short', day: 'numeric' }
  if (first.getMonth() === last.getMonth()) {
    return `${first.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${last.getDate()}, ${last.getFullYear()}`
  }
  return `${first.toLocaleDateString('en-US', opts)} – ${last.toLocaleDateString('en-US', opts)}, ${last.getFullYear()}`
}

function formatDayHeader(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

/* ─── Appointment block (shared by week & day views) ─── */
function AppointmentBlock({ apt, showName, onClick, compact }) {
  const colors = STATUS_COLORS[apt.status] || STATUS_COLORS.scheduled
  const label = showName

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(apt.id) }}
      title={`${label} — ${STATUS_LABELS[apt.status] || apt.status}`}
      className={`group w-full text-left rounded-md border px-2 transition-all duration-150 hover:shadow-md hover:scale-[1.02] cursor-pointer ${colors.bg} ${colors.text} ${colors.border} ${compact ? 'py-0.5 text-xs' : 'py-1 text-xs'} ${apt.status === 'cancelled' ? 'opacity-60 line-through' : ''}`}
    >
      <div className="flex items-center gap-1 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
        <span className="truncate font-medium">{label}</span>
      </div>
      {!compact && (
        <span className="text-[10px] opacity-70 block truncate">{formatTime(new Date(apt.scheduledAt))}</span>
      )}
    </button>
  )
}

/* ─── Month view ─── */
function MonthView({ date, appointments, isPatient, onSelectDay, onSelectAppointment }) {
  const days = getMonthDays(date.getFullYear(), date.getMonth())
  const today = startOfDay(new Date())
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const dayMap = useMemo(() => {
    const map = {}
    for (const apt of appointments) {
      const d = startOfDay(new Date(apt.scheduledAt))
      const key = d.toISOString()
      if (!map[key]) map[key] = []
      map[key].push(apt)
    }
    return map
  }, [appointments])

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map(({ date: cellDate, outside }, i) => {
          const key = startOfDay(cellDate).toISOString()
          const apts = dayMap[key] || []
          const isToday = isSameDay(cellDate, today)
          const isCurrentMonth = !outside

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDay(cellDate)}
              className={`min-h-[100px] p-1.5 border-b border-r border-slate-100 text-left transition-colors hover:bg-slate-50 cursor-pointer ${!isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${isToday ? 'bg-primary text-white font-bold' : isCurrentMonth ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                  {cellDate.getDate()}
                </span>
                {apts.length > 0 && (
                  <span className="text-[10px] font-medium text-slate-400">{apts.length}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {apts.slice(0, 3).map((apt) => {
                  const colors = STATUS_COLORS[apt.status] || STATUS_COLORS.scheduled
                  return (
                    <div
                      key={apt.id}
                      onClick={(e) => { e.stopPropagation(); onSelectAppointment(apt.id) }}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium truncate border cursor-pointer hover:shadow-sm transition-shadow ${colors.bg} ${colors.text} ${colors.border} ${apt.status === 'cancelled' ? 'opacity-50 line-through' : ''}`}
                    >
                      {formatTime(new Date(apt.scheduledAt))} {isPatient ? apt.doctorName : apt.patientName}
                    </div>
                  )
                })}
                {apts.length > 3 && (
                  <span className="block text-[10px] text-slate-400 font-medium pl-1">+{apts.length - 3} more</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Week view ─── */
function WeekView({ date, appointments, isPatient, onSelectAppointment }) {
  const weekDays = getWeekDays(date)
  const today = startOfDay(new Date())
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  const columns = useMemo(() => {
    return weekDays.map((wd) => {
      const dayStart = startOfDay(wd)
      return appointments.filter((a) => isSameDay(new Date(a.scheduledAt), dayStart))
    })
  }, [weekDays, appointments])

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-slate-50 border-b border-slate-200">
        <div className="py-2.5 border-r border-slate-200" />
        {weekDays.map((wd, i) => {
          const isToday = isSameDay(wd, today)
          return (
            <div key={i} className={`py-2.5 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {wd.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-sm font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-slate-700'}`}>
                {wd.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] max-h-[600px] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="contents">
            <div className="h-16 border-b border-r border-slate-100 flex items-start justify-end pr-2 pt-1">
              <span className="text-[10px] font-medium text-slate-400">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </span>
            </div>
            {columns.map((colApts, ci) => {
              const isToday = isSameDay(weekDays[ci], today)
              const slotApts = colApts.filter((a) => new Date(a.scheduledAt).getHours() === hour)
              return (
                <div key={ci} className={`h-16 border-b border-r border-slate-100 last:border-r-0 p-0.5 ${isToday ? 'bg-primary/[0.02]' : ''}`}>
                  <div className="space-y-0.5">
                    {slotApts.map((apt) => (
                      <AppointmentBlock
                        key={apt.id}
                        apt={apt}
                        showName={isPatient ? apt.doctorName : (apt.patientName || 'Patient')}
                        onClick={onSelectAppointment}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Day view ─── */
function DayView({ date, appointments, isPatient, onSelectAppointment }) {
  const today = startOfDay(new Date())
  const isToday = isSameDay(date, today)
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  const dayApts = useMemo(
    () => appointments.filter((a) => isSameDay(new Date(a.scheduledAt), startOfDay(date))),
    [appointments, date],
  )

  const byHour = useMemo(() => {
    const map = {}
    for (const a of dayApts) {
      const h = new Date(a.scheduledAt).getHours()
      if (!map[h]) map[h] = []
      map[h].push(a)
    }
    return map
  }, [dayApts])

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Day header */}
      <div className={`px-5 py-3 border-b border-slate-200 ${isToday ? 'bg-primary/5' : 'bg-slate-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-slate-700'}`}>
              {date.toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
            <span className="text-sm text-slate-400 ml-2">
              {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {dayApts.length} {dayApts.length === 1 ? 'appointment' : 'appointments'}
          </span>
        </div>
      </div>

      {/* Time slots */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => {
          const slotApts = byHour[hour] || []
          const now = new Date()
          const isCurrentHour = isToday && now.getHours() === hour

          return (
            <div key={hour} className={`grid grid-cols-[80px_1fr] border-b border-slate-100 last:border-b-0 ${isCurrentHour ? 'bg-primary/[0.03]' : ''}`}>
              <div className="flex items-start justify-end pr-3 pt-2 border-r border-slate-100">
                <span className={`text-xs font-medium ${isCurrentHour ? 'text-primary' : 'text-slate-400'}`}>
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
              <div className={`p-2 ${slotApts.length > 0 ? 'min-h-[60px]' : 'min-h-[48px]'}`}>
                {slotApts.length > 0 ? (
                  <div className="space-y-1.5">
                    {slotApts.map((apt) => {
                      const colors = STATUS_COLORS[apt.status] || STATUS_COLORS.scheduled
                      const time = new Date(apt.scheduledAt)
                      return (
                        <button
                          key={apt.id}
                          type="button"
                          onClick={() => onSelectAppointment(apt.id)}
                          className={`w-full text-left rounded-lg border px-3 py-2 transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer ${colors.bg} ${colors.text} ${colors.border} ${apt.status === 'cancelled' ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                              <span className="font-semibold text-sm truncate">
                                {isPatient ? apt.doctorName : (apt.patientName || 'Patient')}
                              </span>
                            </div>
                            <span className="text-xs font-medium opacity-70 flex-shrink-0 ml-2">
                              {formatTime(time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 ml-4">
                            <span className="text-[11px] font-medium opacity-80">
                              {STATUS_LABELS[apt.status] || apt.status}
                            </span>
                            {apt.notes && (
                              <span className="text-[11px] opacity-60 truncate">
                                {apt.notes}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state for day */}
      {dayApts.length === 0 && (
        <div className="py-12 text-center">
          <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No appointments on this day</p>
        </div>
      )}
    </div>
  )
}

/* ─── Calendar Skeleton ─── */
function CalendarSkeleton() {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden animate-pulse">
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="py-3 flex justify-center"><div className="h-3 w-8 bg-slate-200 rounded" /></div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-[100px] p-2 border-b border-r border-slate-100">
            <div className="h-5 w-5 bg-slate-200 rounded-full mb-2" />
            <div className="space-y-1">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export default function ScheduleCalendar({ embedded, appointments: externalApts, loading: externalLoading, error: externalError, onRetry, onSelectAppointment: externalOnSelect }) {
  const [view, setView] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [internalApts, setInternalApts] = useState([])
  const [internalLoading, setInternalLoading] = useState(!embedded)
  const [internalError, setInternalError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const { currentUser } = useAuth()
  const isPatient = currentUser?.role === 'patient'

  const appointments = embedded ? (externalApts || []) : internalApts
  const loading = embedded ? (externalLoading ?? false) : internalLoading
  const error = embedded ? (externalError ?? null) : internalError

  const fetchAppointments = useCallback(() => {
    if (embedded) { if (onRetry) onRetry(); return }
    setInternalLoading(true)
    setInternalError(null)
    api.get('/appointments')
      .then((res) => setInternalApts(res.data || []))
      .catch(() => setInternalError('Failed to load appointments.'))
      .finally(() => setInternalLoading(false))
  }, [embedded, onRetry])

  useEffect(() => {
    if (embedded) return
    let cancelled = false
    setInternalLoading(true)
    api.get('/appointments')
      .then((res) => { if (!cancelled) setInternalApts(res.data || []) })
      .catch(() => { if (!cancelled) setInternalError('Failed to load appointments.') })
      .finally(() => { if (!cancelled) setInternalLoading(false) })
    return () => { cancelled = true }
  }, [embedded])

  const goToday = () => setCurrentDate(new Date())

  const goPrev = () => {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else d.setDate(d.getDate() - 1)
    setCurrentDate(d)
  }

  const goNext = () => {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else d.setDate(d.getDate() + 1)
    setCurrentDate(d)
  }

  const handleSelectDay = (day) => {
    setCurrentDate(day)
    setView('day')
  }

  const headerLabel = useMemo(() => {
    if (view === 'month') return formatMonthYear(currentDate)
    if (view === 'week') return formatWeekRange(getWeekDays(currentDate))
    return formatDayHeader(currentDate)
  }, [view, currentDate])

  /* Status summary */
  const statusSummary = useMemo(() => {
    const counts = {}
    for (const a of appointments) {
      counts[a.status] = (counts[a.status] || 0) + 1
    }
    return counts
  }, [appointments])

  const handleSelectAppointment = embedded ? (externalOnSelect || setSelectedId) : setSelectedId

  return (
    <div className="space-y-6">
      {/* Page header (hidden when embedded) */}
      {!embedded && (
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
            {isPatient ? 'My Schedule' : 'Schedule Calendar'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isPatient
              ? 'View your appointments on the calendar.'
              : 'View and manage appointment schedules.'}
          </p>
        </div>
      )}

      {/* Toolbar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToday}
                className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                Today
              </button>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={goPrev}
                  className="p-1.5 hover:bg-slate-50 transition-colors"
                  aria-label={`Previous ${view}`}
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={goNext}
                  className="p-1.5 hover:bg-slate-50 transition-colors border-l border-slate-200"
                  aria-label={`Next ${view}`}
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <h2 className="text-sm font-semibold text-slate-700 ml-1">{headerLabel}</h2>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* View toggle */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden" role="group" aria-label="Calendar view">
              {VIEWS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  aria-pressed={view === key}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                    view === key
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  } ${key !== 'month' ? 'border-l border-slate-200' : ''}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Status legend */}
          {!loading && appointments.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap mt-3 pt-3 border-t border-slate-100">
              {Object.entries(statusSummary).map(([status, count]) => {
                const colors = STATUS_COLORS[status] || STATUS_COLORS.scheduled
                return (
                  <div key={status} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span>{STATUS_LABELS[status] || status}</span>
                    <span className="font-medium text-slate-700">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchAppointments}
            className="ml-auto px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !error && <CalendarSkeleton />}

      {/* Calendar views */}
      {!loading && !error && (
        <>
          {view === 'month' && (
            <MonthView
              date={currentDate}
              appointments={appointments}
              isPatient={isPatient}
              onSelectDay={handleSelectDay}
              onSelectAppointment={handleSelectAppointment}
            />
          )}
          {view === 'week' && (
            <WeekView
              date={currentDate}
              appointments={appointments}
              isPatient={isPatient}
              onSelectAppointment={handleSelectAppointment}
            />
          )}
          {view === 'day' && (
            <DayView
              date={currentDate}
              appointments={appointments}
              isPatient={isPatient}
              onSelectAppointment={handleSelectAppointment}
            />
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !error && appointments.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">No appointments yet</p>
              <p className="text-sm text-slate-500 mt-1">
                {isPatient
                  ? 'Your scheduled appointments will appear here.'
                  : 'No appointments in the system yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment detail modal (only when standalone) */}
      {!embedded && selectedId && (
        <AppointmentDetailModal
          appointmentId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChange={fetchAppointments}
        />
      )}
    </div>
  )
}
