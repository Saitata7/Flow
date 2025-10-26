// src/services/apiClient.js
import axios from 'axios';
import { getStoredSessionToken, clearSessionToken } from '../utils/sessionAuth';
import { config } from '../config/environment';
import { handleAuthError, isAuthError, getAuthErrorMessage } from '../utils/authErrorHandler';

const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': 'flow-mobile-v1',
    'X-Platform': config.PLATFORM,
  },
});

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

// Process failed requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to attach session token
api.interceptors.request.use(async (config) => {
  try {
    // Get session token for API request
    console.log('🔄 Getting session token for API request...');
    try {
      const sessionToken = await getStoredSessionToken();
      
      if (sessionToken) {
        config.headers.Authorization = `Bearer ${sessionToken}`;
        console.log('✅ Session token attached to request:', config.url);
        console.log('✅ Token preview:', sessionToken.substring(0, 20) + '...');
      } else {
        console.log('⚠️ No session token available for request:', config.url);
        config.headers.Authorization = '';
      }
    } catch (sessionError) {
      console.warn('⚠️ Session token retrieval failed:', sessionError.message);
      config.headers.Authorization = '';
    }
  } catch (error) {
    console.warn('⚠️ Token retrieval failed:', error.message);
    config.headers.Authorization = '';
  }

  // Enforce secure headers
  config.headers['Content-Type'] = 'application/json';
  config.headers['X-Client-Version'] = 'flow-mobile-v1';
  config.headers['X-Platform'] = 'mobile';
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for error handling with auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle authentication errors gracefully
    if (isAuthError(error)) {
      console.log('🔍 Authentication error detected:', error.message);
      
      // Handle the auth error (clear stored data)
      const handled = await handleAuthError(error);
      
      if (handled) {
        // Return a more user-friendly error
        return Promise.reject({
          message: getAuthErrorMessage(error),
          code: 'AUTH_ERROR',
          status: 401,
          action: 'LOGIN_REQUIRED',
          handled: true
        });
      }
    }

    // Handle 401 errors with automatic token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Session expired, clearing session...');
        
        // Clear stored session token
        await clearSessionToken();
        
        // Process queued requests with error
        processQueue(new Error('Session expired'), null);
        
        // Return error indicating user needs to login
        return Promise.reject({
          message: 'Your session has expired. Please log in again.',
          code: 'SESSION_EXPIRED',
          status: 401,
          action: 'LOGIN_REQUIRED'
        });
        
      } catch (refreshError) {
        console.error('❌ Session clear failed:', refreshError);
        processQueue(refreshError, null);
        
        // Clear stored session token on failure
        await clearSessionToken();
        
        // If clear fails, user needs to login again
        return Promise.reject({
          message: 'Your session has expired. Please log in again.',
          code: 'SESSION_CLEAR_FAILED',
          status: 401,
          action: 'LOGIN_REQUIRED'
        });
      } finally {
        isRefreshing = false;
      }
    } else if (error.response?.status >= 500) {
      console.error('⚠️ Server error:', error.response.statusText);
    }
    
    return Promise.reject(error);
  }
);

export default api;
