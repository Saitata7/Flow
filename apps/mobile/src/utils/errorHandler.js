// src/utils/errorHandler.js
/**
 * Production-ready error handling utility for Flow mobile app
 * Provides consistent error handling, user notifications, and logging
 */

import { Alert, ToastAndroid, Platform } from 'react-native';

/**
 * Show error toast notification
 * @param {string} message - Error message to display
 * @param {string} type - Error type (error, warning, info)
 */
export const showErrorToast = (message, type = 'error') => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    // iOS - could use a custom toast library or Alert
    Alert.alert('Error', message);
  }
};

/**
 * Handle API errors with appropriate user feedback
 * @param {object} error - Error object from API call
 * @param {string} context - Context where error occurred (e.g., 'flows', 'settings')
 * @returns {object} - Processed error information
 */
export const handleApiError = (error, context = 'API') => {
  const errorInfo = {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    status: 0,
    context,
    timestamp: new Date().toISOString()
  };

  // Handle JWT authentication errors first (don't show toast - let app handle redirect)
  if (error.code === 'AUTH_ERROR' || error.code === 'JWT_TOKEN_EXPIRED' || error.code === 'TOKEN_REFRESH_FAILED') {
    errorInfo.message = error.message || 'Your session has expired. Please log in again.';
    errorInfo.code = error.code;
    errorInfo.status = 401;
    errorInfo.action = 'LOGIN_REQUIRED';
    
    // Don't show toast for auth errors - let the app handle redirect to login
    console.log('🔍 JWT Authentication error detected:', errorInfo.message);
    return errorInfo;
  }

  // Network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    errorInfo.message = 'Network error. Please check your connection.';
    errorInfo.code = 'NETWORK_ERROR';
    showErrorToast(errorInfo.message, 'error');
    return errorInfo;
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    errorInfo.message = 'Request timeout. Please try again.';
    errorInfo.code = 'TIMEOUT';
    showErrorToast(errorInfo.message, 'warning');
    return errorInfo;
  }

  // HTTP status errors
  if (error.response) {
    errorInfo.status = error.response.status;
    
    switch (error.response.status) {
      case 401:
        errorInfo.message = 'Session expired. Please login again.';
        errorInfo.code = 'UNAUTHORIZED';
        errorInfo.action = 'LOGIN_REQUIRED';
        // Don't show toast for 401 errors - let the app handle redirect to login
        console.log('🔍 401 Unauthorized error detected');
        break;
        
      case 403:
        errorInfo.message = 'Access denied. You don\'t have permission for this action.';
        errorInfo.code = 'FORBIDDEN';
        showErrorToast(errorInfo.message, 'error');
        break;
        
      case 404:
        errorInfo.message = 'Data not found.';
        errorInfo.code = 'NOT_FOUND';
        showErrorToast(errorInfo.message, 'warning');
        break;
        
      case 409:
        errorInfo.message = 'Conflict. This data already exists.';
        errorInfo.code = 'CONFLICT';
        showErrorToast(errorInfo.message, 'warning');
        break;
        
      case 422:
        errorInfo.message = 'Invalid data. Please check your input.';
        errorInfo.code = 'VALIDATION_ERROR';
        showErrorToast(errorInfo.message, 'warning');
        break;
        
      case 429:
        errorInfo.message = 'Too many requests. Please wait a moment.';
        errorInfo.code = 'RATE_LIMITED';
        showErrorToast(errorInfo.message, 'warning');
        break;
        
      case 500:
        errorInfo.message = 'Server error. Please try again later.';
        errorInfo.code = 'SERVER_ERROR';
        showErrorToast(errorInfo.message, 'error');
        break;
        
      case 502:
      case 503:
      case 504:
        errorInfo.message = 'Service temporarily unavailable. Please try again later.';
        errorInfo.code = 'SERVICE_UNAVAILABLE';
        showErrorToast(errorInfo.message, 'error');
        break;
        
      default:
        errorInfo.message = `Error ${error.response.status}: ${error.response.statusText}`;
        errorInfo.code = 'HTTP_ERROR';
        showErrorToast(errorInfo.message, 'error');
    }
  } else if (error.request) {
    // Request was made but no response received
    errorInfo.message = 'No response from server. Please check your connection.';
    errorInfo.code = 'NO_RESPONSE';
    showErrorToast(errorInfo.message, 'error');
  } else {
    // Something else happened
    errorInfo.message = error.message || 'An unexpected error occurred';
    errorInfo.code = 'UNKNOWN_ERROR';
    showErrorToast(errorInfo.message, 'error');
  }

  // Log error for debugging (in development)
  if (__DEV__) {
    console.error(`🚨 API Error [${context}]:`, {
      message: errorInfo.message,
      code: errorInfo.code,
      status: errorInfo.status,
      originalError: error
    });
  }

  return errorInfo;
};

/**
 * Handle authentication errors specifically
 * @param {object} error - Authentication error
 * @returns {object} - Processed auth error
 */
export const handleAuthError = (error) => {
  const authError = {
    message: 'Authentication failed',
    code: 'AUTH_ERROR',
    status: 401,
    context: 'authentication',
    timestamp: new Date().toISOString()
  };

  if (error.code === 'auth/user-not-found') {
    authError.message = 'User not found. Please check your email.';
    authError.code = 'USER_NOT_FOUND';
  } else if (error.code === 'auth/wrong-password') {
    authError.message = 'Incorrect password. Please try again.';
    authError.code = 'WRONG_PASSWORD';
  } else if (error.code === 'auth/email-already-in-use') {
    authError.message = 'Email already in use. Please use a different email.';
    authError.code = 'EMAIL_IN_USE';
  } else if (error.code === 'auth/weak-password') {
    authError.message = 'Password is too weak. Please choose a stronger password.';
    authError.code = 'WEAK_PASSWORD';
  } else if (error.code === 'auth/invalid-email') {
    authError.message = 'Invalid email address. Please check your email.';
    authError.code = 'INVALID_EMAIL';
  } else if (error.code === 'auth/network-request-failed') {
    authError.message = 'Network error. Please check your connection.';
    authError.code = 'NETWORK_ERROR';
  } else if (error.code === 'auth/too-many-requests') {
    authError.message = 'Too many failed attempts. Please try again later.';
    authError.code = 'TOO_MANY_REQUESTS';
  }

  showErrorToast(authError.message, 'error');
  
  if (__DEV__) {
    console.error('🚨 Auth Error:', authError);
  }

  return authError;
};

/**
 * Retry mechanism with exponential backoff
 * @param {function} apiCall - API function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise that resolves with API response
 */
export const retryWithBackoff = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain error types
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`🔄 Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Validate API response structure
 * @param {object} response - API response to validate
 * @param {string} expectedType - Expected response type
 * @returns {boolean} - Whether response is valid
 */
export const validateApiResponse = (response, expectedType = 'data') => {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  switch (expectedType) {
    case 'data':
      return response.hasOwnProperty('data') || response.hasOwnProperty('success');
    case 'list':
      return Array.isArray(response.data) || Array.isArray(response);
    case 'object':
      return typeof response.data === 'object' && !Array.isArray(response.data);
    default:
      return true;
  }
};
