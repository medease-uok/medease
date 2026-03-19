import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Upload, X, AlertCircle, Eye, Loader2, Download, ExternalLink,
  Plus, FileText, FlaskConical, Pill, ChevronLeft, CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';
import DetailCard from '../components/DetailCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

const SEVERITY_COLORS = {
  severe: 'bg-red-100 text-red-700',
  moderate: 'bg-amber-100 text-amber-700',
  mild: 'bg-green-100 text-green-700',
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function formatLabResult(val) {
  if (!val) return '—';
  const parts = val.split(/,\s*/);
  return (
    <div className="space-y-1">
      {parts.map((part, i) => {
        const formatted = [];
        let remaining = part;
        let match;
        const regex = /x10\^(\d+)/g;
        let lastIndex = 0;
        while ((match = regex.exec(remaining)) !== null) {
          formatted.push(remaining.slice(lastIndex, match.index));
          formatted.push(
            <span key={`${i}-${match.index}`}>
              ×10<sup>{match[1]}</sup>
            </span>
          );
          lastIndex = regex.lastIndex;
        }
        formatted.push(remaining.slice(lastIndex));
        return <div key={i}>{formatted}</div>;
      })}
    </div>
  );
}

const CATEGORY_LABELS = {
  medical_record: 'Medical Record',
  prescription: 'Prescription',
  lab_report: 'Lab Report',
};

/* ─── Modal wrapper ─── */
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-md'} w-full mx-4 p-6 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Quick Upload Modal ─── */
function QuickUploadModal({ open, onClose, onSuccess, patientId, category }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) { setTitle(''); setFile(null); setError(null); }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    if (!title.trim()) { setError('Please enter a title.'); return; }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('patientId', patientId);
      await api.upload('/medical-documents', formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Upload ${CATEGORY_LABELS[category] || 'Document'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="upload-title" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input
            id="upload-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            placeholder={`e.g. ${CATEGORY_LABELS[category] || 'Document'} - March 2026`}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
        <div>
          <label htmlFor="upload-file" className="block text-sm font-medium text-slate-700 mb-1">File</label>
          <input
            id="upload-file"
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
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="w-4 h-4" /> Upload</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Document Preview Modal ─── */
function DocumentPreviewModal({ doc, onClose }) {
  if (!doc) return null;

  const isPdf = doc.mimeType === 'application/pdf';
  const isImage = doc.mimeType?.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{doc.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{doc.fileName}</p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <a href={doc.url} download={doc.fileName} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Download">
              <Download className="w-5 h-5" />
            </a>
            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Open in new tab">
              <ExternalLink className="w-5 h-5" />
            </a>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-1 min-h-0 bg-slate-50 rounded-b-2xl">
          {isPdf && <iframe src={doc.url} title={doc.title} className="w-full h-[70vh] rounded-b-xl border-0" />}
          {isImage && (
            <div className="flex items-center justify-center p-6">
              <img src={doc.url} alt={doc.title} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" />
            </div>
          )}
          {!isPdf && !isImage && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <p className="text-sm">Preview not available for this file type.</p>
              <a href={doc.url} download={doc.fileName} className="mt-3 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Add Medical Record Modal (Doctor only) ─── */
function AddMedicalRecordModal({ open, onClose, onSuccess, patientId }) {
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) { setDiagnosis(''); setTreatment(''); setNotes(''); setError(null); }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) { setError('Diagnosis is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.post('/medical-records', {
        patientId,
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim() || null,
        notes: notes.trim() || null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Medical Record" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis *</label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Mild hypertension (Stage 1)"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Plan / Steps to Follow</label>
          <textarea
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            rows={3}
            placeholder="e.g. Lifestyle modifications, follow-up schedule, referrals..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">Patient status and steps to follow. Do not include medicines — use prescriptions instead.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Examination findings, test results, observations..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Add Record</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Add Prescription Modal (Doctor only, simple digital) ─── */
function AddPrescriptionModal({ open, onClose, onSuccess, patientId }) {
  const [items, setItems] = useState([{ medication: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setItems([{ medication: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
      setNotes('');
      setError(null);
    }
  }, [open]);

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const addItem = () => setItems((prev) => [...prev, { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = items.every((it) => it.medication.trim() && it.dosage.trim() && it.frequency.trim());
    if (!valid) { setError('Each medicine needs medication, dosage, and frequency.'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.post('/prescriptions', {
        patientId,
        type: 'digital',
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          medication: it.medication.trim(),
          dosage: it.dosage.trim(),
          frequency: it.frequency.trim(),
          duration: it.duration.trim() || undefined,
          instructions: it.instructions.trim() || undefined,
        })),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create prescription.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Prescription" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2 relative">
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(idx)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="text-xs font-medium text-slate-500 mb-1">Medicine {idx + 1}</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={item.medication}
                onChange={(e) => updateItem(idx, 'medication', e.target.value)}
                placeholder="Medication *"
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
              <input
                type="text"
                value={item.dosage}
                onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                placeholder="Dosage * (e.g. 5mg)"
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
              <input
                type="text"
                value={item.frequency}
                onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                placeholder="Frequency * (e.g. Twice daily)"
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
              <input
                type="text"
                value={item.duration}
                onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                placeholder="Duration (e.g. 3 months)"
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <input
              type="text"
              value={item.instructions}
              onChange={(e) => updateItem(idx, 'instructions', e.target.value)}
              placeholder="Instructions (e.g. Take after meals)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add another medicine
        </button>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Optional notes..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Pill className="w-4 h-4" /> Create Prescription</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Request Lab Test Modal (Doctor only) ─── */
function RequestLabTestModal({ open, onClose, onSuccess, patientId }) {
  const [testName, setTestName] = useState('');
  const [priority, setPriority] = useState('normal');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) { setTestName(''); setPriority('normal'); setClinicalNotes(''); setError(null); }
  }, [open]);

  const commonTests = [
    'Complete Blood Count (CBC)', 'Lipid Panel', 'Blood Glucose (Fasting)',
    'HbA1c', 'Liver Function Test (LFT)', 'Renal Function Test (RFT)',
    'Thyroid Function Test', 'Urinalysis', 'ECG (12-Lead)',
    'Chest X-Ray', 'MRI', 'CT Scan', 'Ultrasound',
    'INR (Prothrombin Time)', 'Serum Ferritin', 'Vitamin D',
    'ESR / CRP', 'Nerve Conduction Study',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testName.trim()) { setError('Test name is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.post('/lab-test-requests', {
        patientId,
        testName: testName.trim(),
        priority,
        clinicalNotes: clinicalNotes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to request lab test.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Request Lab Test" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Test Name *</label>
          <input
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="e.g. Complete Blood Count (CBC)"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            list="common-tests"
            required
          />
          <datalist id="common-tests">
            {commonTests.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <div className="flex gap-3">
            {['routine', 'normal', 'urgent'].map((p) => (
              <label key={p} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  checked={priority === p}
                  onChange={() => setPriority(p)}
                  className="text-primary focus:ring-primary"
                />
                <span className={`text-sm font-medium capitalize ${p === 'urgent' ? 'text-red-600' : 'text-slate-700'}`}>
                  {p}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Notes</label>
          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Suspected iron deficiency, check ferritin and CBC..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Requesting...</> : <><FlaskConical className="w-4 h-4" /> Request Test</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Main PatientDetail Component ─── */
export default function PatientDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const isDoctor = currentUser?.role === 'doctor';
  const [patient, setPatient] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [records, setRecords] = useState([]);
  const [rxs, setRxs] = useState([]);
  const [labs, setLabs] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadCategory, setUploadCategory] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Doctor action modals
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showAddRx, setShowAddRx] = useState(false);
  const [showLabRequest, setShowLabRequest] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [completingAppt, setCompletingAppt] = useState(false);
  const [initialRecordCount, setInitialRecordCount] = useState(null);

  const fetchPatient = useCallback(() => {
    api.get(`/patients/${id}`)
      .then((res) => {
        setPatient(res.data.patient);
        setAllergies(res.data.allergies || []);
        setRecords(res.data.medicalRecords);
        setRxs(res.data.prescriptions);
        setLabs(res.data.labReports);
        // Capture initial record count on first load
        setInitialRecordCount((prev) => prev === null ? res.data.medicalRecords.length : prev);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchPatient(); }, [fetchPatient]);

  const fetchDocuments = useCallback(() => {
    api.get('/medical-documents')
      .then((res) => {
        const docs = res.data || [];
        setDocuments(docs.filter((d) => String(d.patientId) === String(id)));
      })
      .catch((err) => console.error('Failed to fetch documents:', err.message));
  }, [id]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const fetchLabRequests = useCallback(() => {
    if (!isDoctor) return;
    api.get('/lab-test-requests')
      .then((res) => {
        setLabRequests((res.data || []).filter((r) => String(r.patientId) === String(id)));
      })
      .catch(() => {});
  }, [id, isDoctor]);

  useEffect(() => { fetchLabRequests(); }, [fetchLabRequests]);

  // Fetch active (in_progress) appointment for this patient
  const fetchActiveAppointment = useCallback(() => {
    if (!isDoctor) return;
    api.get('/appointments')
      .then((res) => {
        const appts = res.data || [];
        const active = appts.find(
          (a) => String(a.patientId) === String(id) && a.status === 'in_progress'
        );
        setActiveAppointment(active || null);
      })
      .catch(() => {});
  }, [id, isDoctor]);

  useEffect(() => { fetchActiveAppointment(); }, [fetchActiveAppointment]);

  const handleCompleteAppointment = async () => {
    if (!activeAppointment) return;
    setCompletingAppt(true);
    try {
      await api.patch(`/appointments/${activeAppointment.id}/status`, { status: 'completed' });
      setActiveAppointment(null);
    } catch (err) {
      console.error('Failed to complete appointment:', err.message);
    } finally {
      setCompletingAppt(false);
    }
  };

  const docsByCategory = (cat) => documents.filter((d) => d.category === cat);

  const handleViewDoc = async (docId) => {
    try {
      const res = await api.get(`/medical-documents/${docId}`);
      if (res.data) setPreviewDoc(res.data);
    } catch { /* ignore */ }
  };

  const renderFilesCell = (category) => {
    const docs = docsByCategory(category);
    if (!docs.length) return <span className="text-slate-300">—</span>;
    return (
      <div className="flex items-center gap-1.5">
        {docs.map((doc) => (
          <button
            key={doc.id}
            onClick={(e) => { e.stopPropagation(); handleViewDoc(doc.id); }}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-primary bg-primary/5 border border-primary/20 rounded-md hover:bg-primary/10 transition-colors"
            title={doc.title}
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
        ))}
      </div>
    );
  };

  if (loading) return <div style={{ padding: 32 }}>Loading patient...</div>;
  if (!patient) return <div>Patient not found. <Link to="/patients">Back to Patients</Link></div>;

  return (
    <div>
      <Link to="/patients" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary transition-colors mb-4">
        <ChevronLeft className="w-4 h-4" />
        Back to Patients
      </Link>

      <DetailCard
        title={`${patient.firstName} ${patient.lastName}`}
        fields={[
          { label: 'Email', value: patient.email },
          { label: 'Phone', value: patient.phone },
          { label: 'Date of Birth', value: new Date(patient.dateOfBirth).toLocaleDateString() },
          { label: 'Gender', value: patient.gender },
          { label: 'Blood Type', value: patient.bloodType },
          { label: 'Organ Donor', value: patient.organDonor ? 'Yes' : 'No' },
          { label: 'Donor Card No.', value: patient.organDonorCardNo },
          { label: 'Organs to Donate', value: patient.organsToDonate?.join(', ') },
          { label: 'Address', value: patient.address },
          ...(!isDoctor ? [
            { label: 'Emergency Contact', value: patient.emergencyContact },
            { label: 'Relationship', value: patient.emergencyRelationship },
            { label: 'Emergency Phone', value: patient.emergencyPhone },
            { label: 'Insurance Provider', value: patient.insuranceProvider },
            { label: 'Policy No.', value: patient.insurancePolicyNumber },
            { label: 'Plan Type', value: patient.insurancePlanType },
            { label: 'Insurance Expiry', value: patient.insuranceExpiryDate ? new Date(patient.insuranceExpiryDate).toLocaleDateString() : null },
          ] : []),
        ]}
      />

      {isDoctor && (patient.emergencyContact || patient.emergencyPhone) && (
        <DetailCard
          title="Emergency Contact"
          titleAs="h3"
          fields={[
            { label: 'Name', value: patient.emergencyContact },
            { label: 'Relationship', value: patient.emergencyRelationship },
            { label: 'Phone', value: patient.emergencyPhone },
          ]}
        />
      )}

      {/* Doctor Quick Actions */}
      {isDoctor && (
        <div className="flex items-center gap-3 my-6">
          <button
            onClick={() => setShowAddRecord(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Add Medical Record
          </button>
          <button
            onClick={() => setShowAddRx(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
          >
            <Pill className="w-4 h-4" />
            Add Prescription
          </button>
          <button
            onClick={() => setShowLabRequest(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
          >
            <FlaskConical className="w-4 h-4" />
            Request Lab Test
          </button>
        </div>
      )}

      {allergies.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12, marginTop: 24 }}>Allergies ({allergies.length})</h3>
          <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allergies.map((a) => (
              <span
                key={a.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${SEVERITY_COLORS[a.severity] || SEVERITY_COLORS.mild}`}
                title={a.reaction ? `Reaction: ${a.reaction}` : undefined}
              >
                {a.allergen}
                <span className="text-xs opacity-70">({a.severity})</span>
              </span>
            ))}
          </div>
        </>
      )}

      {/* Medical Records */}
      <div style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3>Medical Records ({records.length})</h3>
          <div className="flex items-center gap-2">
            {isDoctor && (
              <button
                onClick={() => setShowAddRecord(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            )}
            {docsByCategory('medical_record').length === 0 && (
              <button
                onClick={() => setUploadCategory('medical_record')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
            )}
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'doctorName', label: 'Doctor' },
            { key: 'diagnosis', label: 'Diagnosis' },
            { key: 'treatment', label: 'Plan' },
            { key: 'createdAt', label: 'Date', render: formatDate },
            { key: '_files', label: 'Files', render: (_, row) => renderFilesCell('medical_record', row) },
          ]}
          data={records}
        />
      </div>

      {/* Prescriptions */}
      <div style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3>Prescriptions ({rxs.length})</h3>
          <div className="flex items-center gap-2">
            {isDoctor && (
              <button
                onClick={() => setShowAddRx(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            )}
            {docsByCategory('prescription').length === 0 && (
              <button
                onClick={() => setUploadCategory('prescription')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
            )}
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'medication', label: 'Medication' },
            { key: 'dosage', label: 'Dosage' },
            { key: 'frequency', label: 'Frequency' },
            { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
            { key: '_files', label: 'Files', render: (_, row) => renderFilesCell('prescription', row) },
          ]}
          data={rxs}
        />
      </div>

      {/* Lab Reports */}
      <div style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3>Lab Reports ({labs.length})</h3>
          <div className="flex items-center gap-2">
            {isDoctor && (
              <button
                onClick={() => setShowLabRequest(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <FlaskConical className="w-3.5 h-3.5" /> Request Test
              </button>
            )}
            {docsByCategory('lab_report').length === 0 && (
              <button
                onClick={() => setUploadCategory('lab_report')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
            )}
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'testName', label: 'Test' },
            { key: 'technicianName', label: 'Technician' },
            { key: 'result', label: 'Result', render: formatLabResult },
            { key: 'reportDate', label: 'Date', render: formatDate },
            { key: '_files', label: 'Files', render: (_, row) => renderFilesCell('lab_report', row) },
          ]}
          data={labs}
        />
      </div>

      {/* Pending Lab Test Requests (Doctor view) */}
      {isDoctor && labRequests.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Lab Test Requests ({labRequests.length})</h3>
          <DataTable
            columns={[
              { key: 'testName', label: 'Test' },
              { key: 'priority', label: 'Priority', render: (val) => (
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  val === 'urgent' ? 'bg-red-100 text-red-700' :
                  val === 'normal' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{val}</span>
              )},
              { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
              { key: 'assignedToName', label: 'Assigned To', render: (val) => val || '—' },
              { key: 'createdAt', label: 'Requested', render: formatDate },
            ]}
            data={labRequests}
          />
        </div>
      )}

      {/* Complete Appointment Banner */}
      {isDoctor && activeAppointment && (() => {
        const hasNewRecord = initialRecordCount !== null && records.length > initialRecordCount;
        return (
          <div className={`mt-8 p-5 border rounded-xl flex items-center justify-between ${
            hasNewRecord
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
              : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
          }`}>
            <div>
              <p className={`font-semibold ${hasNewRecord ? 'text-green-900' : 'text-amber-900'}`}>
                Appointment In Progress
              </p>
              <p className={`text-sm mt-0.5 ${hasNewRecord ? 'text-green-700' : 'text-amber-700'}`}>
                {hasNewRecord
                  ? 'Done with this visit? Mark the appointment as completed.'
                  : 'Please add a medical record before completing this appointment.'}
              </p>
            </div>
            {hasNewRecord ? (
              <button
                onClick={handleCompleteAppointment}
                disabled={completingAppt}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {completingAppt ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Completing...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Complete Appointment</>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowAddRecord(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" /> Add Medical Record
              </button>
            )}
          </div>
        );
      })()}

      {/* Modals */}
      <QuickUploadModal
        open={!!uploadCategory}
        onClose={() => setUploadCategory(null)}
        onSuccess={fetchDocuments}
        patientId={id}
        category={uploadCategory || 'other'}
      />

      <DocumentPreviewModal
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <AddMedicalRecordModal
        open={showAddRecord}
        onClose={() => setShowAddRecord(false)}
        onSuccess={fetchPatient}
        patientId={id}
      />

      <AddPrescriptionModal
        open={showAddRx}
        onClose={() => setShowAddRx(false)}
        onSuccess={fetchPatient}
        patientId={id}
      />

      <RequestLabTestModal
        open={showLabRequest}
        onClose={() => setShowLabRequest(false)}
        onSuccess={fetchLabRequests}
        patientId={id}
      />
    </div>
  );
}
