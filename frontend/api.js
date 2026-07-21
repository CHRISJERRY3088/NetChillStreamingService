// API Configuration - Frontend connection to Backend
const DEFAULT_BACKEND_BASE_URL = 'https://netchillstreamingservice.onrender.com/api';

function getApiUrlFromQuery() {
  if (typeof window === 'undefined' || !window.location || !window.location.search) {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const apiUrl = params.get('api');
  if (!apiUrl) {
    return null;
  }

  const normalizedUrl = apiUrl.replace(/\/$/, '');
  return normalizedUrl.endsWith('/api') ? normalizedUrl : `${normalizedUrl}/api`;
}

function resolveApiBaseUrl() {
  if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
    return window.__API_BASE_URL__;
  }

  const queryApi = getApiUrlFromQuery();
  if (queryApi) {
    return queryApi;
  }

  if (typeof window !== 'undefined' && window.location) {
    const localHosts = ['localhost', '127.0.0.1', '::1'];
    const { protocol, hostname, port, origin } = window.location;

    if (localHosts.includes(hostname)) {
      if (port === '10000') {
        return `${origin}/api`;
      }
      return 'http://localhost:10000/api';
    }

    if (protocol === 'file:') {
      return 'http://localhost:10000/api';
    }

    if (/^https?:$/i.test(protocol)) {
      return `${origin}/api`;
    }
  }

  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    const normalizedUrl = process.env.REACT_APP_API_URL.replace(/\/$/, '');
    return normalizedUrl.endsWith('/api') ? normalizedUrl : `${normalizedUrl}/api`;
  }

  return DEFAULT_BACKEND_BASE_URL;
}

const API_BASE_URL = resolveApiBaseUrl();

// Helper function to make API requests with proper error handling
function getDeviceId() {
  if (typeof window === 'undefined') return null;

  const existingDeviceId = window.localStorage.getItem('netchill_device_id');
  if (existingDeviceId) {
    return existingDeviceId;
  }

  const generatedDeviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem('netchill_device_id', generatedDeviceId);
  return generatedDeviceId;
}

function withDeviceContext(options = {}) {
  const deviceId = getDeviceId();
  if (!deviceId) {
    return options;
  }

  const headers = {
    ...options.headers,
    'X-Device-Id': deviceId,
  };

  if (options.body && typeof options.body === 'string') {
    try {
      const parsedBody = JSON.parse(options.body);
      if (!parsedBody.deviceId) {
        parsedBody.deviceId = deviceId;
        return {
          ...options,
          headers,
          body: JSON.stringify(parsedBody),
        };
      }
    } catch (error) {
      // Ignore invalid JSON bodies and fall back to the raw request.
    }
  }

  return {
    ...options,
    headers,
  };
}

async function apiCall(endpoint, options = {}) {
  const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const normalizedBaseUrl = String(API_BASE_URL || '').replace(/\/$/, '');
  const candidates = [];

  if (normalizedBaseUrl) {
    candidates.push(`${normalizedBaseUrl}${endpointPath}`);
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const sameOriginUrl = `${window.location.origin}${endpointPath}`;
    if (!candidates.includes(sameOriginUrl)) {
      candidates.push(sameOriginUrl);
    }
  }

  if (!candidates.includes(`/api${endpointPath}`)) {
    candidates.push(`/api${endpointPath}`);
  }

  const requestOptions = withDeviceContext(options);
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    ...requestOptions.headers,
  };

  let lastError = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        ...requestOptions,
        headers,
        credentials: 'include', // Include cookies for JWT auth
        cache: 'no-store',
      });

      const contentType = response.headers.get('content-type') || '';
      const rawBody = await response.text();
      const data = rawBody
        ? (contentType.includes('application/json') ? JSON.parse(rawBody) : { message: rawBody })
        : {};

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      lastError = error;
      if (error instanceof TypeError) {
        continue;
      }
    }
  }

  console.error(`API Error (${endpoint}):`, lastError);
  if (lastError instanceof TypeError) {
    throw new Error('Failed to connect to server. Ensure backend is running and CORS is configured.');
  }
  throw lastError || new Error('Failed to complete API request.');
}

