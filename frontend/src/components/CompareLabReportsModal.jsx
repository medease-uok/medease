import { useState, useEffect } from 'react';
import { X, TrendingUp, FlaskConical, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import api from '../services/api';

export default function CompareLabReportsModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isPatient = currentUser?.role === 'patient';

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [availableTests, setAvailableTests] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);
  const [error, setError] = useState(null);

  // Fetch patients list (for staff only)
  useEffect(() => {
    if (isOpen && !isPatient) {
      setLoadingPatients(true);
      setError(null);
      api.get('/patients')
        .then((res) => {
          setPatients(res.data || []);
        })
        .catch((err) => {
          setError(err.data?.message || 'Failed to load patients');
        })
        .finally(() => {
          setLoadingPatients(false);
        });
    }
  }, [isOpen, isPatient]);

  // Fetch available tests for selected patient
  useEffect(() => {
    if (!selectedPatientId) {
      setAvailableTests([]);
      return;
    }

    setLoadingTests(true);
    setError(null);
    const params = isPatient ? {} : { patientId: selectedPatientId };

    api.get('/lab-reports/comparison', { params })
      .then((res) => {
        setAvailableTests(res.data.comparableTests || []);
      })
      .catch((err) => {
        setError(err.data?.message || 'Failed to load available tests');
      })
      .finally(() => {
        setLoadingTests(false);
      });
  }, [selectedPatientId, isPatient]);

  // For patients, auto-load their tests
  useEffect(() => {
    if (isOpen && isPatient) {
      setLoadingTests(true);
      setError(null);
      api.get('/lab-reports/comparison')
        .then((res) => {
          setAvailableTests(res.data.comparableTests || []);
        })
        .catch((err) => {
          setError(err.data?.message || 'Failed to load available tests');
        })
        .finally(() => {
          setLoadingTests(false);
        });
    }
  }, [isOpen, isPatient]);

  const handleCompare = () => {
    if (isPatient) {
      navigate('/lab-reports/comparison');
    } else if (selectedPatientId) {
      navigate(`/lab-reports/comparison?patientId=${selectedPatientId}`);
    }
    onClose();
  };

  const handleClose = () => {
    setSelectedPatientId('');
    setAvailableTests([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const canProceed = isPatient || selectedPatientId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Compare Lab Reports</h2>
              <p className="text-sm text-slate-500">Select a patient to view their test trends</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Patient Selection (for staff only) */}
          {!isPatient && (
            <div>
              <label htmlFor="patient-select" className="block text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Select Patient
              </label>
              {loadingPatients ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <select
                  id="patient-select"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">-- Select a patient --</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} ({patient.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Available Tests */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <FlaskConical className="w-4 h-4 inline mr-1" />
              Click a test type to view comparison
            </label>

            {loadingTests ? (
              <div className="flex items-center justify-center py-8 border border-slate-200 rounded-lg">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Loading available tests...</p>
                </div>
              </div>
            ) : !isPatient && !selectedPatientId ? (
              <div className="border border-slate-200 rounded-lg p-8 text-center">
                <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">Select a patient to see available tests</p>
              </div>
            ) : availableTests.length === 0 ? (
              <div className="border border-slate-200 rounded-lg p-8 text-center">
                <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">
                  {isPatient
                    ? 'You need at least 2 reports of the same test type to compare trends'
                    : 'This patient needs at least 2 reports of the same test type to compare trends'}
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {availableTests.map((test) => (
                  <button
                    key={test}
                    onClick={() => {
                      if (isPatient) {
                        navigate('/lab-reports/comparison');
                      } else if (selectedPatientId) {
                        navigate(`/lab-reports/comparison?patientId=${selectedPatientId}`);
                      }
                      onClose();
                    }}
                    className="w-full px-4 py-3 hover:bg-blue-50 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <span className="text-slate-900 group-hover:text-blue-900">{test}</span>
                      </div>
                      <TrendingUp className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {availableTests.length > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                <span className="font-medium">{availableTests.length}</span> test type{availableTests.length !== 1 ? 's' : ''} available • Click any test to view trends
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCompare}
            disabled={!canProceed || availableTests.length === 0}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            View All Tests
          </button>
        </div>
      </div>
    </div>
  );
}
