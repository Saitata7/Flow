// src/services/apiClient.js
import axios from 'axios';
import { generateJWTToken, getStoredJWTToken, storeJWTToken, clearJWTToken, verifyJWTToken } from '../utils/jwtAuth';
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

// Request interceptor to attach JWT token
api.interceptors.request.use(async (config) => {
  try {
    // Try to get JWT token for API request
    console.log('🔄 Getting JWT token for API request...');
    try {
      // Import JWT auth utilities
      const { getStoredJWTToken } = await import('../utils/jwtAuth');
      const jwtToken = await getStoredJWTToken();
      
      if (jwtToken) {
        config.headers.Authorization = `Bearer ${jwtToken}`;
        console.log('✅ JWT token attached to request:', config.url);
        console.log('✅ Token preview:', jwtToken.substring(0, 20) + '...');
      } else {
        console.log('⚠️ No JWT token available for request:', config.url);
        config.headers.Authorization = '';
      }
    } catch (jwtError) {
      console.warn('⚠️ JWT token retrieval failed:', jwtError.message);
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
        console.log('🔄 JWT token expired, clearing session...');
        
        // Clear stored token
        await clearJWTToken();
        
        // Process queued requests with error
        processQueue(new Error('JWT token expired'), null);
        
        // Return error indicating user needs to login
        return Promise.reject({
          message: 'Your session has expired. Please log in again.',
          code: 'JWT_TOKEN_EXPIRED',
          status: 401,
          action: 'LOGIN_REQUIRED'
        });
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        
        // Clear stored token on failure
        await clearJWTToken();
        
        // If refresh fails, user needs to login again
        return Promise.reject({
          message: 'Your session has expired. Please log in again.',
          code: 'TOKEN_REFRESH_FAILED',
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
