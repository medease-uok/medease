import api from './api';

export const auditService = {
  getLogs: async (params = {}) => {
    const response = await api.get('/audit-logs', { params });
    return response;
  },
  exportLogs: (params = {}) => {
    return api.get('/audit-logs/export', { 
      params, 
      responseType: 'blob' 
    });
  }
};
