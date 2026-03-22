import api from './api';

export const inventoryService = {
  getAll: () => api.get('/inventory'),
  add: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};
