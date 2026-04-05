import api from './api';

export const getPurchaseOrders = async (params) => {
  const response = await api.get('/purchase-orders', { params });
  return response.data;
};

export const updatePurchaseOrderStatus = async (id, status) => {
  const response = await api.put(`/purchase-orders/${id}/status`, { status });
  return response.data;
};
