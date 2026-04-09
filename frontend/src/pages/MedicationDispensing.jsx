import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Search, Plus, Check, Clock, AlertCircle, Pill, Filter, Download, X,
  ChevronDown, Package, User, Calendar, FileText, Loader2, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../data/AuthContext';
import { ROLES } from '../data/roles';
import { useDispensingRequests } from '../hooks/useDispensing';
import DispensingRequestDetail from '../components/DispensingRequestDetail';

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-50 border-yellow-200', badge: 'warning', label: 'Pending', icon: Clock },
  in_progress: { color: 'bg-blue-50 border-blue-200', badge: 'default', label: 'In Progress', icon: Loader2 },
  dispensed: { color: 'bg-green-50 border-green-200', badge: 'success', label: 'Dispensed', icon: Check },
  on_hold: { color: 'bg-orange-50 border-orange-200', badge: 'destructive', label: 'On Hold', icon: AlertCircle },
};

const PRIORITY_CONFIG = {
  low: { color: 'text-blue-600 bg-blue-50', label: 'Low' },
  normal: { color: 'text-slate-600 bg-slate-50', label: 'Normal' },
  high: { color: 'text-red-600 bg-red-50', label: 'High' },
  urgent: { color: 'text-red-700 bg-red-100', label: 'Urgent' },
};

