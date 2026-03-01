const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function getAuthHeaders() {
  const token = localStorage.getItem('medease_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const { body, ...rest } = options;

  const res = await fetch(`${API_URL}/api${endpoint}`, {
    headers: getAuthHeaders(),
    ...rest,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401 && localStorage.getItem('medease_token')) {
      localStorage.removeItem('medease_user');
      localStorage.removeItem('medease_token');
      window.location.href = '/login';
    }

    const error = new Error(data.message || 'Something went wrong');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;
