// API Configuration - Frontend connection to Backend
function resolveApiBaseUrl() {
  if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
    return window.__API_BASE_URL__;
  }

  if (typeof window !== 'undefined' && window.location && /^https?:$/i.test(window.location.protocol)) {
    const { protocol, hostname, port, origin } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const localHostForUrl = hostname.includes(':') ? `[${hostname}]` : hostname;

    // When the frontend is served from the backend itself, use same-origin.
    if (isLocalHost && port === '3000') {
      return `${origin}/api`;
    }

    // For local static servers on other ports, still target the backend on 3000.
    if (isLocalHost) {
      return `${protocol}//${localHostForUrl}:3000/api`;
    }

    // Production-like deployments should keep using same-origin API routes.
    return `${origin}/api`;
  }

  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Fallback when opened as file:// or in other non-http contexts.
  return 'http://localhost:3000/api';
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
  // Sign up new user
  signup: async (fullName, email, password, subscription = 'Free') => {
    return apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, subscription }),
    });
  },

  // Login user
  login: async (email, password) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Logout user
  logout: async () => {
    return apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  // Get current user profile
  getProfile: async () => {
    return apiCall('/auth/me', {
      method: 'GET',
    });
  },

  // Update user profile
  updateProfile: async (updateData) => {
    return apiCall('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Initialize Flutterwave payment checkout
  initializeFlutterwavePayment: async (subscription) => {
    return apiCall('/billing/initialize-payment', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
    });
  },

  // Verify Flutterwave payment after redirect
  verifyFlutterwavePayment: async (transactionId, txRef) => {
    const query = new URLSearchParams({
      transaction_id: String(transactionId),
      tx_ref: String(txRef),
    });
    return apiCall(`/billing/verify-payment?${query.toString()}`, {
      method: 'GET',
    });
  },

  // Get subscription payment history
  getSubscriptionHistory: async () => {
    return apiCall('/billing/subscription-history', {
      method: 'GET',
    });
  },

  // Refresh access token
  refreshToken: async () => {
    return apiCall('/auth/refresh', {
      method: 'POST',
    });
  },
};

// Storage helpers
const authStorage = {
  isLoggedIn: () => {
    // Fallback only: httpOnly cookies are not readable in JS.
    return !!localStorage.getItem('user');
  },

  logout: () => {
    // Cookies are httpOnly so they can't be deleted from JS
    // Server will handle cookie deletion via logout endpoint
    localStorage.removeItem('user');
  },

  saveUser: (user) => {
    if (!user) return;
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

// Expose APIs globally for regular <script> usage in HTML pages.
if (typeof window !== 'undefined') {
  window.authAPI = authAPI;
  window.authStorage = authStorage;
}
