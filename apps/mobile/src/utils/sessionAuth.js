// utils/sessionAuth.js
// Session Token Management for Flow Mobile App
// Simple, secure session token handling

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const SESSION_TOKEN_KEY = 'session_token';
const SESSION_EXPIRES_KEY = 'session_expires';
const USER_DATA_KEY = 'user_data';

/**
 * Store session token and expiration
 */
export const storeSessionToken = async (sessionToken, expiresIn = 604800) => {
  try {
    const expiresAt = Date.now() + (expiresIn * 1000);
    await AsyncStorage.multiSet([
      [SESSION_TOKEN_KEY, sessionToken],
      [SESSION_EXPIRES_KEY, expiresAt.toString()]
    ]);
    console.log('✅ Session token stored');
  } catch (error) {
    console.error('❌ Error storing session token:', error);
    throw error;
  }
};

/**
 * Get stored session token
 */
export const getStoredSessionToken = async () => {
  try {
    const [token, expiresAt] = await AsyncStorage.multiGet([SESSION_TOKEN_KEY, SESSION_EXPIRES_KEY]);
    
    if (!token[1]) {
      return null;
    }
    
    // Check if token is expired
    const expiryTime = parseInt(expiresAt[1] || '0', 10);
    if (expiryTime < Date.now()) {
      console.log('⚠️ Session token expired');
      await clearSessionToken();
      return null;
    }
    
    return token[1];
  } catch (error) {
    console.error('❌ Error getting session token:', error);
    return null;
  }
};

/**
 * Check if session is valid
 */
export const isSessionValid = async () => {
  try {
    const token = await getStoredSessionToken();
    return token !== null;
  } catch (error) {
    console.error('❌ Error checking session validity:', error);
    return false;
  }
};

/**
 * Clear session token
 */
export const clearSessionToken = async () => {
  try {
    await AsyncStorage.multiRemove([SESSION_TOKEN_KEY, SESSION_EXPIRES_KEY, USER_DATA_KEY]);
    console.log('✅ Session token cleared');
  } catch (error) {
    console.error('❌ Error clearing session token:', error);
  }
};

/**
 * Store user data
 */
export const storeUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    console.log('✅ User data stored');
  } catch (error) {
    console.error('❌ Error storing user data:', error);
  }
};

/**
 * Get stored user data
 */
export const getStoredUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('❌ Error getting user data:', error);
    return null;
  }
};

