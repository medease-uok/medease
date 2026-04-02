import { useState, useEffect } from 'react';
import { AlertCircle, FlaskConical, Clock, AlertTriangle, FileText, CheckCircle, XCircle, Play, User } from 'lucide-react';
import api from '../services/api';
import CreateLabReportModal from '../components/CreateLabReportModal';
import { useAuth } from '../data/AuthContext';

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-800',
  normal: 'bg-blue-100 text-blue-800',
  routine: 'bg-gray-100 text-gray-800',
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const STATUS_ICONS = {
  pending: Clock,
  in_progress: FlaskConical,
  completed: CheckCircle,
  cancelled: XCircle,
};

export default function LabTestRequests() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState({});

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/lab-test-requests');
      setRequests(response.data);
    } catch (err) {
      setError(err.data?.message || 'Failed to load lab test requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchPatients();
  }, []);

  const handleCreateReport = (request) => {
    setSelectedRequest(request);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setSelectedRequest(null);
  };

  const handleReportCreated = () => {
    setShowCreateModal(false);
    setSelectedRequest(null);
    fetchRequests(); // Refresh the list
  };

  const handleStartWorking = async (requestId) => {
    try {
      setUpdatingStatus((prev) => ({ ...prev, [requestId]: true }));
      await api.patch(`/lab-test-requests/${requestId}`, {
        status: 'in_progress',
        assignedTo: currentUser.id, // Self-assign
      });
      await fetchRequests();
    } catch (err) {
      alert(err.data?.message || 'Failed to update request status');
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      setUpdatingStatus((prev) => ({ ...prev, [requestId]: true }));
      await api.patch(`/lab-test-requests/${requestId}`, {
        status: newStatus,
      });
      await fetchRequests();
    } catch (err) {
      alert(err.data?.message || 'Failed to update request status');
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending' || r.status === 'in_progress');
  const completedRequests = requests.filter((r) => r.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-slate-600">Loading lab test requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
          Lab Test Requests
        </h1>
        <p className="text-slate-500 mt-1">
          Manage and process lab test requests from doctors.
        </p>
      </div>

      {/* Pending Requests */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Pending Requests ({pendingRequests.length})
        </h2>
        {pendingRequests.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
            <FlaskConical className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No pending lab test requests</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((request) => {
              const StatusIcon = STATUS_ICONS[request.status];
              return (
                <div
                  key={request.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {request.testName}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            PRIORITY_COLORS[request.priority]
                          }`}
                        >
                          {request.priority === 'urgent' && <AlertTriangle className="w-3 h-3" />}
                          {request.priority}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[request.status]
                          }`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Patient</p>
                          <p className="font-medium text-slate-900">{request.patientName}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Requested by</p>
                          <p className="font-medium text-slate-900">{request.doctorName}</p>
                        </div>
                        {request.assignedToName && (
                          <div>
                            <p className="text-slate-500">Assigned to</p>
                            <p className="font-medium text-slate-900 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {request.assignedToName}
                            </p>
                          </div>
                        )}
                      </div>

                      {request.clinicalNotes && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs font-medium text-slate-600 mb-1">Clinical Notes</p>
                          <p className="text-sm text-slate-700">{request.clinicalNotes}</p>
                        </div>
                      )}

                      <div className="mt-3 text-xs text-slate-500">
                        Requested {new Date(request.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {request.status === 'pending' ? (
                        <button
                          onClick={() => handleStartWorking(request.id)}
                          disabled={updatingStatus[request.id]}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Play className="w-4 h-4" />
                          {updatingStatus[request.id] ? 'Starting...' : 'Start Working'}
                        </button>
                      ) : (
                        <>
                          <select
                            value={request.status}
                            onChange={(e) => handleStatusChange(request.id, e.target.value)}
                            disabled={updatingStatus[request.id]}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                          >
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button
                            onClick={() => handleCreateReport(request)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Upload Report
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Requests */}
      {completedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Recently Completed ({completedRequests.length})
          </h2>
          <div className="grid gap-4">
            {completedRequests.slice(0, 5).map((request) => (
              <div
                key={request.id}
                className="bg-white border border-slate-200 rounded-lg p-4 opacity-75"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-slate-700">{request.testName}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS.completed
                        }`}
                      >
                        <CheckCircle className="w-3 h-3" />
                        completed
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Patient</p>
                        <p className="font-medium text-slate-700">{request.patientName}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Requested by</p>
                        <p className="font-medium text-slate-700">{request.doctorName}</p>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      Completed {new Date(request.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Lab Report Modal */}
      {showCreateModal && selectedRequest && (
        <CreateLabReportModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          onSuccess={handleReportCreated}
          patients={patients}
          labTestRequestId={selectedRequest.id}
          prefillPatient={selectedRequest.patientId}
          prefillTestName={selectedRequest.testName}
          requestDetails={{
            doctorName: selectedRequest.doctorName,
            patientName: selectedRequest.patientName,
            priority: selectedRequest.priority,
            clinicalNotes: selectedRequest.clinicalNotes,
          }}
        />
      )}
    </div>
  );
}
