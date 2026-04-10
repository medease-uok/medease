import api from './api';

export const reportService = {
  getInventoryStatus: (params = {}) => api.get('/reports/inventory-status', { params }),

  getMonthlyUsage: (params = {}) => api.get('/reports/monthly-usage', { params }),

  getAppointmentSummary: (params = {}) => api.get('/reports/appointment-summary', { params }),

  getSupplierOrders: (params = {}) => api.get('/reports/supplier-orders', { params }),


  exportReport: async (reportType, format, params = {}) => {
    const response = await api.get(`/reports/${reportType}`, { 
      params: { ...params, format },
      responseType: 'blob' 
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const contentDisposition = response.headers['content-disposition'];
    let filename = `report_${reportType}.${format}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
