import api from './api';

/**
 * Service layer for payment-related API calls.
 * All methods return the normalized API payload (not the raw fetch response),
 * since `api.get` already parses the JSON body internally.
 */
export const paymentsService = {
  /**
   * Fetch paginated payments list.
   * @param {Object} params - Query parameters (page, limit, status, patientId, etc.)
   * @param {AbortSignal} [signal] - Optional AbortController signal to cancel in-flight requests
   * @returns {Promise<{ data: Array, pagination: Object }>}
   */
  getPayments: async (params = {}, signal) => {
    const response = await api.get('/payments', { params, signal });
    return response;
  },

  /**
   * Fetch a single payment by ID.
   * @param {string} id
   * @returns {Promise<{ data: Object }>}
   */
  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response;
  },

  /**
   * Fetch aggregated payment summary (totals by status, this month, etc.)
   * @param {Object} [params] - Optional query parameters (e.g. patientId)
   * @returns {Promise<{ data: Object }>}
   */
  getPaymentSummary: async (params = {}) => {
    const response = await api.get('/payments/summary', { params });
    return response;
  },

  /**
   * Export payments as a downloadable file (CSV or PDF).
   * @param {Object} params - Query parameters including format
   * @returns {Promise<Blob>}
   */
  exportPayments: (params = {}) => {
    return api.get('/payments/export', {
      params,
      responseType: 'blob',
    });
  },
};
