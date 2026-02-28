const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

async function request(endpoint, options = {}) {
  const { body, ...rest } = options;

  const res = await fetch(`${API_URL}/api${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...rest,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

const api = {
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  get: (endpoint) => request(endpoint, { method: 'GET' }),
};

export default api;
