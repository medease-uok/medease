import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Upload, X, AlertCircle, Eye, Loader2, Download, ExternalLink,
  Plus, FileText, FlaskConical, Pill, ChevronLeft, CheckCircle2, Star,
  ClipboardList, Calendar, Check, Circle, Trash2, CreditCard,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';
import DetailCard from '../components/DetailCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import VoiceNoteButton from '../components/VoiceNoteButton';
import IcdCodeLookup from '../components/IcdCodeLookup';
import DocumentViewer from '../components/DocumentViewer';

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

  return (
    <DocumentViewer
      isOpen={!!doc}
      onClose={onClose}
      url={doc.url}
      fileName={doc.fileName || doc.title}
      fileType={doc.mimeType}
    />
  );
}

/* ─── Add Medical Record Modal (Doctor only) ─── */
function AddMedicalRecordModal({ open, onClose, onSuccess, patientId }) {
  const [diagnosis, setDiagnosis] = useState('');
  const [icdCode, setIcdCode] = useState(null);
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) { setDiagnosis(''); setIcdCode(null); setTreatment(''); setNotes(''); setError(null); }
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
        icdCode: icdCode || undefined,
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Diagnosis *</label>
            <VoiceNoteButton onTranscript={(t) => setDiagnosis((v) => v ? `${v} ${t}` : t)} disabled={saving} />
          </div>
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
          <label className="block text-sm font-medium text-slate-700 mb-1">ICD-10 Code</label>
          <IcdCodeLookup
            value={icdCode}
            onChange={(code, desc) => {
              setIcdCode(code);
              if (code && desc && !diagnosis.trim()) setDiagnosis(desc);
            }}
            disabled={saving}
          />
          <p className="text-xs text-slate-400 mt-1">Optional. Search by code or description to assign a standard diagnosis code.</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Plan / Steps to Follow</label>
            <VoiceNoteButton onTranscript={(t) => setTreatment((v) => v ? `${v} ${t}` : t)} disabled={saving} />
          </div>
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Clinical Notes</label>
            <VoiceNoteButton onTranscript={(t) => setNotes((v) => v ? `${v} ${t}` : t)} disabled={saving} />
          </div>
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Notes</label>
            <VoiceNoteButton onTranscript={(t) => setNotes((v) => v ? `${v} ${t}` : t)} disabled={saving} maxLength={1000} currentLength={notes.length} />
          </div>
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Clinical Notes</label>
            <VoiceNoteButton onTranscript={(t) => setClinicalNotes((v) => v ? `${v} ${t}` : t)} disabled={saving} />
          </div>
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

