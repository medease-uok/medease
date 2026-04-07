import api from './api';

export const reportService = {
  getInventoryStatus: async () => {
    const response = await api.get('/reports/inventory-status');
    return response.data;
  },

  getMonthlyUsage: async () => {
    const response = await api.get('/reports/monthly-usage');
    return response.data;
  },

  getAppointmentSummary: async () => {
    const response = await api.get('/reports/appointment-summary');
    return response.data;
  },

  getSupplierOrders: async () => {
    const response = await api.get('/reports/supplier-orders');
    return response.data;
  }
};
