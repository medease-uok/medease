import { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function CreateLabReportModal({
  isOpen,
  onClose,
  onSuccess,
  patients = [],
  labTestRequestId = null,
  prefillPatient = null,
  prefillTestName = null,
  requestDetails = null, // { doctorName, patientName, priority, clinicalNotes }
}) {
  const [selectedPatient, setSelectedPatient] = useState(prefillPatient || '');
  const [testName, setTestName] = useState(prefillTestName || '');
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isFromRequest = !!labTestRequestId;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (25 MB max)
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError('File size must be less than 25 MB');
        setFile(null);
        return;
      }
      // Validate file type
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Allowed: PDF, JPEG, PNG, WebP, DOC, DOCX');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    if (!testName.trim()) {
      setError('Please enter test name');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('patientId', selectedPatient);
      formData.append('testName', testName.trim());
      if (result.trim()) formData.append('result', result.trim());
      if (notes.trim()) formData.append('notes', notes.trim());
      if (file) formData.append('file', file);
      if (labTestRequestId) formData.append('labTestRequestId', labTestRequestId);

      await api.upload('/lab-reports', formData);

      setSuccess(true);

      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to create lab report';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPatient('');
    setTestName('');
    setResult('');
    setNotes('');
    setFile(null);
    setError(null);
    setSuccess(false);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Create Lab Report</h2>
            <p className="text-sm text-slate-500 mt-1">Upload test results for a patient</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Request Context Banner */}
          {isFromRequest && requestDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900">Completing Lab Test Request</h3>
                  <p className="text-xs text-blue-700 mt-0.5">
                    This report will be linked to the doctor's test request
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Requested by:</span>
                  <p className="text-blue-900 mt-0.5">{requestDetails.doctorName}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Patient:</span>
                  <p className="text-blue-900 mt-0.5">{requestDetails.patientName}</p>
                </div>
              </div>
              {requestDetails.clinicalNotes && (
                <div>
                  <span className="text-blue-600 font-medium text-xs">Clinical Notes:</span>
                  <p className="text-blue-800 text-xs mt-1 bg-blue-100/50 rounded p-2">
                    {requestDetails.clinicalNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700">Lab report created successfully!</p>
                <p className="text-xs text-green-600 mt-0.5">
                  {isFromRequest
                    ? 'Patient, doctor, and department nurses have been notified'
                    : 'Patient has been notified'}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Patient Selection */}
          <div>
            <label htmlFor="patient-select" className="block text-sm font-medium text-slate-700 mb-1">
              Patient <span className="text-red-500">*</span>
              {isFromRequest && <span className="text-xs text-slate-500 ml-2">(from request)</span>}
            </label>
            {isFromRequest ? (
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700">
                {requestDetails?.patientName || 'Loading...'}
              </div>
            ) : (
              <select
                id="patient-select"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                disabled={loading || success}
              >
                <option value="">Select a patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || `${p.firstName} ${p.lastName}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Test Name */}
          <div>
            <label htmlFor="test-name" className="block text-sm font-medium text-slate-700 mb-1">
              Test Name <span className="text-red-500">*</span>
              {isFromRequest && <span className="text-xs text-slate-500 ml-2">(from request)</span>}
            </label>
            {isFromRequest ? (
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700">
                {testName}
              </div>
            ) : (
              <input
                id="test-name"
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g., Complete Blood Count, X-Ray Chest"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                disabled={loading || success}
              />
            )}
          </div>

          {/* Result (Optional) */}
          <div>
            <label htmlFor="result" className="block text-sm font-medium text-slate-700 mb-1">
              Result (Optional)
            </label>
            <textarea
              id="result"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="Enter test results or findings"
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={loading || success}
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or observations"
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={loading || success}
            />
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700 mb-1">
              Report File (Optional)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-primary transition-colors">
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                className="hidden"
                disabled={loading || success}
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                {file ? (
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-green-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-700">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500 mt-1">
                      PDF, JPEG, PNG, WebP, DOC, DOCX (max 25MB)
                    </p>
                  </>
                )}
              </label>
            </div>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
                disabled={loading || success}
              >
                Remove file
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || success}
            >
              {loading ? 'Creating...' : 'Create Lab Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