function DispenseModal({ request, onClose, onDispense, isSubmitting }) {
  const [loading, setLoading] = useState(false);
  const [batchNumbers, setBatchNumbers] = useState(
    request.medications.reduce((acc, med) => ({ ...acc, [med.id]: '' }), {})
  );
  const [expiryDates, setExpiryDates] = useState(
    request.medications.reduce((acc, med) => ({ ...acc, [med.id]: '' }), {})
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  const handleDispense = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate batch numbers and expiry dates
    const missingBatch = request.medications.some(med => !batchNumbers[med.id]);
    const missingExpiry = request.medications.some(med => !expiryDates[med.id]);

    if (missingBatch || missingExpiry) {
      setError('Please fill in all batch numbers and expiry dates');
      return;
    }

    // Validate batch number format
    for (const [medId, batch] of Object.entries(batchNumbers)) {
      if (!/^[A-Z0-9\-]{3,20}$/.test(batch)) {
        setError('Batch numbers must be 3-20 alphanumeric characters (and hyphens)');
        return;
      }
    }

    // Validate expiry dates are in future
    for (const [medId, expiry] of Object.entries(expiryDates)) {
      if (new Date(expiry) <= new Date()) {
        setError('Expiry dates must be in the future');
        return;
      }
    }

    onDispense({
      requestId: request.id,
      batchNumbers,
      expiryDates,
      notes,
    });
  };

  const activeLoading = loading || isSubmitting;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Dispense Medication</h2>
            <p className="text-sm text-slate-500 mt-1">{request.patientName} • {request.prescriptionId}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors" disabled={activeLoading}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleDispense} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Medications section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Medications to Dispense</h3>
            {request.medications.map((med) => (
              <div key={med.id} className="border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">{med.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Strength: {med.strength} • Qty: {med.quantity} {med.unit}
                    </p>
                    <p className="text-sm text-slate-500">
                      Dosage: {med.dosage}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Batch Number *
                    </label>
                    <input
                      type="text"
                      value={batchNumbers[med.id]}
                      onChange={(e) => setBatchNumbers(prev => ({ ...prev, [med.id]: e.target.value }))}
                      placeholder="e.g., BTH-2024-001"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                      disabled={activeLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={expiryDates[med.id]}
                      onChange={(e) => setExpiryDates(prev => ({ ...prev, [med.id]: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                      disabled={activeLoading}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pharmacist notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pharmacist Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for the patient or dispensing information..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
              disabled={activeLoading}
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{notes.length}/500</p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              disabled={activeLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              disabled={activeLoading}
            >
              {activeLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Check className="w-4 h-4" />
              Confirm Dispensing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DispensingRequestCard({ request, onDispense, onViewDetails }) {
  const StatusIcon = STATUS_CONFIG[request.status].icon;
  const statusConfig = STATUS_CONFIG[request.status];
  const priorityConfig = PRIORITY_CONFIG[request.priority];

  return (
    <div className={`border rounded-lg p-4 transition-all hover:shadow-md ${statusConfig.color}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900">{request.patientName}</h3>
              <span className="text-xs text-slate-500">#{request.prescriptionId}</span>
            </div>
            <p className="text-sm text-slate-600">Dr. {request.doctorName.replace('Dr. ', '')}</p>
            <p className="text-xs text-slate-500 mt-1">
              {request.medications.length} medication{request.medications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={statusConfig.badge}>{statusConfig.label}</Badge>
          <Badge variant={request.priority === 'high' || request.priority === 'urgent' ? 'destructive' : 'secondary'}>
            {priorityConfig.label}
          </Badge>
        </div>
      </div>

      {/* Medications preview */}
      <div className="mb-3 space-y-1">
        {request.medications.slice(0, 2).map((med, idx) => (
          <div key={med.id} className="text-sm text-slate-600 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-[10px] text-slate-700">
              {idx + 1}
            </span>
            <span className="font-medium">{med.name}</span>
            <span className="text-slate-500">{med.strength}</span>
            <span className="text-slate-500">x{med.quantity}</span>
          </div>
        ))}
        {request.medications.length > 2 && (
          <p className="text-xs text-slate-500 pl-6">+{request.medications.length - 2} more</p>
        )}
      </div>

      {/* Notes alert */}
      {request.notes && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{request.notes}</p>
        </div>
      )}

      {/* Footer with timing and actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
        <div className="text-xs text-slate-500">
          {new Date(request.requestDate).toLocaleTimeString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        <div className="flex gap-2">
          {request.status === 'pending' && (
            <button
              onClick={() => onDispense(request)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Dispense
            </button>
          )}
          {request.status === 'dispensed' && (
            <button
              onClick={() => onViewDetails(request)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              View
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MedicationDispensing() {
  const { currentUser } = useAuth();
  const { requests, loading, error, stats, fetchRequests, dispenseRequest } = useDispensingRequests();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [submitting, setSubmitting] = useState(false);

  // Fetch requests on mount
  useEffect(() => {
    fetchRequests({ status: 'pending' });
  }, [fetchRequests]);

  // Filter and sort logic
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    
    let filtered = [...requests];

    // Search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.patientName?.toLowerCase().includes(query) ||
        req.prescriptionId?.toLowerCase().includes(query) ||
        req.doctorName?.toLowerCase().includes(query) ||
        req.medications?.some(med => med.name?.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(req => req.priority === filterPriority);
    }

    // Sorting
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
    } else if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      filtered.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));
    }

    return filtered;
  }, [requests, searchTerm, filterStatus, filterPriority, sortBy]);

  const handleDispense = (request) => {
    setSelectedRequest(request);
    setShowDispenseModal(true);
  };

  const handleConfirmDispense = async (dispensingData) => {
    setSubmitting(true);
    try {
      await dispenseRequest(selectedRequest.id, dispensingData);
      setShowDispenseModal(false);
      setSelectedRequest(null);
      // Refresh the list
      fetchRequests({ status: filterStatus === 'all' ? undefined : filterStatus });
    } catch (err) {
      console.error('Dispensing error:', err);
      alert(err.message || 'Failed to dispense medication');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  // Loading state
  if (loading && requests.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-10 bg-slate-200 rounded-lg mb-4 w-48"></div>
          <div className="h-5 bg-slate-100 rounded w-96 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Medication Dispensing</h1>
          <p className="text-slate-600 mt-1">Manage prescription fulfillment and medication distribution</p>
        </div>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error loading dispensing requests</h3>
            <p className="text-sm text-red-800 mt-1">{error}</p>
            <button
              onClick={() => fetchRequests()}
              className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending', count: stats?.pending || 0, color: 'bg-yellow-50 border-yellow-200', icon: Clock },
          { label: 'In Progress', count: stats?.inProgress || 0, color: 'bg-blue-50 border-blue-200', icon: Loader2 },
          { label: 'Dispensed', count: stats?.dispensed || 0, color: 'bg-green-50 border-green-200', icon: Check },
          { label: 'On Hold', count: stats?.onHold || 0, color: 'bg-orange-50 border-orange-200', icon: AlertCircle },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`border rounded-lg p-4 ${stat.color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stat.count}</p>
                </div>
                <Icon className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Dispensing Requests</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="priority">By Priority</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by patient name, prescription ID, doctor, or medication..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="dispensed">Dispensed</option>
                <option value="on_hold">On Hold</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterPriority('all');
                  }}
                  className="px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            {/* Results count */}
            <div className="text-sm text-slate-600">
              Showing {filteredRequests.length} of {requests.length || 0} requests
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dispensing requests list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(request => (
            <DispensingRequestCard
              key={request.id}
              request={request}
              onDispense={handleDispense}
              onViewDetails={handleViewDetails}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">No dispensing requests</h3>
            <p className="text-slate-500 mt-1">No requests match your current filters</p>
          </div>
        )}
      </div>

      {/* Dispense modal */}
      {showDispenseModal && selectedRequest && (
        <DispenseModal
          request={selectedRequest}
          onClose={() => setShowDispenseModal(false)}
          onDispense={handleConfirmDispense}
          isSubmitting={submitting}
        />
      )}

      {/* Detail modal */}
      {showDetailModal && selectedRequest && (
        <DispensingRequestDetail
          request={selectedRequest}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
}