/* ─── Add Treatment Plan Modal ─── */
function AddTreatmentPlanModal({ open, onClose, onSuccess, patientId }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setTitle(''); setDescription(''); setPriority('medium');
      setStartDate(''); setEndDate(''); setNotes(''); setItems([]); setError(null);
    }
  }, [open]);

  const addItem = () => setItems((prev) => [...prev, { title: '', description: '', dueDate: '' }]);
  const updateItemField = (idx, field, value) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  const removeItemRow = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    const validItems = items.filter((it) => it.title.trim());
    if (items.length > 0 && validItems.length === 0) { setError('Add at least one step with a title, or remove all steps.'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.post(`/patients/${patientId}/treatment-plans`, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        startDate: startDate || null,
        endDate: endDate || null,
        notes: notes.trim() || null,
        items: validItems.map((it) => ({
          title: it.title.trim(),
          description: it.description.trim() || null,
          dueDate: it.dueDate || null,
        })),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create treatment plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Treatment Plan" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            placeholder="e.g. Post-surgery rehabilitation"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <div className="flex gap-3">
            {['low', 'medium', 'high'].map((p) => (
              <label key={p} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="plan-priority"
                  value={p}
                  checked={priority === p}
                  onChange={() => setPriority(p)}
                  className="text-primary focus:ring-primary"
                />
                <span className={`text-sm font-medium capitalize ${p === 'high' ? 'text-red-600' : 'text-slate-700'}`}>
                  {p}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <VoiceNoteButton onTranscript={(t) => setDescription((v) => v ? `${v} ${t}` : t)} disabled={saving} maxLength={1000} currentLength={description.length} />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Detailed treatment plan description..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Notes</label>
            <VoiceNoteButton onTranscript={(t) => setNotes((v) => v ? `${v} ${t}` : t)} disabled={saving} maxLength={1000} currentLength={notes.length} />
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="Additional notes..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">Plan Steps</label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Step
            </button>
          </div>
          {items.length === 0 && (
            <p className="text-xs text-slate-400 italic">No steps added yet. You can add steps now or later.</p>
          )}
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs font-bold text-slate-400 mt-2 min-w-[20px]">{idx + 1}.</span>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItemField(idx, 'title', e.target.value)}
                    maxLength={255}
                    placeholder="Step title *"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItemField(idx, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <input
                      type="date"
                      value={item.dueDate}
                      onChange={(e) => updateItemField(idx, 'dueDate', e.target.value)}
                      className="w-36 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItemRow(idx)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
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
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><ClipboardList className="w-4 h-4" /> Create Plan</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Treatment Plan Item Row ─── */
function TreatmentPlanItemRow({ item, planId, patientId, canEdit, onRefresh }) {
  const [toggling, setToggling] = useState(false);

  const toggleComplete = async () => {
    setToggling(true);
    try {
      await api.patch(`/patients/${patientId}/treatment-plans/${planId}/items/${item.id}`, {
        isCompleted: !item.isCompleted,
      });
      onRefresh();
    } catch {
      // silent
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/patients/${patientId}/treatment-plans/${planId}/items/${item.id}`);
      onRefresh();
    } catch {
      // silent
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 group">
      {canEdit ? (
        <button onClick={toggleComplete} disabled={toggling} className="flex-shrink-0">
          {item.isCompleted ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
          )}
        </button>
      ) : (
        item.isCompleted ? <Check className="w-5 h-5 text-green-600 flex-shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${item.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
          {item.title}
        </span>
        {item.dueDate && (
          <span className="ml-2 text-xs text-slate-400">
            <Calendar className="w-3 h-3 inline mr-0.5" />
            {formatDate(item.dueDate)}
          </span>
        )}
      </div>
      {canEdit && (
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
          title="Remove item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ─── Treatment Plan Card (expandable) ─── */
function TreatmentPlanCard({ plan, patientId, isDoctor, expanded, onToggle, onRefresh }) {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    if (expanded && items.length === 0) {
      setLoadingItems(true);
      api.get(`/patients/${patientId}/treatment-plans/${plan.id}`)
        .then((res) => setItems(res.data?.items || []))
        .catch(() => {})
        .finally(() => setLoadingItems(false));
    }
  }, [expanded, patientId, plan.id]);

  const refreshItems = () => {
    api.get(`/patients/${patientId}/treatment-plans/${plan.id}`)
      .then((res) => setItems(res.data?.items || []))
      .catch(() => {});
    onRefresh();
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    setAddingItem(true);
    try {
      await api.post(`/patients/${patientId}/treatment-plans/${plan.id}/items`, {
        title: newItemTitle.trim(),
      });
      setNewItemTitle('');
      refreshItems();
    } catch {
      // silent
    } finally {
      setAddingItem(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/patients/${patientId}/treatment-plans/${plan.id}`, { status: newStatus });
      onRefresh();
    } catch {
      // silent
    }
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
  };

  const statusColors = {
    active: 'bg-blue-100 text-blue-700',
    on_hold: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };

  const progress = plan.itemCount > 0
    ? Math.round((plan.completedItemCount / plan.itemCount) * 100)
    : 0;

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <ClipboardList className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="font-semibold text-slate-900 truncate">{plan.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                {plan.doctorName && <span className="text-xs text-slate-500">{plan.doctorName}</span>}
                {plan.startDate && (
                  <span className="text-xs text-slate-400">
                    Started {formatDate(plan.startDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[plan.priority] || ''}`}>
              {plan.priority}
            </span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[plan.status] || ''}`}>
              {plan.status.replace('_', ' ')}
            </span>
            {plan.itemCount > 0 && (
              <span className="text-xs text-slate-500 ml-1">
                {plan.completedItemCount}/{plan.itemCount}
              </span>
            )}
          </div>
        </div>
        {plan.itemCount > 0 && (
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4">
          {plan.description && (
            <p className="text-sm text-slate-600 mb-3">{plan.description}</p>
          )}
          {plan.notes && (
            <p className="text-sm text-slate-500 italic mb-3">{plan.notes}</p>
          )}
          {plan.endDate && (
            <p className="text-xs text-slate-400 mb-3">Target end: {formatDate(plan.endDate)}</p>
          )}

          {isDoctor && plan.status === 'active' && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleStatusChange('completed')}
                className="text-xs px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                Mark Completed
              </button>
              <button
                onClick={() => handleStatusChange('on_hold')}
                className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Put On Hold
              </button>
              <button
                onClick={() => handleStatusChange('cancelled')}
                className="text-xs px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {isDoctor && plan.status === 'on_hold' && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleStatusChange('active')}
                className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Resume Plan
              </button>
            </div>
          )}

          <div className="mt-2">
            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Checklist Items</h5>
            {loadingItems ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : (
              <>
                {items.map((item) => (
                  <TreatmentPlanItemRow
                    key={item.id}
                    item={item}
                    planId={plan.id}
                    patientId={patientId}
                    canEdit={isDoctor}
                    onRefresh={refreshItems}
                  />
                ))}
                {items.length === 0 && !isDoctor && (
                  <p className="text-sm text-slate-400 py-2">No items yet.</p>
                )}
              </>
            )}

            {isDoctor && plan.status === 'active' && (
              <form onSubmit={handleAddItem} className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Add a checklist item..."
                  maxLength={255}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={addingItem || !newItemTitle.trim()}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
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
  const [feedback, setFeedback] = useState([]);
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

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

  // Fetch patient feedback for this patient (doctor view)
  const fetchFeedback = useCallback(() => {
    if (!isDoctor) return;
    api.get('/patient-feedback')
      .then((res) => {
        setFeedback((res.data || []).filter((f) => String(f.patientId) === String(id)));
      })
      .catch(() => {});
  }, [id, isDoctor]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const fetchTreatmentPlans = useCallback(() => {
    api.get(`/patients/${id}/treatment-plans`)
      .then((res) => setTreatmentPlans(res.data || []))
      .catch(() => {});
  }, [id]);

  useEffect(() => { fetchTreatmentPlans(); }, [fetchTreatmentPlans]);

  const fetchPayments = useCallback(() => {
    setPaymentsLoading(true);
    api.get(`/payments`, { params: { patientId: id } })
      .then((res) => setPayments(res.data || []))
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));
  }, [id]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

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

      {/* Doctor Quick Actions (only during active appointment) */}
      {isDoctor && activeAppointment && (
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
          <button
            onClick={() => setShowAddPlan(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <ClipboardList className="w-4 h-4" />
            Add Treatment Plan
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
            {isDoctor && activeAppointment && (
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
            { key: 'diagnosis', label: 'Diagnosis', render: (val, row) => (
              <div>
                <span>{val}</span>
                {row.icdCode && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-mono font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded" title={row.icdDescription || ''}>
                    {row.icdCode}
                  </span>
                )}
              </div>
            )},
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
            {isDoctor && activeAppointment && (
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
            {isDoctor && activeAppointment && (
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

      {/* Treatment Plans */}
      <div style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3>Treatment Plans ({treatmentPlans.length})</h3>
          {isDoctor && (
            <button
              onClick={() => setShowAddPlan(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Plan
            </button>
          )}
        </div>
        {treatmentPlans.length > 0 ? (
          <div className="space-y-3">
            {treatmentPlans.map((plan) => (
              <TreatmentPlanCard
                key={plan.id}
                plan={plan}
                patientId={id}
                isDoctor={isDoctor}
                expanded={expandedPlan === plan.id}
                onToggle={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                onRefresh={fetchTreatmentPlans}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No treatment plans yet.</p>
        )}
      </div>

      {/* Payment History */}
      <div style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3 className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Payment History ({payments.length})
          </h3>
        </div>
        {paymentsLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading payments...
          </div>
        ) : (
          <DataTable
            columns={[
              { key: 'description', label: 'Description', render: (val) => val || 'Payment' },
              { key: 'category', label: 'Category', render: (val) => (
                <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  {(val || 'other').replace('_', ' ')}
                </span>
              )},
              { key: 'payment_method', label: 'Method', render: (val) => (
                <span className="text-sm text-slate-700">{(val || '—').replace('_', ' ')}</span>
              )},
              { key: 'status', label: 'Status', render: (val) => {
                const colors = {
                  completed: 'bg-green-100 text-green-700',
                  pending: 'bg-amber-100 text-amber-700',
                  failed: 'bg-red-100 text-red-700',
                  refunded: 'bg-blue-100 text-blue-700',
                  cancelled: 'bg-slate-100 text-slate-600',
                };
                return (
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${colors[val] || colors.pending}`}>
                    {val || 'pending'}
                  </span>
                );
              }},
              { key: 'amount', label: 'Amount', render: (val) => (
                <span className="font-bold text-sm text-slate-900">
                  LKR {Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              )},
              { key: 'created_at', label: 'Date', render: formatDate },
            ]}
            data={payments}
          />
        )}
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

      {/* Patient Feedback (Doctor view) */}
      {isDoctor && feedback.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Patient Feedback ({feedback.length})</h3>
          <div className="space-y-3">
            {feedback.map((fb) => (
              <div key={fb.id} className="p-4 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                    <span className="ml-1.5 text-sm font-semibold text-slate-700">{fb.rating}/5</span>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(fb.createdAt)}</span>
                </div>
                {(fb.communicationRating || fb.waitTimeRating || fb.treatmentRating) && (
                  <div className="flex flex-wrap gap-3 mb-2">
                    {fb.communicationRating && (
                      <span className="text-xs text-slate-500">Communication: <strong>{fb.communicationRating}/5</strong></span>
                    )}
                    {fb.waitTimeRating && (
                      <span className="text-xs text-slate-500">Wait Time: <strong>{fb.waitTimeRating}/5</strong></span>
                    )}
                    {fb.treatmentRating && (
                      <span className="text-xs text-slate-500">Treatment: <strong>{fb.treatmentRating}/5</strong></span>
                    )}
                  </div>
                )}
                {fb.comment && (
                  <p className="text-sm text-slate-600 italic">"{fb.comment}"</p>
                )}
                {fb.isAnonymous && (
                  <span className="inline-block mt-1 text-xs text-slate-400">Anonymous feedback</span>
                )}
              </div>
            ))}
          </div>
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

      <AddTreatmentPlanModal
        open={showAddPlan}
        onClose={() => setShowAddPlan(false)}
        onSuccess={fetchTreatmentPlans}
        patientId={id}
      />
    </div>
  );
}
