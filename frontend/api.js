// API Configuration - Frontend connection to Backend
const DEFAULT_BACKEND_BASE_URL = 'https://your-backend.onrender.com/api/data';

function resolveApiBaseUrl() {
  if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
    return window.__API_BASE_URL__;
  }

  if (typeof window !== 'undefined' && window.location && /^https?:$/i.test(window.location.protocol)) {
    const { hostname } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

    if (isLocalHost) {
      return DEFAULT_BACKEND_BASE_URL;
    }

    return 'https://your-backend.onrender.com/api/data';
  }

  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Fallback when opened as file:// or in other non-http contexts.
  return DEFAULT_BACKEND_BASE_URL;
}

const API_BASE_URL = resolveApiBaseUrl();

// Helper function to make API requests with proper error handling
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for JWT auth
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
    console.error(`API Error (${endpoint}):`, error);
    if (error instanceof TypeError) {
      throw new Error('Failed to connect to server. Ensure backend is running and CORS is configured.');
    }
    throw error;
  }
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

  logout: async () => {
    return apiCall('/auth/logout', {
      method: 'POST',
    });
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

// Storage helpers
const authStorage = {
  isLoggedIn: () => {
    return !!(localStorage.getItem('netchill_user') || localStorage.getItem('user'));
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

if (typeof window !== 'undefined') {
  window.authAPI = authAPI;
  window.authStorage = authStorage;
}
