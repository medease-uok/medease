import { useState, useCallback, useEffect, useMemo, useDeferredValue } from 'react';
import {
  FlaskConical, AlertCircle, Search, Clock, User, CalendarDays, X, Stethoscope, Download, FileText, Plus, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../data/AuthContext';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import CreateLabReportModal from '../components/CreateLabReportModal';
import DocumentViewer from '../components/DocumentViewer';
import CompareLabReportsModal from '../components/CompareLabReportsModal';

const SKELETON_COUNT = 6;

const formatDate = (iso) => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
};

const matchesSearch = (r, query) => {
  const q = query.toLowerCase();
  return ['testName', 'patientName', 'technicianName', 'result']
    .some((field) => r[field]?.toLowerCase().includes(q));
};

function ReportCard({ report, showPatient, onViewFile }) {
  const handleViewFile = () => {
    onViewFile(report);
  };

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-5 h-5 text-pink-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{report.testName}</h3>
            {showPatient && report.patientName && (
              <p className="text-sm text-slate-500">{report.patientName}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {report.technicianName && (
          <div className="flex items-center gap-2 text-slate-600">
            <Stethoscope className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{report.technicianName}</span>
          </div>
        )}
        {report.reportDate && (
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <time dateTime={report.reportDate}>{formatDate(report.reportDate)}</time>
          </div>
        )}
        {report.result && (
          <div className="col-span-2 text-slate-600 text-sm mt-1">
            <span className="font-medium text-slate-700">Result:</span> {report.result.length > 100 ? report.result.substring(0, 100) + '...' : report.result}
          </div>
        )}
      </div>

      {/* File attachment */}
      {report.fileKey && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={handleViewFile}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>{report.fileName || 'View Report File'}</span>
          </button>
        </div>
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

export default function LabReports({ embedded = false }) {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerFileName, setViewerFileName] = useState('');
  const [viewerFileType, setViewerFileType] = useState('');
  const [loadingViewer, setLoadingViewer] = useState(false);
  const { currentUser } = useAuth();
  const isPatient = currentUser?.role === 'patient';
  const isLabTech = currentUser?.role === 'lab_technician';
  const canCreate = isLabTech || currentUser?.role === 'admin';
  const canCompare = ['patient', 'doctor', 'nurse', 'admin'].includes(currentUser?.role);
  const deferredSearch = useDeferredValue(search);

  const fetchReports = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/lab-reports')
      .then((res) => setReports(res.data || []))
      .catch(() => setError('Failed to load lab reports.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/lab-reports')
      .then((res) => { if (!cancelled) setReports(res.data || []); })
      .catch(() => { if (!cancelled) setError('Failed to load lab reports.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (showCreateModal && canCreate) {
      api.get('/patients')
        .then((res) => setPatients(res.data || []))
        .catch((err) => console.error('Failed to load patients:', err));
    }
  }, [showCreateModal, canCreate]);

  const filtered = useMemo(
    () => reports.filter((r) => {
      if (deferredSearch && !matchesSearch(r, deferredSearch)) return false;
      if (dateFrom || dateTo) {
        const rDate = r.reportDate ? new Date(r.reportDate).getTime() : NaN;
        if (isNaN(rDate)) return false;
        if (dateFrom && rDate < new Date(dateFrom).getTime()) return false;
        if (dateTo && rDate > new Date(dateTo + 'T23:59:59').getTime()) return false;
      }
      return true;
    }),
    [reports, deferredSearch, dateFrom, dateTo],
  );

  const handleViewFile = async (report) => {
    try {
      setLoadingViewer(true);

      // Use the streaming endpoint which serves the file directly with proper CORS headers
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const url = `${API_URL}/api/lab-reports/${report.id}/file`;
      const fileName = report.fileName || 'Lab Report';

      // Determine file type from fileName
      const fileExtension = fileName?.split('.').pop()?.toLowerCase();
      let fileType = '';
      if (fileExtension === 'pdf') {
        fileType = 'application/pdf';
      } else if (['jpg', 'jpeg'].includes(fileExtension)) {
        fileType = 'image/jpeg';
      } else if (fileExtension === 'png') {
        fileType = 'image/png';
      } else if (fileExtension === 'webp') {
        fileType = 'image/webp';
      }

      setViewerUrl(url);
      setViewerFileName(fileName);
      setViewerFileType(fileType);
      setViewerOpen(true);
    } catch (err) {
      alert(err?.message || 'Failed to load file');
    } finally {
      setLoadingViewer(false);
    }
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setViewerUrl('');
    setViewerFileName('');
    setViewerFileType('');
  };

  const hasFilters = search || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
              {isPatient ? 'My Lab Reports' : 'Lab Reports'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isPatient
                ? 'View your laboratory test results.'
                : 'Manage and review patient lab reports.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canCompare && (
              <button
                onClick={() => setShowCompareModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                Compare Trends
              </button>
            )}
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Lab Report
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters and search */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <label htmlFor="lab-search" className="sr-only">Search lab reports</label>
              <input
                id="lab-search"
                type="search"
                placeholder="Search tests, technicians, results..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
            </div>
            <div className="flex items-center gap-2" role="group" aria-label="Filter by date range">
              <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
              <div className="flex items-center gap-1.5">
                <label htmlFor="lab-date-from" className="sr-only">From date</label>
                <input
                  id="lab-date-from"
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
                <span className="text-sm text-slate-400">to</span>
                <label htmlFor="lab-date-to" className="sr-only">To date</label>
                <input
                  id="lab-date-to"
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

            {/* Action buttons for embedded mode */}
            {embedded && (canCompare || canCreate) && (
              <div className="flex items-center gap-2">
                {canCompare && (
                  <button
                    onClick={() => setShowCompareModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Compare
                  </button>
                )}
                {canCreate && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                )}
              </div>
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
            onClick={fetchReports}
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
          {filtered.length} {filtered.length === 1 ? 'report' : 'reports'}
          {search && ` matching "${search}"`}
          {(dateFrom || dateTo) && ` from ${dateFrom || '...'} to ${dateTo || '...'}`}
        </output>
      )}

      {/* Report cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ReportCard key={r.id} report={r} showPatient={!isPatient} onViewFile={handleViewFile} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">No lab reports found</p>
              <p className="text-sm text-slate-500 mt-1">
                {hasFilters
                  ? 'Try adjusting your search or filters.'
                  : isPatient
                    ? 'Your lab reports will appear here when results are available.'
                    : 'No lab reports in the system yet.'}
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

      {/* Create Lab Report Modal */}
      <CreateLabReportModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchReports}
        patients={patients}
      />

      {/* Compare Lab Reports Modal */}
      <CompareLabReportsModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
      />

      {/* Document Viewer */}
      <DocumentViewer
        isOpen={viewerOpen}
        onClose={handleCloseViewer}
        url={viewerUrl}
        fileName={viewerFileName}
        fileType={viewerFileType}
      />
    </div>
  );
}
