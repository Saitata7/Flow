// src/utils/authErrorHandler.js
/**
 * Authentication Error Handler for Flow Mobile App
 * Handles session expiration and authentication errors gracefully
 */

import { clearJWTToken } from './jwtAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const SESSION_STORAGE_KEY = 'user_session';
const TOKEN_STORAGE_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

/**
 * Handle authentication errors gracefully
 * @param {Error} error - The authentication error
 * @returns {Promise<boolean>} True if error was handled, false otherwise
 */
export const handleAuthError = async (error) => {
  try {
    console.log('🔍 Handling auth error:', error.message);
    
    // Check if it's a session expiration error
    if (error.message?.includes('Session expired') || 
        error.message?.includes('JWT_TOKEN_EXPIRED') ||
        error.message?.includes('TOKEN_REFRESH_FAILED') ||
        error.code === 'JWT_TOKEN_EXPIRED' ||
        error.code === 'TOKEN_REFRESH_FAILED') {
      
      console.log('🔄 Session expired, clearing stored data...');
      
      // Clear all stored authentication data
      await Promise.all([
        clearJWTToken(),
        SecureStore.deleteItemAsync(USER_DATA_KEY),
        SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY),
        AsyncStorage.removeItem(SESSION_STORAGE_KEY),
      ]);
      
      console.log('✅ Authentication data cleared');
      
      // Return true to indicate the error was handled
      return true;
    }
    
    // Check for 401 errors
    if (error.response?.status === 401 || error.status === 401) {
      console.log('🔄 401 Unauthorized, clearing stored data...');
      
      // Clear all stored authentication data
      await Promise.all([
        clearJWTToken(),
        SecureStore.deleteItemAsync(USER_DATA_KEY),
        SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY),
        AsyncStorage.removeItem(SESSION_STORAGE_KEY),
      ]);
      
      console.log('✅ Authentication data cleared for 401 error');
      
      return true;
    }
    
    return false;
  } catch (clearError) {
    console.error('❌ Error clearing authentication data:', clearError);
    return false;
  }
};

/**
 * Check if an error is an authentication error
 * @param {Error} error - The error to check
 * @returns {boolean} True if it's an auth error
 */
export const isAuthError = (error) => {
  return (
    error.message?.includes('Session expired') ||
    error.message?.includes('JWT_TOKEN_EXPIRED') ||
    error.message?.includes('TOKEN_REFRESH_FAILED') ||
    error.code === 'JWT_TOKEN_EXPIRED' ||
    error.code === 'TOKEN_REFRESH_FAILED' ||
    error.response?.status === 401 ||
    error.status === 401
  );
};

/**
 * Get user-friendly error message for authentication errors
 * @param {Error} error - The authentication error
 * @returns {string} User-friendly error message
 */
export const getAuthErrorMessage = (error) => {
  if (isAuthError(error)) {
    return 'Your session has expired. Please log in again.';
  }
  
  if (error.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection.';
  }
  
  return error.message || 'An unexpected error occurred.';
};