// Auth API endpoints
const authAPI = {
  signup: async (fullName, email, password, subscription = 'Free') => {
    return apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, subscription }),
    });
  },

  login: async (email, password) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  forgotPassword: async (email) => {
    return apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  logout: async () => {
    return apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  logoutAndRedirect: async (destination = null) => {
    const target = destination || './login.html';

    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('Logout request failed; continuing with local sign-out.', error);
    }

    authStorage.logout();

    if (typeof window !== 'undefined') {
      window.location.assign(target);
    }

    return target;
  },

  getProfile: async () => {
    return apiCall('/auth/me', {
      method: 'GET',
    });
  },

  updateProfile: async (updateData) => {
    return apiCall('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  initializeFlutterwavePayment: async (subscription, recurringBillingEnabled = false) => {
    return apiCall('/billing/initialize-payment', {
      method: 'POST',
      body: JSON.stringify({ subscription, recurringBillingEnabled }),
    });
  },

  simulateWebhook: async (subscription = 'Lite') => {
    return apiCall('/billing/webhook-test', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
    });
  },

  verifyFlutterwavePayment: async (transactionId, txRef) => {
    const query = new URLSearchParams({
      transaction_id: String(transactionId),
      tx_ref: String(txRef),
    });
    return apiCall(`/billing/verify-payment?${query.toString()}`, {
      method: 'GET',
    });
  },

  getSubscriptionHistory: async () => {
    return apiCall('/billing/subscription-history', {
      method: 'GET',
    });
  },

  subscribeToAccountUpdates: () => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return null;
    const url = `${API_BASE_URL.replace('/api', '')}/api/sse/subscribe`;
    return new EventSource(url, { withCredentials: true });
  },

  refreshToken: async () => {
    return apiCall('/auth/refresh', {
      method: 'POST',
    });
  },
};

const moviesAPI = {
  getTrending: async () => {
    return apiCall('/movies/trending', { method: 'GET' });
  },

  getPopular: async (page = 1) => {
    const query = new URLSearchParams({ page: String(page) });
    return apiCall(`/movies/popular?${query.toString()}`, { method: 'GET' });
  },

  getTopRated: async (page = 1) => {
    const query = new URLSearchParams({ page: String(page) });
    return apiCall(`/movies/top-rated?${query.toString()}`, { method: 'GET' });
  },

  search: async (query, page = 1) => {
    const params = new URLSearchParams({ query: String(query), page: String(page) });
    return apiCall(`/movies/search?${params.toString()}`, { method: 'GET' });
  },

  getDetails: async (movieId) => {
    return apiCall(`/movies/details/${encodeURIComponent(movieId)}`, { method: 'GET' });
  },

  getStreaming: async (type, id, country = 'us') => {
    const params = new URLSearchParams({ country });
    return apiCall(`/movies/streaming/${encodeURIComponent(type)}/${encodeURIComponent(id)}?${params.toString()}`, { method: 'GET' });
  },

  getByGenre: async (genreId, page = 1) => {
    const query = new URLSearchParams({ page: String(page) });
    return apiCall(`/movies/genre/${encodeURIComponent(genreId)}?${query.toString()}`, { method: 'GET' });
  },

  getTrailers: async () => {
    return apiCall('/movies/trailers', { method: 'GET' });
  },
};

function isAccountLikeUserPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  return Boolean(payload.id || payload.email || payload.user?.id || payload.user?.email || payload.user_metadata?.email || payload.metadata?.email);
}

function readStoredUserPayload(storage = window.localStorage) {
  if (!storage || typeof storage.getItem !== 'function') {
    return null;
  }

  const raw = storage.getItem('netchill_user') || storage.getItem('user');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

// Storage helpers
const authStorage = {
  isLoggedIn: () => {
    const payload = readStoredUserPayload(typeof window !== 'undefined' ? window.localStorage : null);
    return isAccountLikeUserPayload(payload);
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('netchill_user');
  },

  saveUser: (user) => {
    if (!user) return;
    const payload = JSON.stringify(user);
    localStorage.setItem('user', payload);
    localStorage.setItem('netchill_user', payload);
  },

  getUser: () => {
    const user = localStorage.getItem('netchill_user') || localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

const downloadStorage = {
  STORAGE_KEY: 'netchill_downloads',
  LAST_VIEWED_KEY: 'netchill_last_viewed',

  getDownloads: () => {
    const raw = localStorage.getItem(downloadStorage.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  saveDownload: (download) => {
    if (!download) return;
    const downloads = downloadStorage.getDownloads();
    const existingIndex = downloads.findIndex((item) => item.episode === download.episode && item.quality === download.quality && item.format === download.format);
    if (existingIndex !== -1) {
      downloads[existingIndex] = { ...downloads[existingIndex], ...download, downloadedAt: download.downloadedAt || new Date().toISOString() };
    } else {
      downloads.unshift({ ...download, downloadedAt: new Date().toISOString() });
    }
    localStorage.setItem(downloadStorage.STORAGE_KEY, JSON.stringify(downloads.slice(0, 30)));
  },

  getLastViewed: () => {
    const raw = localStorage.getItem(downloadStorage.LAST_VIEWED_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  saveLastViewed: (movie) => {
    if (!movie) return;
    const payload = { ...movie, viewedAt: new Date().toISOString() };
    localStorage.setItem(downloadStorage.LAST_VIEWED_KEY, JSON.stringify(payload));
  },
};

if (typeof window !== 'undefined') {
  window.authAPI = authAPI;
  window.moviesAPI = moviesAPI;
  window.authStorage = authStorage;
  window.downloadStorage = downloadStorage;
}
