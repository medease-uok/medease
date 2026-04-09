import { useState, useCallback } from 'react';
import { dispensingService } from '../services/dispensing.service';

/**
 * useDispensingRequests Hook
 * Manages pending and current dispensing requests
 * Handles fetching, updating status, and dispensing operations
 */
export function useDispensingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    dispensed: 0,
    onHold: 0,
  });

  const fetchRequests = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dispensingService.getDispensingRequests(filters);
      setRequests(response.requests || []);
      return response.requests || [];
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch dispensing requests';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await dispensingService.getDispensingStats();
      setStats(response.stats || {});
      return response.stats;
    } catch (err) {
      throw err;
    }
  }, []);

  const dispenseRequest = useCallback(async (requestId, dispensingData) => {
    try {
      const response = await dispensingService.dispenseMedication(requestId, dispensingData);
      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'dispensed', dispensedBy: dispensingData.pharmacistName, dispensedDate: new Date().toISOString() }
            : req
        )
      );
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to dispense medication';
      throw new Error(errorMessage);
    }
  }, []);

  const holdRequest = useCallback(async (requestId, reason) => {
    try {
      const response = await dispensingService.holdRequest(requestId, reason);
      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'on_hold', holdReason: reason }
            : req
        )
      );
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to hold request';
      throw new Error(errorMessage);
    }
  }, []);

  const resumeRequest = useCallback(async (requestId) => {
    try {
      const response = await dispensingService.resumeRequest(requestId);
      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'pending', holdReason: null }
            : req
        )
      );
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to resume request';
      throw new Error(errorMessage);
    }
  }, []);

  return {
    requests,
    loading,
    error,
    stats,
    fetchRequests,
    fetchStats,
    dispenseRequest,
    holdRequest,
    resumeRequest,
  };
}
