import api from './api';

export const inventoryService = {
  getAll: () => api.get('/inventory'),
  getById: (id) => api.get(`/inventory/${id}`),
  add: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  getReport: () => api.get('/inventory/report'),
  getAuditLogs: () => api.get('/inventory/audit/logs'),
  exportInventoryData: (params = {}) => {
    return api.get('/inventory/export', { 
      params, 
      responseType: 'blob' 
    });
  }
};
