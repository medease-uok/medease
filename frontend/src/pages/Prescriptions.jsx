import { useState, useCallback, useEffect, useMemo, useDeferredValue } from 'react';
import {
  Pill, AlertCircle, Search, Clock, User, Stethoscope,
} from 'lucide-react';
import { prescriptionStatuses } from '../constants';
import { useAuth } from '../data/AuthContext';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const STATUS_STYLES = {
  active: { variant: 'success', label: 'Active' },
  dispensed: { variant: 'default', label: 'Dispensed' },
  expired: { variant: 'secondary', label: 'Expired' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
};

const SKELETON_COUNT = 6;

const formatDate = (iso) => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const matchesSearch = (rx, query) => {
  const q = query.toLowerCase();
  return ['medication', 'doctorName', 'patientName', 'dosage']
    .some((field) => rx[field]?.toLowerCase().includes(q));
};

function PrescriptionCard({ rx, showPatient }) {
  const style = STATUS_STYLES[rx.status] ?? { variant: 'outline', label: rx.status ?? 'Unknown' };

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Pill className="w-5 h-5 text-orange-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{rx.medication}</h3>
            <p className="text-sm text-slate-500">{rx.dosage} &middot; {rx.frequency}</p>
          </div>
        </div>
        <Badge variant={style.variant}>{style.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {rx.duration && (
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{rx.duration}</span>
          </div>
        )}
        {rx.doctorName && (
          <div className="flex items-center gap-2 text-slate-600">
            <Stethoscope className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{rx.doctorName}</span>
          </div>
        )}
        {showPatient && rx.patientName && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{rx.patientName}</span>
          </div>
        )}
        {rx.createdAt && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <time dateTime={rx.createdAt}>Prescribed {formatDate(rx.createdAt)}</time>
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
          <div className="grid grid-cols-2 gap-2">
            <div className="h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Prescriptions() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const isPatient = currentUser?.role === 'patient';
  const deferredSearch = useDeferredValue(search);

  const fetchPrescriptions = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/prescriptions')
      .then((res) => setPrescriptions(res.data || []))
      .catch(() => setError('Failed to load prescriptions.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/prescriptions')
      .then((res) => { if (!cancelled) setPrescriptions(res.data || []); })
      .catch(() => { if (!cancelled) setError('Failed to load prescriptions.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => prescriptions.filter((rx) =>
      (filter === 'all' || rx.status === filter) &&
      (!deferredSearch || matchesSearch(rx, deferredSearch))
    ),
    [prescriptions, filter, deferredSearch],
  );

  const statusCounts = useMemo(
    () => prescriptions.reduce((acc, rx) => {
      acc[rx.status] = (acc[rx.status] || 0) + 1;
      return acc;
    }, {}),
    [prescriptions],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
          {isPatient ? 'My Prescriptions' : 'Prescriptions'}
        </h1>
        <p className="text-slate-500 mt-1">
          {isPatient
            ? 'View your current and past medication prescriptions.'
            : 'Manage and review patient prescriptions.'}
        </p>
      </div>

      {/* Filters and search */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <label htmlFor="rx-search" className="sr-only">Search prescriptions</label>
              <input
                id="rx-search"
                type="search"
                placeholder="Search medications, doctors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
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
                All ({prescriptions.length})
              </button>
              {prescriptionStatuses.map((s) => {
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
            onClick={fetchPrescriptions}
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
          {filtered.length} {filtered.length === 1 ? 'prescription' : 'prescriptions'}
          {filter !== 'all' && ` (${STATUS_STYLES[filter]?.label || filter})`}
          {search && ` matching "${search}"`}
        </output>
      )}

      {/* Prescription cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((rx) => (
            <PrescriptionCard key={rx.id} rx={rx} showPatient={!isPatient} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">No prescriptions found</p>
              <p className="text-sm text-slate-500 mt-1">
                {search || filter !== 'all'
                  ? 'Try adjusting your search or filter.'
                  : isPatient
                    ? 'Your prescriptions will appear here when prescribed by a doctor.'
                    : 'No prescriptions in the system yet.'}
              </p>
              {(search || filter !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setFilter('all'); }}
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
