import { useState, useEffect } from 'react';
import { X, Calendar, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';

export default function MassRescheduleModal({ isOpen, onClose, onSuccess, doctors = [] }) {
  const { currentUser } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [offsetDays, setOffsetDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const isDoctor = currentUser?.role === 'doctor';

  // Pre-select doctor's own ID if they're a doctor
  useEffect(() => {
    if (isDoctor && doctors.length > 0 && currentUser?.doctorId) {
      setSelectedDoctor(currentUser.doctorId);
    }
  }, [isDoctor, doctors, currentUser]);
  const isNurse = currentUser?.role === 'nurse';
  const isAdmin = currentUser?.role === 'admin';

  const canMassReschedule = isDoctor || isNurse || isAdmin;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPreview(null);

    if (!selectedDoctor) {
      setError('Please select a doctor');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (!offsetDays || offsetDays === '0') {
      setError('Please enter a non-zero offset');
      return;
    }

    const offset = parseInt(offsetDays, 10);
    if (isNaN(offset) || offset < -365 || offset > 365) {
      setError('Offset must be between -365 and 365 days');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/appointments/mass-reschedule', {
        doctorId: selectedDoctor,
        dateRange: {
          start: new Date(startDate).toISOString(),
          end: new Date(endDate + 'T23:59:59').toISOString(),
        },
        offsetDays: offset,
      });

      setPreview(response.data);

      // Auto-close after 3 seconds on success
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reschedule appointments';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDoctor('');
    setStartDate('');
    setEndDate('');
    setOffsetDays('');
    setError(null);
    setPreview(null);
    onClose();
  };

  if (!isOpen || !canMassReschedule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mass Reschedule</h2>
              <p className="text-sm text-slate-500">Shift multiple appointments at once</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Success Message */}
        {preview && (
          <div className="mx-6 mt-6 p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">
                  Successfully rescheduled {preview.rescheduledCount} appointment(s)
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Patients have been notified about the changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Doctor Selection */}
          <div className="space-y-2">
            <label htmlFor="doctor" className="block text-sm font-medium text-slate-700">
              Doctor {isDoctor && <span className="text-slate-400">(your appointments)</span>}
            </label>
            <select
              id="doctor"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              disabled={isDoctor || loading}
            >
              <option value="">Select a doctor</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.firstName} {doc.lastName} - {doc.department}
                </option>
              ))}
            </select>
            {isDoctor && (
              <p className="text-xs text-slate-500">
                You can only reschedule your own appointments
              </p>
            )}
            {isNurse && (
              <p className="text-xs text-slate-500">
                You can only reschedule appointments for doctors in your department
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Offset */}
          <div className="space-y-2">
            <label htmlFor="offsetDays" className="block text-sm font-medium text-slate-700">
              Shift By (Days)
            </label>
            <div className="relative">
              <input
                type="number"
                id="offsetDays"
                value={offsetDays}
                onChange={(e) => setOffsetDays(e.target.value)}
                placeholder="e.g., 1 (forward), -1 (backward)"
                min="-365"
                max="365"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5" />
              Positive numbers shift forward, negative numbers shift backward
            </p>
          </div>

          {/* Preview Calculation */}
          {startDate && endDate && offsetDays && offsetDays !== '0' && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  <span className="font-medium">From:</span>{' '}
                  {new Date(startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {' → '}
                  {new Date(new Date(startDate).getTime() + parseInt(offsetDays) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p>
                  <span className="font-medium">To:</span>{' '}
                  {new Date(endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {' → '}
                  {new Date(new Date(endDate).getTime() + parseInt(offsetDays) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Important:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Only <strong>scheduled</strong> appointments will be rescheduled</li>
                  <li>All appointments must pass validation or none will be updated</li>
                  <li>Patients will be notified automatically</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Rescheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Reschedule Appointments
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
