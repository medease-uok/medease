import api from './api';

export const supplierService = {
  getAll: async (params = {}) => {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  add: async (supplierData) => {
    const response = await api.post('/suppliers', supplierData);
    return response.data;
  },

  update: async (id, supplierData) => {
    const response = await api.put(`/suppliers/${id}`, supplierData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  }
};
