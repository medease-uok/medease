import { useState, useCallback, useEffect, useMemo, useDeferredValue } from 'react';
import {
  FileText, AlertCircle, Search, Clock, User, CalendarDays, X, Upload,
  Download, Trash2, Eye, File, FileImage, FileType,
} from 'lucide-react';
import { useAuth } from '../data/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/card';

const SKELETON_COUNT = 6;
const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 1000;

const CATEGORIES = [
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'referral', label: 'Referral' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'consent_form', label: 'Consent Form' },
  { value: 'clinical_note', label: 'Clinical Note' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_COLORS = {
  lab_report: 'bg-blue-100 text-blue-700',
  imaging: 'bg-purple-100 text-purple-700',
  discharge_summary: 'bg-green-100 text-green-700',
  referral: 'bg-orange-100 text-orange-700',
  insurance: 'bg-yellow-100 text-yellow-700',
  consent_form: 'bg-pink-100 text-pink-700',
  clinical_note: 'bg-teal-100 text-teal-700',
  other: 'bg-slate-100 text-slate-700',
};

const formatDate = (iso) => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatFileSize = (bytes) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getCategoryLabel = (val) => CATEGORIES.find((c) => c.value === val)?.label || val;

const getFileIcon = (mimeType) => {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'application/pdf') return FileType;
  return File;
};

const matchesSearch = (doc, query) => {
  const q = query.toLowerCase();
  return ['title', 'patientName', 'uploaderName', 'fileName', 'description']
    .some((field) => doc[field]?.toLowerCase().includes(q));
};

