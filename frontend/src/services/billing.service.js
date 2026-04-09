import api from './api';

/**
 * Service layer for billing/invoice API calls.
 * Falls back to mock data when the backend is not available.
 */
export const billingService = {
  /**
   * Fetch paginated invoices list.
   * @param {Object} params - Query parameters (page, limit, status, search, etc.)
   * @returns {Promise<{ data: Array, pagination: Object }>}
   */
  getInvoices: async (params = {}) => {
    const response = await api.get('/invoices', { params });
    return response;
  },

  /**
   * Fetch a single invoice by ID (with line items).
   * @param {string} id
   * @returns {Promise<{ data: Object }>}
   */
  getInvoiceById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response;
  },

  /**
   * Fetch billing summary (totals, outstanding, overdue).
   * @returns {Promise<{ data: Object }>}
   */
  getBillingSummary: async () => {
    const response = await api.get('/invoices/summary');
    return response;
  },

  /**
   * Create a new invoice.
   * @param {Object} invoice - Invoice data with items
   * @returns {Promise<{ data: Object }>}
   */
  createInvoice: async (invoice) => {
    const response = await api.post('/invoices', invoice);
    return response;
  },

  /**
   * Update invoice status (mark as paid, void, etc.)
   * @param {string} id
   * @param {Object} data - { status, paymentMethod?, amountPaid? }
   * @returns {Promise<{ data: Object }>}
   */
  updateInvoiceStatus: async (id, data) => {
    const response = await api.patch(`/invoices/${id}/status`, data);
    return response;
  },

  /**
   * Export invoices as CSV or PDF.
   * @param {Object} params
   * @returns {Promise<Blob>}
   */
  exportInvoices: (params = {}) => {
    return api.get('/invoices/export', {
      params,
      responseType: 'blob',
    });
  },
};
