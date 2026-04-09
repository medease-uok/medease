const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

let isRefreshing = false;
let refreshQueue = [];

function trackActivity() {
  localStorage.setItem('medease_last_activity', String(Date.now()));
}

function isInactive() {
  const last = localStorage.getItem('medease_last_activity');
  if (!last) return true;
  return Date.now() - Number(last) > INACTIVITY_LIMIT;
}

// Track user activity on interaction events
if (typeof window !== 'undefined') {
  for (const evt of ['click', 'keydown', 'scroll', 'mousemove', 'touchstart']) {
    window.addEventListener(evt, trackActivity, { passive: true, capture: true });
  }
}

function clearSession() {
  localStorage.removeItem('medease_user');
  localStorage.removeItem('medease_token');
  localStorage.removeItem('medease_refresh_token');
  localStorage.removeItem('medease_last_activity');
  window.location.href = '/login';
}

function getAuthHeaders() {
  const token = localStorage.getItem('medease_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function attemptRefresh() {
  if (isInactive()) return false;

  const refreshToken = localStorage.getItem('medease_refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem('medease_token', data.data.token);
    localStorage.setItem('medease_refresh_token', data.data.refreshToken);
    localStorage.setItem('medease_user', JSON.stringify(data.data.user));
    window.dispatchEvent(new CustomEvent('medease:user-updated', { detail: data.data.user }));
    return true;
  } catch {
    return false;
  }
}

function waitForRefresh() {
  return new Promise((resolve) => {
    refreshQueue.push(resolve);
  });
}

function flushRefreshQueue(success) {
  refreshQueue.forEach((resolve) => resolve(success));
  refreshQueue = [];
}

async function request(endpoint, options = {}) {
  const { body, params, signal, ...rest } = options;

  let url = `${API_URL}/api${endpoint}`;
  if (params && typeof params === 'object') {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== '')
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const fetchOpts = {
    headers: getAuthHeaders(),
    ...rest,
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(signal ? { signal } : {}),
  };

  let res = await fetch(url, fetchOpts);

  if (res.status === 401 && localStorage.getItem('medease_refresh_token')) {
    let refreshed;

    if (isRefreshing) {
      refreshed = await waitForRefresh();
    } else {
      isRefreshing = true;
      refreshed = await attemptRefresh();
      isRefreshing = false;
      flushRefreshQueue(refreshed);
    }

    if (refreshed) {
      res = await fetch(url, {
        ...fetchOpts,
        headers: getAuthHeaders(),
      });
    }
  }

  if (options.responseType === 'blob') {
    if (!res.ok) {
      if (res.status === 401 && localStorage.getItem('medease_token')) {
        clearSession();
      }
      const errText = await res.text().catch(() => 'Export failed');
      const error = new Error(errText);
      error.status = res.status;
      throw error;
    }
    return res.blob();
  }

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401 && localStorage.getItem('medease_token')) {
      clearSession();
    }

    const error = new Error(data.message || 'Something went wrong');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function uploadRequest(endpoint, formData) {
  const token = localStorage.getItem('medease_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401 && localStorage.getItem('medease_token')) {
      clearSession();
    }
    const error = new Error(data.message || 'Upload failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

const api = {
  get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) => uploadRequest(endpoint, formData),
};

export default api;