function DocumentCard({ doc, showPatient, onView, onDelete, canDelete }) {
  const Icon = getFileIcon(doc.mimeType);
  const categoryColor = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other;

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 truncate">{doc.title}</h3>
            <p className="text-sm text-slate-500 truncate">{doc.fileName}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`}>
          {getCategoryLabel(doc.category)}
        </span>
        <span className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</span>
      </div>

      <div className="space-y-1.5 text-sm">
        {showPatient && doc.patientName && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{doc.patientName}</span>
          </div>
        )}
        {doc.uploaderName && (
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Upload className="w-3 h-3 text-slate-400" aria-hidden="true" />
            <span>Uploaded by {doc.uploaderName}</span>
          </div>
        )}
        {doc.description && (
          <p className="text-slate-500 text-xs line-clamp-2">{doc.description}</p>
        )}
        {doc.createdAt && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <time dateTime={doc.createdAt}>{formatDate(doc.createdAt)}</time>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => onView(doc)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>
        {canDelete && (
          <button
            onClick={() => onDelete(doc)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
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

function UploadModal({ open, onClose, onSubmit, patients, isPatient }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [patientId, setPatientId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setCategory('other');
      setPatientId('');
      setFile(null);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!isPatient && !patientId) { setError('Please select a patient.'); return; }

    setUploading(true);
    setError(null);
    try {
      await onSubmit({ title: title.trim(), description, category, patientId, file });
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900">Upload Document</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isPatient && (
            <div>
              <label htmlFor="doc-patient" className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
              <select
                id="doc-patient"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="doc-title" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="e.g. Blood Test Results - March 2026"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="doc-category" className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              id="doc-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="doc-desc" className="block text-sm font-medium text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="doc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={2}
              placeholder="Brief description of the document..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{description.length}/{MAX_DESCRIPTION_LENGTH}</p>
          </div>

          <div>
            <label htmlFor="doc-file" className="block text-sm font-medium text-slate-700 mb-1">File</label>
            <input
              id="doc-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer"
              required
            />
            <p className="text-xs text-slate-400 mt-1">PDF, images, DOC, DOCX, TXT. Max 20 MB.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewerModal({ doc, onClose }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!doc) return;
    setLoading(true);
    setError(null);
    api.get(`/medical-documents/${doc.id}`)
      .then((res) => setUrl(res.data.url))
      .catch(() => setError('Failed to load document.'))
      .finally(() => setLoading(false));
  }, [doc]);

  if (!doc) return null;

  const isImage = doc.mimeType?.startsWith('image/');
  const isPdf = doc.mimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{doc.title}</h2>
            <p className="text-sm text-slate-500">{doc.fileName} &middot; {formatFileSize(doc.fileSize)}</p>
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5 min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && url && (
            <>
              {isImage && (
                <div className="flex justify-center">
                  <img
                    src={url}
                    alt={doc.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}
              {isPdf && (
                <iframe
                  src={url}
                  title={doc.title}
                  className="w-full h-[70vh] rounded-lg border border-slate-200"
                />
              )}
              {!isImage && !isPdf && (
                <div className="flex flex-col items-center justify-center py-16">
                  <File className="w-16 h-16 text-slate-300 mb-4" />
                  <p className="text-slate-600 font-medium mb-2">Preview not available for this file type</p>
                  <p className="text-sm text-slate-400 mb-4">{doc.mimeType}</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download File
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {doc.description && (
          <div className="px-5 pb-4 border-t border-slate-100 pt-3">
            <p className="text-sm text-slate-600">{doc.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteConfirmModal({ doc, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  if (!doc) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(doc.id);
      onClose();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Delete Document</h2>
        <p className="text-sm text-slate-600 mb-4">
          Are you sure you want to delete <strong>{doc.title}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MedicalDocuments() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [documents, setDocuments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const { currentUser } = useAuth();
  const { can, canAny } = usePermissions();
  const isPatient = currentUser?.role === 'patient';
  const deferredSearch = useDeferredValue(search);

  const fetchDocuments = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/medical-documents')
      .then((res) => setDocuments(res.data || []))
      .catch(() => setError('Failed to load documents.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/medical-documents')
      .then((res) => { if (!cancelled) setDocuments(res.data || []); })
      .catch(() => { if (!cancelled) setError('Failed to load documents.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Fetch patients list for upload modal (staff only)
  useEffect(() => {
    if (isPatient) return;
    api.get('/patients')
      .then((res) => {
        const list = (res.data || []).map((p) => ({
          id: p.id,
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || 'Unknown',
        }));
        setPatients(list);
      })
      .catch(() => {});
  }, [isPatient]);

  const filtered = useMemo(
    () => documents.filter((d) => {
      if (deferredSearch && !matchesSearch(d, deferredSearch)) return false;
      if (categoryFilter && d.category !== categoryFilter) return false;
      if (dateFrom || dateTo) {
        const dDate = d.createdAt ? new Date(d.createdAt).getTime() : NaN;
        if (isNaN(dDate)) return false;
        if (dateFrom && dDate < new Date(dateFrom).getTime()) return false;
        if (dateTo && dDate > new Date(dateTo + 'T23:59:59').getTime()) return false;
      }
      return true;
    }),
    [documents, deferredSearch, categoryFilter, dateFrom, dateTo],
  );

  const handleUpload = async ({ title, description, category, patientId, file }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    if (description) formData.append('description', description);

    if (isPatient) {
      formData.append('patientId', currentUser.patientId);
    } else {
      formData.append('patientId', patientId);
    }

    await api.upload('/medical-documents', formData);
    fetchDocuments();
  };

  const handleDelete = async (id) => {
    await api.delete(`/medical-documents/${id}`);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const canUpload = can('upload_document');
  const canDeleteDocs = can('delete_document');
  const hasFilters = search || dateFrom || dateTo || categoryFilter;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
            {isPatient ? 'My Documents' : 'Medical Documents'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isPatient
              ? 'View and manage your medical documents and reports.'
              : 'View, upload, and manage patient medical documents.'}
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
          >
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <label htmlFor="doc-search" className="sr-only">Search documents</label>
              <input
                id="doc-search"
                type="search"
                placeholder="Search by title, patient, file name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label htmlFor="doc-cat-filter" className="sr-only">Filter by category</label>
              <select
                id="doc-cat-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2" role="group" aria-label="Filter by date range">
              <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
              <div className="flex items-center gap-1.5">
                <label htmlFor="doc-date-from" className="sr-only">From date</label>
                <input
                  id="doc-date-from"
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
                <span className="text-sm text-slate-400">to</span>
                <label htmlFor="doc-date-to" className="sr-only">To date</label>
                <input
                  id="doc-date-to"
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
            onClick={fetchDocuments}
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
          {filtered.length} {filtered.length === 1 ? 'document' : 'documents'}
          {search && ` matching "${search}"`}
          {categoryFilter && ` in ${getCategoryLabel(categoryFilter)}`}
        </output>
      )}

      {/* Document cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <DocumentCard
              key={d.id}
              doc={d}
              showPatient={!isPatient}
              onView={setViewDoc}
              onDelete={setDeleteDoc}
              canDelete={canDeleteDocs || d.uploadedBy === currentUser?.id}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">No documents found</p>
              <p className="text-sm text-slate-500 mt-1">
                {hasFilters
                  ? 'Try adjusting your search or filters.'
                  : isPatient
                    ? 'Your medical documents will appear here as they are uploaded.'
                    : 'No medical documents in the system yet.'}
              </p>
              {hasFilters && (
                <button
                  onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setCategoryFilter(''); }}
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
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
        patients={patients}
        isPatient={isPatient}
      />
      <ViewerModal doc={viewDoc} onClose={() => setViewDoc(null)} />
      <DeleteConfirmModal doc={deleteDoc} onClose={() => setDeleteDoc(null)} onConfirm={handleDelete} />
    </div>
  );
}
