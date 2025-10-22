// src/utils/jwtAuth.js
/**
 * JWT Authentication utility for Flow mobile app
 * Uses React Native compatible JWT decoding (no signing/verification on mobile)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const JWT_SECRET = process.env.EXPO_PUBLIC_JWT_SECRET || 'Flow-prod-secret-key-2024'; // Must match backend JWT_SECRET
const JWT_EXPIRES_IN = '7d';
const JWT_STORAGE_KEY = 'flow_jwt_token';

/**
 * Generate a JWT token for the user (mobile app doesn't generate tokens)
 * @param {Object} userData - User data from authentication
 * @returns {string|null} JWT token (always null on mobile - tokens come from backend)
 */
export const generateJWTToken = (userData) => {
  // Mobile app doesn't generate JWT tokens - they come from the backend
  console.log('ℹ️ JWT token generation not supported on mobile - tokens come from backend');
  return null;
};

/**
 * Get stored JWT token
 * @returns {Promise<string|null>} JWT token or null
 */
export const getStoredJWTToken = async () => {
  try {
    return await SecureStore.getItemAsync(JWT_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting stored JWT token:', error);
    return null;
  }
};

/**
 * Store JWT token securely
 * @param {string} token - JWT token to store
 */
export const storeJWTToken = async (token) => {
  try {
    await SecureStore.setItemAsync(JWT_STORAGE_KEY, token);
    console.log('✅ JWT token stored securely');
  } catch (error) {
    console.error('Error storing JWT token:', error);
  }
};

/**
 * Clear JWT token from storage
 */
export const clearJWTToken = async () => {
  try {
    await SecureStore.deleteItemAsync(JWT_STORAGE_KEY);
    console.log('✅ JWT token cleared from storage');
  } catch (error) {
    console.error('Error clearing JWT token:', error);
  }
};

/**
 * Verify JWT token (mobile app doesn't verify tokens - backend does)
 * @param {string} token - JWT token to verify
 * @returns {boolean} Always true on mobile - verification happens on backend
 */
export const verifyJWTToken = (token) => {
  // Mobile app doesn't verify JWT tokens - backend handles verification
  console.log('ℹ️ JWT token verification not supported on mobile - backend handles verification');
  return true;
};


/**
 * Decode JWT token using React Native compatible method
 * @param {string} token - JWT token to decode
 * @returns {object|null} Decoded payload or null
 */
const decodeJWTToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    // Split token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode payload (second part) using a working approach
    const payload = parts[1];
    
    // Add padding if needed
    let paddedPayload = payload;
    while (paddedPayload.length % 4) {
      paddedPayload += '=';
    }
    
    // Replace URL-safe characters
    paddedPayload = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Use a working base64 decode implementation
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    
    for (let i = 0; i < paddedPayload.length; i += 4) {
      const chunk = paddedPayload.substr(i, 4);
      const encoded1 = chars.indexOf(chunk.charAt(0));
      const encoded2 = chars.indexOf(chunk.charAt(1));
      const encoded3 = chars.indexOf(chunk.charAt(2));
      const encoded4 = chars.indexOf(chunk.charAt(3));
      
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
      
      result += String.fromCharCode((bitmap >> 16) & 255);
      if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
      if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
    }
    
    return JSON.parse(result);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Get JWT token info (simplified - no decoding on mobile)
 * @param {string} token - JWT token (optional, will get from storage if not provided)
 * @returns {object|null} Token info or null
 */
export const getJWTTokenInfo = async (token = null) => {
  try {
    // If no token provided, get from storage
    if (!token) {
      token = await getStoredJWTToken();
    }
    
    if (!token) return null;
    
    // Don't decode on mobile - just return basic info
    // The backend will handle verification
    return {
      valid: true, // Assume valid if token exists
      userData: {
        id: 'temp-user-id', // Will be replaced by backend verification
        email: 'temp@email.com', // Will be replaced by backend verification
        name: 'Temp User', // Will be replaced by backend verification
        emailVerified: true,
        picture: null,
      },
      payload: null, // Don't decode on mobile
      expiresAt: null, // Don't decode on mobile
      isExpired: false // Don't decode on mobile
    };
  } catch (error) {
    console.error('Error getting JWT token info:', error);
    return null;
  }
};