import { useState, useCallback, useEffect, useMemo, useDeferredValue } from 'react';
import {
  Pill, AlertCircle, Search, Clock, User, Stethoscope, CalendarDays, X,
  RefreshCw, CheckCircle, XCircle, MessageSquare, Loader2,
} from 'lucide-react';
import { prescriptionStatuses } from '../constants';
import { useAuth } from '../data/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const STATUS_STYLES = {
  active: { variant: 'success', label: 'Active' },
  dispensed: { variant: 'default', label: 'Dispensed' },
  expired: { variant: 'secondary', label: 'Expired' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
};

const REFILL_STATUS_STYLES = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  denied: { variant: 'destructive', label: 'Denied' },
};

const SKELETON_COUNT = 6;

const formatDate = (iso) => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
};

const matchesSearch = (rx, query) => {
  const q = query.toLowerCase();
  return ['medication', 'doctorName', 'patientName', 'dosage']
    .some((field) => rx[field]?.toLowerCase().includes(q));
};

const matchesRefillSearch = (rr, query) => {
  const q = query.toLowerCase();
  return ['medication', 'doctorName', 'patientName', 'reason']
    .some((field) => rr[field]?.toLowerCase().includes(q));
};

function RefillModal({ rx, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/refill-requests', {
        prescriptionId: rx.id,
        reason: reason.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit refill request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Request Refill</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
          <div className="flex items-center gap-2 mb-1">
            <Pill className="w-4 h-4 text-orange-600" />
            <span className="font-medium text-slate-900">{rx.medication}</span>
          </div>
          <p className="text-sm text-slate-600">{rx.dosage} &middot; {rx.frequency}</p>
          {rx.doctorName && <p className="text-sm text-slate-500 mt-1">{rx.doctorName}</p>}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="refill-reason" className="block text-sm font-medium text-slate-700 mb-1">
            Reason (optional)
          </label>
          <textarea
            id="refill-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Running low on medication..."
            rows={3}
            maxLength={500}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{reason.length}/500</p>

          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Submitting...' : 'Request Refill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RespondModal({ request: rr, onClose, onSuccess }) {
  const [status, setStatus] = useState('');
  const [doctorNote, setDoctorNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (chosenStatus) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/refill-requests/${rr.id}/respond`, {
        status: chosenStatus,
        doctorNote: doctorNote.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to respond to refill request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Respond to Refill Request</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
          <div className="flex items-center gap-2 mb-1">
            <Pill className="w-4 h-4 text-orange-600" />
            <span className="font-medium text-slate-900">{rr.medication}</span>
          </div>
          <p className="text-sm text-slate-600">{rr.dosage} &middot; {rr.frequency}</p>
          {rr.patientName && <p className="text-sm text-slate-500 mt-1">Patient: {rr.patientName}</p>}
          {rr.reason && (
            <p className="text-sm text-slate-600 mt-2 italic">&quot;{rr.reason}&quot;</p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="doctor-note" className="block text-sm font-medium text-slate-700 mb-1">
            Note (optional)
          </label>
          <textarea
            id="doctor-note"
            value={doctorNote}
            onChange={(e) => setDoctorNote(e.target.value)}
            placeholder="Add a note for the patient..."
            rows={3}
            maxLength={500}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{doctorNote.length}/500</p>

          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('denied')}
              className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <XCircle className="w-4 h-4" />
              Deny
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('approved')}
              className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrescriptionCard({ rx, showPatient, canRequestRefill, onRequestRefill }) {
  const style = STATUS_STYLES[rx.status] ?? { variant: 'outline', label: rx.status ?? 'Unknown' };
  const showRefillButton = canRequestRefill && rx.refillEligible && !rx.pendingRefill;
  const hasPendingRefill = canRequestRefill && rx.pendingRefill;

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

      {showRefillButton && (
        <button
          onClick={() => onRequestRefill(rx)}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Request Refill
        </button>
      )}
      {hasPendingRefill && (
        <div className="mt-3 flex items-center justify-center gap-2 px-3 py-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
          <Loader2 className="w-4 h-4" />
          Refill request pending
        </div>
      )}
    </div>
  );
}

function RefillRequestCard({ rr, showPatient, canRespond, onRespond }) {
  const style = REFILL_STATUS_STYLES[rr.status] ?? { variant: 'outline', label: rr.status ?? 'Unknown' };

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-amber-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{rr.medication}</h3>
            <p className="text-sm text-slate-500">{rr.dosage} &middot; {rr.frequency}</p>
          </div>
        </div>
        <Badge variant={style.variant}>{style.label}</Badge>
      </div>

      <div className="space-y-2 text-sm">
        {showPatient && rr.patientName && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{rr.patientName}</span>
          </div>
        )}
        {rr.doctorName && (
          <div className="flex items-center gap-2 text-slate-600">
            <Stethoscope className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{rr.doctorName}</span>
          </div>
        )}
        {rr.reason && (
          <div className="flex items-start gap-2 text-slate-600">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5" aria-hidden="true" />
            <span className="italic">&quot;{rr.reason}&quot;</span>
          </div>
        )}
        {rr.doctorNote && (
          <div className="flex items-start gap-2 text-slate-600">
            <Stethoscope className="w-3.5 h-3.5 text-slate-400 mt-0.5" aria-hidden="true" />
            <span>Note: {rr.doctorNote}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <time dateTime={rr.createdAt}>Requested {formatDate(rr.createdAt)}</time>
          {rr.respondedAt && <span>&middot; Responded {formatDate(rr.respondedAt)}</span>}
        </div>
      </div>

      {canRespond && rr.status === 'pending' && (
        <button
          onClick={() => onRespond(rr)}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
        >
          Respond
        </button>
      )}
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

export default function Prescriptions({ embedded = false }) {
  const [tab, setTab] = useState('prescriptions');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [refillRequests, setRefillRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refillLoading, setRefillLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refillModal, setRefillModal] = useState(null);
  const [respondModal, setRespondModal] = useState(null);
  const { currentUser } = useAuth();
  const { can, canAny } = usePermissions();
  const isPatient = currentUser?.role === 'patient';
  const canRequestRefill = can('request_refill');
  const canViewRefills = canAny('view_refill_requests', 'view_own_refill_requests');
  const canRespondRefill = can('respond_refill_request');
  const deferredSearch = useDeferredValue(search);

  const fetchPrescriptions = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/prescriptions')
      .then((res) => setPrescriptions(res.data || []))
      .catch(() => setError('Failed to load prescriptions.'))
      .finally(() => setLoading(false));
  }, []);

  const fetchRefillRequests = useCallback(() => {
    if (!canViewRefills) return;
    setRefillLoading(true);
    api.get('/refill-requests')
      .then((res) => setRefillRequests(res.data || []))
      .catch(() => {})
      .finally(() => setRefillLoading(false));
  }, [canViewRefills]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/prescriptions')
      .then((res) => { if (!cancelled) setPrescriptions(res.data || []); })
      .catch(() => { if (!cancelled) setError('Failed to load prescriptions.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (canViewRefills) fetchRefillRequests();
  }, [canViewRefills, fetchRefillRequests]);

  const filtered = useMemo(
    () => prescriptions.filter((rx) => {
      if (filter !== 'all' && rx.status !== filter) return false;
      if (deferredSearch && !matchesSearch(rx, deferredSearch)) return false;
      if (dateFrom || dateTo) {
        const rxDate = rx.createdAt ? new Date(rx.createdAt).getTime() : NaN;
        if (isNaN(rxDate)) return false;
        if (dateFrom && rxDate < new Date(dateFrom).getTime()) return false;
        if (dateTo && rxDate > new Date(dateTo + 'T23:59:59').getTime()) return false;
      }
      return true;
    }),
    [prescriptions, filter, deferredSearch, dateFrom, dateTo],
  );

  const filteredRefills = useMemo(
    () => refillRequests.filter((rr) => {
      if (filter !== 'all' && rr.status !== filter) return false;
      if (deferredSearch && !matchesRefillSearch(rr, deferredSearch)) return false;
      return true;
    }),
    [refillRequests, filter, deferredSearch],
  );

  const statusCounts = useMemo(
    () => prescriptions.reduce((acc, rx) => {
      acc[rx.status] = (acc[rx.status] || 0) + 1;
      return acc;
    }, {}),
    [prescriptions],
  );

  const refillStatusCounts = useMemo(
    () => refillRequests.reduce((acc, rr) => {
      acc[rr.status] = (acc[rr.status] || 0) + 1;
      return acc;
    }, {}),
    [refillRequests],
  );

  const handleRefillSuccess = () => {
    setRefillModal(null);
    fetchPrescriptions();
    fetchRefillRequests();
  };

  const handleRespondSuccess = () => {
    setRespondModal(null);
    fetchPrescriptions();
    fetchRefillRequests();
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setFilter('all');
    setSearch('');
    setDateFrom('');
    setDateTo('');
  };

  const refillStatuses = ['pending', 'approved', 'denied'];

  return (
    <div className="space-y-6">
      {!embedded && (
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
      )}

      {/* Tabs */}
      {canViewRefills && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => handleTabChange('prescriptions')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'prescriptions'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Prescriptions
          </button>
          <button
            onClick={() => handleTabChange('refills')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              tab === 'refills'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Refill Requests
            {(refillStatusCounts.pending || 0) > 0 && (
              <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {refillStatusCounts.pending}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Filters and search */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <label htmlFor="rx-search" className="sr-only">Search</label>
                <input
                  id="rx-search"
                  type="search"
                  placeholder={tab === 'prescriptions'
                    ? (isPatient ? 'Search medications, doctors...' : 'Search patients, medications...')
                    : 'Search refill requests...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
              </div>
              {tab === 'prescriptions' && (
                <div className="flex items-center gap-2" role="group" aria-label="Filter by date range">
                  <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="rx-date-from" className="sr-only">From date</label>
                    <input
                      id="rx-date-from"
                      type="date"
                      value={dateFrom}
                      max={dateTo || undefined}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    />
                    <span className="text-sm text-slate-400">to</span>
                    <label htmlFor="rx-date-to" className="sr-only">To date</label>
                    <input
                      id="rx-date-to"
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
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by status">
              {tab === 'prescriptions' ? (
                <>
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
                </>
              ) : (
                <>
                  <button
                    onClick={() => setFilter('all')}
                    aria-pressed={filter === 'all'}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      filter === 'all'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({refillRequests.length})
                  </button>
                  {refillStatuses.map((s) => {
                    const style = REFILL_STATUS_STYLES[s] || {};
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
                        {style.label || s} ({refillStatusCounts[s] || 0})
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && tab === 'prescriptions' && (
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
      {((tab === 'prescriptions' && loading) || (tab === 'refills' && refillLoading)) && !error && <ListSkeleton />}

      {/* Results count */}
      {tab === 'prescriptions' && !loading && !error && (
        <output aria-live="polite" className="block text-sm text-slate-500">
          {filtered.length} {filtered.length === 1 ? 'prescription' : 'prescriptions'}
          {filter !== 'all' && ` (${STATUS_STYLES[filter]?.label || filter})`}
          {search && ` matching "${search}"`}
          {(dateFrom || dateTo) && ` from ${dateFrom || '...'} to ${dateTo || '...'}`}
        </output>
      )}

      {tab === 'refills' && !refillLoading && (
        <output aria-live="polite" className="block text-sm text-slate-500">
          {filteredRefills.length} refill {filteredRefills.length === 1 ? 'request' : 'requests'}
          {filter !== 'all' && ` (${REFILL_STATUS_STYLES[filter]?.label || filter})`}
          {search && ` matching "${search}"`}
        </output>
      )}

      {/* Prescription cards */}
      {tab === 'prescriptions' && !loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((rx) => (
            <PrescriptionCard
              key={rx.id}
              rx={rx}
              showPatient={!isPatient}
              canRequestRefill={canRequestRefill}
              onRequestRefill={setRefillModal}
            />
          ))}
        </div>
      )}

      {/* Refill request cards */}
      {tab === 'refills' && !refillLoading && filteredRefills.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRefills.map((rr) => (
            <RefillRequestCard
              key={rr.id}
              rr={rr}
              showPatient={!isPatient}
              canRespond={canRespondRefill}
              onRespond={setRespondModal}
            />
          ))}
        </div>
      )}

      {/* Empty states */}
      {tab === 'prescriptions' && !loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">No prescriptions found</p>
              <p className="text-sm text-slate-500 mt-1">
                {search || filter !== 'all' || dateFrom || dateTo
                  ? 'Try adjusting your search or filters.'
                  : isPatient
                    ? 'Your prescriptions will appear here when prescribed by a doctor.'
                    : 'No prescriptions in the system yet.'}
              </p>
              {(search || filter !== 'all' || dateFrom || dateTo) && (
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

      {tab === 'refills' && !refillLoading && filteredRefills.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">No refill requests</p>
              <p className="text-sm text-slate-500 mt-1">
                {search || filter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : isPatient
                    ? 'You can request refills from the Prescriptions tab when eligible.'
                    : 'No refill requests have been submitted yet.'}
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

      {/* Modals */}
      {refillModal && (
        <RefillModal
          rx={refillModal}
          onClose={() => setRefillModal(null)}
          onSuccess={handleRefillSuccess}
        />
      )}
      {respondModal && (
        <RespondModal
          request={respondModal}
          onClose={() => setRespondModal(null)}
          onSuccess={handleRespondSuccess}
        />
      )}
    </div>
  );
}
