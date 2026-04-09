import api from './api';

export const paymentsService = {
  getPayments: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response;
  },

  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response;
  },

  getPaymentSummary: async () => {
    const response = await api.get('/payments/summary');
    return response;
  },

  exportPayments: (params = {}) => {
    return api.get('/payments/export', {
      params,
      responseType: 'blob',
    });
  },
};
