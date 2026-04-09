import api from './api';

export const dispensingService = {
  // Get all dispensing requests
  async getDispensingRequests(filters = {}) {
    try {
      const response = await api.get('/api/dispensing/requests', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a single dispensing request
  async getDispensingRequest(requestId) {
    try {
      const response = await api.get(`/api/dispensing/requests/${requestId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get pending requests for a specific medication
  async getPendingRequestsForMedication(medicationId) {
    try {
      const response = await api.get(`/api/dispensing/medications/${medicationId}/pending`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Dispense medication
  async dispenseMedication(requestId, dispensingData) {
    try {
      const response = await api.post(`/api/dispensing/requests/${requestId}/dispense`, dispensingData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Dispense multiple items in a request
  async dispenseMultiple(requestId, medications) {
    try {
      const response = await api.post(`/api/dispensing/requests/${requestId}/dispense-multiple`, {
        medications,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Put request on hold
  async holdRequest(requestId, reason) {
    try {
      const response = await api.patch(`/api/dispensing/requests/${requestId}/hold`, { reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resume a held request
  async resumeRequest(requestId) {
    try {
      const response = await api.patch(`/api/dispensing/requests/${requestId}/resume`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get dispensing history
  async getDispensingHistory(filters = {}) {
    try {
      const response = await api.get('/api/dispensing/history', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get dispensing statistics
  async getDispensingStats() {
    try {
      const response = await api.get('/api/dispensing/statistics');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Export dispensing report
  async exportDispensingReport(format = 'pdf', filters = {}) {
    try {
      const response = await api.get('/api/dispensing/report/export', {
        params: { format, ...filters },
        responseType: format === 'pdf' ? 'blob' : 'json',
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get patient dispensing history
  async getPatientDispensingHistory(patientId) {
    try {
      const response = await api.get(`/api/dispensing/patient/${patientId}/history`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify medication availability
  async verifyMedicationAvailability(medications) {
    try {
      const response = await api.post('/api/dispensing/verify-availability', {
        medications,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
