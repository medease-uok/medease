import { useState, useCallback, useEffect, useMemo, useDeferredValue } from 'react';
import {
  Calendar, AlertCircle, Search, Clock, User, Stethoscope, CalendarDays, X, FileText, List,
  CalendarPlus, Repeat,
} from 'lucide-react';
import { appointmentStatuses } from '../constants';
import { useAuth } from '../data/AuthContext';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import BookAppointmentModal from '../components/BookAppointmentModal';
import ScheduleCalendar from './ScheduleCalendar';

const STATUS_STYLES = {
  scheduled: { variant: 'default', label: 'Scheduled' },
  in_progress: { variant: 'warning', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
  no_show: { variant: 'secondary', label: 'No Show' },
};

const RECURRENCE_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
};

const SKELETON_COUNT = 6;

const formatDate = (iso) => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const matchesSearch = (a, query) => {
  const q = query.toLowerCase();
  return ['doctorName', 'patientName', 'notes']
    .some((field) => a[field]?.toLowerCase().includes(q));
};

function AppointmentCard({ appointment, showPatient, isDoctor, onClick }) {
  const style = STATUS_STYLES[appointment.status] ?? { variant: 'outline', label: appointment.status ?? 'Unknown' };
  const primaryName = isDoctor
    ? (appointment.patientName || 'Patient')
    : (appointment.doctorName || 'Doctor');
  const secondaryName = isDoctor ? null : (showPatient && appointment.patientName);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200 text-left w-full cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDoctor ? 'bg-green-100' : 'bg-blue-100'}`}>
            {isDoctor
              ? <User className="w-5 h-5 text-green-600" aria-hidden="true" />
              : <Calendar className="w-5 h-5 text-blue-600" aria-hidden="true" />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{primaryName}</h3>
            {secondaryName && (
              <p className="text-sm text-slate-500">{secondaryName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {appointment.seriesId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              <Repeat className="w-3 h-3" />
              {RECURRENCE_LABELS[appointment.recurrencePattern] || 'Recurring'}
            </span>
          )}
          <Badge variant={style.variant}>{style.label}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {appointment.scheduledAt && (
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>
              {appointment.seriesId && <span className="font-medium">Next: </span>}
              <time dateTime={appointment.scheduledAt}>{formatDate(appointment.scheduledAt)}</time>
            </span>
          </div>
        )}
        {appointment._seriesCount > 1 && (
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            {appointment._seriesCount} appointments in series
          </div>
        )}
        {appointment.notes && (
          <div className="flex items-center gap-2 text-slate-600 col-span-2">
            <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{appointment.notes}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Appointments() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [showBooking, setShowBooking] = useState(false);
  const { currentUser } = useAuth();
  const isPatient = currentUser?.role === 'patient';
  const isDoctor = currentUser?.role === 'doctor';
  const deferredSearch = useDeferredValue(search);

  const fetchAppointments = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/appointments')
      .then((res) => setAppointments(res.data || []))
      .catch(() => setError('Failed to load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/appointments')
      .then((res) => { if (!cancelled) setAppointments(res.data || []); })
      .catch(() => { if (!cancelled) setError('Failed to load appointments.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => {
      const base = appointments.filter((a) => {
        if (filter !== 'all' && a.status !== filter) return false;
        if (deferredSearch && !matchesSearch(a, deferredSearch)) return false;
        if (dateFrom || dateTo) {
          const aDate = a.scheduledAt ? new Date(a.scheduledAt).getTime() : NaN;
          if (isNaN(aDate)) return false;
          if (dateFrom && aDate < new Date(dateFrom).getTime()) return false;
          if (dateTo && aDate > new Date(dateTo + 'T23:59:59').getTime()) return false;
        }
        return true;
      });

      // Collapse recurring series: show only the next upcoming per series
      const now = Date.now();
      const seriesMap = new Map();
      const result = [];

      for (const a of base) {
        if (!a.seriesId) {
          result.push(a);
          continue;
        }
        const existing = seriesMap.get(a.seriesId);
        if (!existing) {
          seriesMap.set(a.seriesId, { best: a, count: 1 });
        } else {
          existing.count++;
          const existingTime = new Date(existing.best.scheduledAt).getTime();
          const thisTime = new Date(a.scheduledAt).getTime();
          // Prefer the nearest future appointment, or the latest if all past
          if (thisTime >= now && (existingTime < now || thisTime < existingTime)) {
            existing.best = a;
          } else if (existingTime < now && thisTime > existingTime) {
            existing.best = a;
          }
        }
      }

      for (const { best, count } of seriesMap.values()) {
        result.push({ ...best, _seriesCount: count });
      }

      return result;
    },
    [appointments, filter, deferredSearch, dateFrom, dateTo],
  );

  const statusCounts = useMemo(
    () => appointments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {}),
    [appointments],
  );

  const hasFilters = search || filter !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
            {isPatient ? 'My Appointments' : 'Appointments'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isPatient
              ? 'View your scheduled and past appointments.'
              : 'Manage and review patient appointments.'}
          </p>
        </div>
        {isPatient && (
          <button
            onClick={() => setShowBooking(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
          >
            <CalendarPlus className="w-4 h-4" />
            Book Appointment
          </button>
        )}
      </div>

      {/* List / Calendar toggle */}
      <div className="border-b border-slate-200">
          <nav className="flex gap-1 -mb-px" aria-label="View mode">
            <button
              onClick={() => setViewMode('list')}
              role="tab"
              aria-selected={viewMode === 'list'}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'list'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              role="tab"
              aria-selected={viewMode === 'calendar'}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'calendar'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </button>
          </nav>
        </div>

      {/* Calendar view */}
      {viewMode === 'calendar' && (
        <ScheduleCalendar
          embedded
          appointments={appointments}
          loading={loading}
          error={error}
          onRetry={fetchAppointments}
          onSelectAppointment={setSelectedId}
        />
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <>
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                    <label htmlFor="apt-search" className="sr-only">Search appointments</label>
                    <input
                      id="apt-search"
                      type="search"
                      placeholder="Search doctors, patients, notes..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2" role="group" aria-label="Filter by date range">
                    <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="apt-date-from" className="sr-only">From date</label>
                      <input
                        id="apt-date-from"
                        type="date"
                        value={dateFrom}
                        max={dateTo || undefined}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                      />
                      <span className="text-sm text-slate-400">to</span>
                      <label htmlFor="apt-date-to" className="sr-only">To date</label>
                      <input
                        id="apt-date-to"
                        type="date"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                      />
                    </div>
                    {(dateFrom || dateTo) && (
                      <button
                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="Clear date range"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by status">
                  <button
                    onClick={() => setFilter('all')}
                    aria-pressed={filter === 'all'}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      filter === 'all'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({appointments.length})
                  </button>
                  {appointmentStatuses.map((s) => {
                    const style = STATUS_STYLES[s] || {};
                    return (
                      <button
                        key={s}
                        onClick={() => setFilter(s)}
                        aria-pressed={filter === s}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          filter === s
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {style.label || s} ({statusCounts[s] || 0})
                      </button>
                    );
                  })}
                </div>
              </div>
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
          {loading && !error && <ListSkeleton />}

          {/* Results count */}
          {!loading && !error && (
            <output aria-live="polite" className="block text-sm text-slate-500">
              {filtered.length} {filtered.length === 1 ? 'appointment' : 'appointments'}
              {filter !== 'all' && ` (${STATUS_STYLES[filter]?.label || filter})`}
              {search && ` matching "${search}"`}
              {(dateFrom || dateTo) && ` from ${dateFrom || '...'} to ${dateTo || '...'}`}
            </output>
          )}

          {/* Appointment cards */}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a) => (
                <AppointmentCard key={a.id} appointment={a} showPatient={!isPatient} isDoctor={isDoctor} onClick={() => setSelectedId(a.id)} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-lg font-medium text-slate-700">No appointments found</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {hasFilters
                      ? 'Try adjusting your search or filters.'
                      : isPatient
                        ? 'Your appointments will appear here when scheduled.'
                        : 'No appointments in the system yet.'}
                  </p>
                  {hasFilters && (
                    <button
                      onClick={() => { setSearch(''); setFilter('all'); setDateFrom(''); setDateTo(''); }}
                      className="mt-3 px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Appointment detail modal */}
      {selectedId && (
        <AppointmentDetailModal
          appointmentId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChange={fetchAppointments}
        />
      )}

      {/* Book appointment modal */}
      {showBooking && (
        <BookAppointmentModal
          onClose={() => setShowBooking(false)}
          onBooked={fetchAppointments}
        />
      )}
    </div>
  );
}
