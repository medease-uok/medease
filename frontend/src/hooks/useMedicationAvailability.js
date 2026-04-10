import { useState, useCallback } from 'react';
import { dispensingService } from '../services/dispensing.service';

/**
 * useMedicationAvailability Hook
 * Manages medication inventory and availability checks
 * Handles verifying stock availability before dispensing
 */
export function useMedicationAvailability() {
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verifyAvailability = useCallback(async (medications) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dispensingService.verifyMedicationAvailability(medications);
      setAvailability(response.availability || {});
      return response.availability || {};
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to verify availability';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    availability,
    loading,
    error,
    verifyAvailability,
  };
}
