import React, { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { useDispensingRequests } from '../hooks/useDispensing';
import DispensingRequestDetail from '../components/DispensingRequestDetail';
import DispensingDashboard from '../components/DispensingDashboard';
import DispensingFilters from '../components/DispensingFilters';
import DispensingRequestsList from '../components/DispensingRequestsList';
import DispenseModal from '../components/DispenseModal';

/**
 * MedicationDispensing Page
 * Main container component for medication dispensing workflow
 */
function MedicationDispensing() {
  const { requests, loading, error, dispenseRequest, holdRequest, resumeRequest } = useDispensingRequests();

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDispenseModal, setShowDispenseModal] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    if (!requests || requests.length === 0) {
      return { pending: 0, inProgress: 0, dispensed: 0, onHold: 0 };
    }

    return {
      pending: requests.filter(r => r.status === 'pending').length,
      inProgress: requests.filter(r => r.status === 'in_progress').length,
      dispensed: requests.filter(r => r.status === 'dispensed').length,
      onHold: requests.filter(r => r.status === 'on_hold').length,
    };
  }, [requests]);

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    if (!requests || requests.length === 0) return [];

    let filtered = requests;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(r => r.priority === filterPriority);
    }

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.patientName.toLowerCase().includes(searchLower) ||
        r.prescriptionId.toLowerCase().includes(searchLower) ||
        r.doctorName.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      filtered = [...filtered].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else {
      filtered = [...filtered].sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
    }

    return filtered;
  }, [requests, searchTerm, filterStatus, filterPriority, sortBy]);

  const handleDispense = (request) => {
    setSelectedRequest(request);
    setShowDispenseModal(true);
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleDispenseSubmit = async (dispensingData) => {
    if (selectedRequest) {
      await dispenseRequest(selectedRequest.id, dispensingData);
      setShowDispenseModal(false);
      setSelectedRequest(null);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setSortBy('recent');
  };

  // Loading skeleton
  if (loading && requests.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-200 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-200 rounded h-16 animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && requests.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-900">Unable to load dispensing requests</h3>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Stats Dashboard */}
      <DispensingDashboard stats={stats} hasError={!!error} />

      {/* Filters and Search */}
      <DispensingFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterPriority={filterPriority}
        onPriorityChange={setFilterPriority}
        sortBy={sortBy}
        onSortChange={setSortBy}
        requestsCount={requests?.length || 0}
        filteredCount={filteredRequests.length}
        onClearFilters={handleClearFilters}
      />

      {/* Requests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DispensingRequestsList
          requests={filteredRequests}
          onDispense={handleDispense}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Modals */}
      {showDetailModal && selectedRequest && (
        <DispensingRequestDetail
          request={selectedRequest}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRequest(null);
          }}
        />
      )}

      {showDispenseModal && selectedRequest && (
        <DispenseModal
          request={selectedRequest}
          onClose={() => {
            setShowDispenseModal(false);
            setSelectedRequest(null);
          }}
          onDispense={handleDispenseSubmit}
          isSubmitting={loading}
        />
      )}
    </div>
  );
}

export default MedicationDispensing;
