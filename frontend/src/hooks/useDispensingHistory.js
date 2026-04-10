import { useState, useCallback } from 'react';
import { dispensingService } from '../services/dispensing.service';

/**
 * useDispensingHistory Hook
 * Manages dispensing history and completed requests
 * Handles fetching and filtering historical dispensing data
 */
export function useDispensingHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dispensingService.getDispensingHistory(filters);
      setHistory(response.history || []);
      return response.history || [];
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch dispensing history';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPatientHistory = useCallback(async (patientId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dispensingService.getPatientDispensingHistory(patientId);
      setHistory(response.history || []);
      return response.history || [];
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch patient history';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    history,
    loading,
    error,
    fetchHistory,
    getPatientHistory,
  };
}
