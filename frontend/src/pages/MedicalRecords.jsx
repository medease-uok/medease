import { useState, useCallback, useEffect, useMemo, useDeferredValue } from 'react';
import {
  FileText, AlertCircle, Search, Clock, User, Stethoscope, CalendarDays, X,
} from 'lucide-react';
import { useAuth } from '../data/AuthContext';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/card';

const SKELETON_COUNT = 6;

const formatDate = (iso) => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const matchesSearch = (r, query) => {
  const q = query.toLowerCase();
  return ['patientName', 'doctorName', 'diagnosis', 'treatment']
    .some((field) => r[field]?.toLowerCase().includes(q));
};

function RecordCard({ record, showPatient }) {
  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{record.diagnosis || 'Medical Record'}</h3>
            {record.doctorName && (
              <p className="text-sm text-slate-500">{record.doctorName}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {showPatient && record.patientName && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{record.patientName}</span>
          </div>
        )}
        {record.treatment && (
          <div className="text-slate-600">
            <span className="font-medium text-slate-700">Treatment:</span> {record.treatment.length > 120 ? record.treatment.substring(0, 120) + '...' : record.treatment}
          </div>
        )}
        {record.createdAt && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <time dateTime={record.createdAt}>{formatDate(record.createdAt)}</time>
          </div>
        )}
      </div>
    </div>
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
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MedicalRecords({ embedded = false }) {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const isPatient = currentUser?.role === 'patient';
  const deferredSearch = useDeferredValue(search);

  const fetchRecords = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/medical-records')
      .then((res) => setRecords(res.data || []))
      .catch(() => setError('Failed to load medical records.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/medical-records')
      .then((res) => { if (!cancelled) setRecords(res.data || []); })
      .catch(() => { if (!cancelled) setError('Failed to load medical records.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => records.filter((r) => {
      if (deferredSearch && !matchesSearch(r, deferredSearch)) return false;
      if (dateFrom || dateTo) {
        const rDate = r.createdAt ? new Date(r.createdAt).getTime() : NaN;
        if (isNaN(rDate)) return false;
        if (dateFrom && rDate < new Date(dateFrom).getTime()) return false;
        if (dateTo && rDate > new Date(dateTo + 'T23:59:59').getTime()) return false;
      }
      return true;
    }),
    [records, deferredSearch, dateFrom, dateTo],
  );

  const hasFilters = search || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
            {isPatient ? 'My Medical Records' : 'Medical Records'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isPatient
              ? 'View your diagnoses and treatment records.'
              : 'Manage and review patient medical records.'}
          </p>
        </div>
      )}

      {/* Filters and search */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <label htmlFor="rec-search" className="sr-only">Search medical records</label>
              <input
                id="rec-search"
                type="search"
                placeholder="Search diagnoses, doctors, treatments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
            </div>
            <div className="flex items-center gap-2" role="group" aria-label="Filter by date range">
              <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
              <div className="flex items-center gap-1.5">
                <label htmlFor="rec-date-from" className="sr-only">From date</label>
                <input
                  id="rec-date-from"
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
                <span className="text-sm text-slate-400">to</span>
                <label htmlFor="rec-date-to" className="sr-only">To date</label>
                <input
                  id="rec-date-to"
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
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchRecords}
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
          {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          {search && ` matching "${search}"`}
          {(dateFrom || dateTo) && ` from ${dateFrom || '...'} to ${dateTo || '...'}`}
        </output>
      )}

      {/* Record cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RecordCard key={r.id} record={r} showPatient={!isPatient} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">No medical records found</p>
              <p className="text-sm text-slate-500 mt-1">
                {hasFilters
                  ? 'Try adjusting your search or filters.'
                  : isPatient
                    ? 'Your medical records will appear here as they are added.'
                    : 'No medical records in the system yet.'}
              </p>
              {hasFilters && (
                <button
                  onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}
                  className="mt-3 px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
