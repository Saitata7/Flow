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

// Session-based auth doesn't need refresh logic

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

    // Handle 401 errors - only clear session if explicitly expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if the error message explicitly mentions session expiration
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || '';
      const isSessionExpired = errorMessage.toLowerCase().includes('session') || 
                               errorMessage.toLowerCase().includes('expired') ||
                               errorMessage.toLowerCase().includes('expire');
      
      if (isSessionExpired) {
        console.log('🔄 Session explicitly expired on server, clearing session...');
        
        // Clear stored session token only when server explicitly says session expired
        try {
          await clearSessionToken();
        } catch (clearError) {
          console.error('❌ Failed to clear session token:', clearError);
        }
        
        return Promise.reject({
          message: 'Your session has expired. Please log in again.',
          code: 'SESSION_EXPIRED',
          status: 401,
          action: 'LOGIN_REQUIRED'
        });
      } else {
        // 401 but not explicitly about session - don't clear token, just pass through
        console.log('⚠️ 401 error but not session-related:', errorMessage);
        return Promise.reject(error);
      }
    } else if (error.response?.status >= 500) {
      console.error('⚠️ Server error:', error.response.statusText);
    }
    
    return Promise.reject(error);
  }
);

export default api;
