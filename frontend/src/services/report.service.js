import api from './api';

export const reportService = {
  getInventoryStatus: async (params = {}) => {
    const response = await api.get('/reports/inventory-status', { params });
    return response.data;
  },

  getMonthlyUsage: async (params = {}) => {
    const response = await api.get('/reports/monthly-usage', { params });
    return response.data;
  },

  getAppointmentSummary: async (params = {}) => {
    const response = await api.get('/reports/appointment-summary', { params });
    return response.data;
  },

  getSupplierOrders: async (params = {}) => {
    const response = await api.get('/reports/supplier-orders', { params });
    return response.data;
  }
};
