import { useState, useEffect } from 'react';
import {
  Calendar, FileText, Pill, FlaskConical, AlertCircle,
  ChevronLeft, ChevronRight, Clock, Stethoscope, Filter,
} from 'lucide-react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const EVENT_CONFIG = {
  visit: {
    icon: Calendar,
    label: 'Visit',
    color: 'bg-blue-100 text-blue-600',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  diagnosis: {
    icon: Stethoscope,
    label: 'Diagnosis',
    color: 'bg-purple-100 text-purple-600',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  prescription: {
    icon: Pill,
    label: 'Prescription',
    color: 'bg-orange-100 text-orange-600',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  lab: {
    icon: FlaskConical,
    label: 'Lab Report',
    color: 'bg-pink-100 text-pink-600',
    border: 'border-pink-200',
    dot: 'bg-pink-500',
  },
};

const FILTER_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'visit', label: 'Visits' },
  { value: 'diagnosis', label: 'Diagnoses' },
  { value: 'prescription', label: 'Prescriptions' },
  { value: 'lab', label: 'Lab Reports' },
];

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const formatTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
};

function StatusBadge({ status }) {
  const variants = {
    scheduled: 'default',
    confirmed: 'default',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'destructive',
    active: 'success',
    dispensed: 'secondary',
    expired: 'destructive',
  };
  if (!status) return null;
  return (
    <Badge variant={variants[status] || 'default'}>
      {status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </Badge>
  );
}

function TimelineEvent({ event }) {
  const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.visit;
  const Icon = config.icon;
  const time = formatTime(event.eventDate);

  return (
    <li className="relative flex gap-4 pb-8 last:pb-0 group">
      {/* Timeline line */}
      <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200 group-last:hidden" aria-hidden="true" />

      {/* Timeline dot */}
      <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${config.color} flex items-center justify-center ring-4 ring-white`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>

      {/* Event card */}
      <div className={`flex-1 rounded-xl border ${config.border} bg-white p-4 hover:shadow-md transition-shadow duration-200`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${config.color}`}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
            <Clock className="w-3 h-3" aria-hidden="true" />
            <time dateTime={event.eventDate}>
              {formatDate(event.eventDate)}
              {time && <span className="ml-1">{time}</span>}
            </time>
          </div>
        </div>

        <div className="space-y-1.5">
          {event.type === 'visit' && (
            <>
              <p className="text-sm font-medium text-slate-900">{event.doctorName || 'Unknown Doctor'}</p>
              {event.notes && <p className="text-sm text-slate-600">{event.notes}</p>}
              {event.status && <StatusBadge status={event.status} />}
            </>
          )}

          {event.type === 'diagnosis' && (
            <>
              <p className="text-sm font-medium text-slate-900">{event.diagnosis}</p>
              {event.treatment && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Treatment:</span> {event.treatment}
                </p>
              )}
              {event.notes && <p className="text-sm text-slate-500 italic">{event.notes}</p>}
              {event.doctorName && (
                <p className="text-xs text-slate-400 mt-1">{event.doctorName}</p>
              )}
            </>
          )}

          {event.type === 'prescription' && (
            <>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900">{event.medication}</p>
                {event.status && <StatusBadge status={event.status} />}
              </div>
              <p className="text-sm text-slate-600">
                {event.dosage} &middot; {event.frequency}
                {event.duration && <> &middot; {event.duration}</>}
              </p>
              {event.doctorName && (
                <p className="text-xs text-slate-400 mt-1">Prescribed by {event.doctorName}</p>
              )}
            </>
          )}

          {event.type === 'lab' && (
            <>
              <p className="text-sm font-medium text-slate-900">{event.testName}</p>
              {event.result && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Result:</span> {event.result}
                </p>
              )}
              {event.notes && <p className="text-sm text-slate-500 italic">{event.notes}</p>}
              {event.technicianName && (
                <p className="text-xs text-slate-400 mt-1">By {event.technicianName}</p>
              )}
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-6" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="w-8 h-8 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">1</button>
          {start > 2 && <span className="text-slate-400 px-1" aria-hidden="true">...</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
            p === page
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-slate-400 px-1" aria-hidden="true">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="w-8 h-8 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">{totalPages}</button>
        </>
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

function TimelineSkeleton() {
  return (
    <div className="pl-1 space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 pb-8 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
          <div className="flex-1 h-24 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function MedicalHistory() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page, limit: 15 });
    if (activeFilter) params.set('type', activeFilter);

    api.get(`/patients/me/history?${params}`)
      .then((res) => {
        if (!mounted) return;
        setEvents(res.data || []);
        setPagination(res.pagination || { total: 0, totalPages: 0 });
      })
      .catch(() => {
        if (!mounted) return;
        setError('Failed to load medical history. Please try again.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [activeFilter, page]);

  const handleFilterChange = (value) => {
    setActiveFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
          Medical History
        </h1>
        <p className="text-slate-500 mt-1">
          A unified timeline of your visits, diagnoses, prescriptions, and lab reports.
        </p>
      </div>

      {/* Filter pills */}
      <Card>
        <CardContent className="py-4 pt-4">
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by event type">
            <Filter className="w-4 h-4 text-slate-400" aria-hidden="true" />
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value || 'all'}
                onClick={() => handleFilterChange(opt.value)}
                aria-pressed={activeFilter === opt.value}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === opt.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      {!loading && !error && (
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span>{pagination.total} {pagination.total === 1 ? 'event' : 'events'} found</span>
          {activeFilter && (
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${EVENT_CONFIG[activeFilter]?.dot}`} />
              Showing {EVENT_CONFIG[activeFilter]?.label || activeFilter} only
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && <TimelineSkeleton />}

      {/* Timeline */}
      {!loading && !error && events.length > 0 && (
        <>
          <ol className="pl-1 list-none" aria-label="Medical history timeline">
            {events.map((event) => (
              <TimelineEvent key={event.id} event={event} />
            ))}
          </ol>
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">No medical history found</p>
              <p className="text-sm text-slate-500 mt-1">
                {activeFilter
                  ? `No ${EVENT_CONFIG[activeFilter]?.label.toLowerCase() || activeFilter} records found.`
                  : 'Your medical timeline will appear here as records are added.'}
              </p>
              {activeFilter && (
                <button
                  onClick={() => handleFilterChange(null)}
                  className="mt-3 px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Clear filter
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
