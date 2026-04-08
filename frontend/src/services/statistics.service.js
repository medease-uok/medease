import api from './api';

export const statisticsService = {
  getSummary: () => api.get('/statistics/summary'),
  getInventoryStats: () => api.get('/statistics/inventory'),
  getAppointmentTrends: () => api.get('/statistics/appointments'),
  getUserActivityStats: () => api.get('/statistics/user-activity'),
};

export default statisticsService;
