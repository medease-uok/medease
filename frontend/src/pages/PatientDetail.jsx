import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Upload, X, AlertCircle, Eye, Loader2,
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

const truncate = (val, max = 80) => {
  if (!val) return '—';
  return val.length > max ? val.substring(0, max) + '…' : val;
};

function formatLabResult(val) {
  if (!val) return '—';
  // Split by comma to handle multi-value results like "WBC: 6.8 x10^9/L, RBC: 3.9 x10^12/L"
  const parts = val.split(/,\s*/);
  return (
    <div className="space-y-1">
      {parts.map((part, i) => {
        // Replace x10^N with proper superscript
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Upload {CATEGORY_LABELS[category] || 'Document'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
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
      </div>
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const isDoctor = currentUser?.role === 'doctor';
  const [patient, setPatient] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [records, setRecords] = useState([]);
  const [rxs, setRxs] = useState([]);
  const [labs, setLabs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadCategory, setUploadCategory] = useState(null);

  useEffect(() => {
    api.get(`/patients/${id}`)
      .then((res) => {
        setPatient(res.data.patient);
        setAllergies(res.data.allergies || []);
        setRecords(res.data.medicalRecords);
        setRxs(res.data.prescriptions);
        setLabs(res.data.labReports);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const fetchDocuments = () => {
    api.get('/medical-documents')
      .then((res) => {
        const docs = res.data || [];
        const patientDocs = docs.filter((d) => String(d.patientId) === String(id));
        setDocuments(patientDocs);
      })
      .catch((err) => {
        console.error('Failed to fetch documents:', err.message, err.status);
      });
  };

  useEffect(() => { fetchDocuments(); }, [id]);

  const docsByCategory = (cat) => documents.filter((d) => d.category === cat);

  const handleViewDoc = async (docId) => {
    try {
      const res = await api.get(`/medical-documents/${docId}`);
      if (res.data?.url) window.open(res.data.url, '_blank');
    } catch { /* ignore */ }
  };

  const renderFilesCell = (category) => {
    const docs = docsByCategory(category);
    if (!docs.length) {
      return <span className="text-slate-300 text-xs">—</span>;
    }
    return (
      <div className="flex flex-col gap-1">
        {docs.map((doc) => (
          <button
            key={doc.id}
            onClick={(e) => { e.stopPropagation(); handleViewDoc(doc.id); }}
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 hover:underline transition-colors text-left"
            title={`View: ${doc.fileName}`}
          >
            <Eye className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{doc.title}</span>
          </button>
        ))}
      </div>
    );
  };

  if (loading) return <div style={{ padding: 32 }}>Loading patient...</div>;

  if (!patient) {
    return <div>Patient not found. <Link to="/patients">Back to Patients</Link></div>;
  }

  return (
    <div>
      <Link to="/patients" style={{ marginBottom: 16, display: 'inline-block' }}>
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

      <div style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3>Medical Records ({records.length})</h3>
          <button
            onClick={() => setUploadCategory('medical_record')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
        </div>
        <DataTable
          columns={[
            { key: 'doctorName', label: 'Doctor' },
            { key: 'diagnosis', label: 'Diagnosis' },
            { key: 'treatment', label: 'Treatment' },
            { key: 'createdAt', label: 'Date', render: formatDate },
            { key: '_files', label: 'Files', render: (_, row) => renderFilesCell('medical_record', row) },
          ]}
          data={records}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3>Prescriptions ({rxs.length})</h3>
          <button
            onClick={() => setUploadCategory('prescription')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
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

      <div style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3>Lab Reports ({labs.length})</h3>
          <button
            onClick={() => setUploadCategory('lab_report')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
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

      <QuickUploadModal
        open={!!uploadCategory}
        onClose={() => setUploadCategory(null)}
        onSuccess={fetchDocuments}
        patientId={id}
        category={uploadCategory || 'other'}
      />
    </div>
  );
}
