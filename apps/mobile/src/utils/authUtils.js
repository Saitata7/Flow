// src/utils/authUtils.js
/**
 * Production-ready authentication utilities for Flow mobile app
 * Provides Firebase auth state management, token validation, and user session handling
 */

import auth from '@react-native-firebase/auth';
import { handleAuthError } from './errorHandler';

/**
 * Get current Firebase user
 * @returns {object|null} - Current Firebase user or null
 */
export const getCurrentUser = () => {
  return auth().currentUser;
};

/**
 * Check if user is authenticated
 * @returns {boolean} - Whether user is authenticated
 */
export const isAuthenticated = () => {
  const user = getCurrentUser();
  return user !== null && !user.isAnonymous;
};

/**
 * Get Firebase ID token with automatic refresh
 * @param {boolean} forceRefresh - Whether to force token refresh
 * @returns {Promise<string|null>} - Firebase ID token or null
 */
export const getFirebaseToken = async (forceRefresh = false) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('⚠️ No authenticated user for token retrieval');
      return null;
    }

    const token = await user.getIdToken(forceRefresh);
    console.log('✅ Firebase token retrieved successfully');
    return token;
  } catch (error) {
    console.error('❌ Error getting Firebase token:', error);
    return null;
  }
};

/**
 * Validate Firebase token
 * @param {string} token - Firebase ID token to validate
 * @returns {Promise<boolean>} - Whether token is valid
 */
export const validateFirebaseToken = async (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp < now) {
      console.log('⚠️ Token expired');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error validating token:', error);
    return false;
  }
};

/**
 * Set up authentication state listener
 * @param {function} onAuthChange - Callback for auth state changes
 * @returns {function} - Unsubscribe function
 */
export const setupAuthListener = (onAuthChange) => {
  return auth().onAuthStateChanged((user) => {
    console.log('🔍 Auth state changed:', {
      isAuthenticated: !!user,
      uid: user?.uid,
      email: user?.email,
      isAnonymous: user?.isAnonymous
    });
    
    onAuthChange(user);
  });
};

/**
 * Handle authentication errors
 * @param {object} error - Authentication error
 * @returns {object} - Processed error information
 */
export const handleAuthenticationError = (error) => {
  return handleAuthError(error);
};

/**
 * Check if user needs to re-authenticate
 * @returns {Promise<boolean>} - Whether user needs re-authentication
 */
export const needsReAuthentication = async () => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return true;
    }

    // Check if token is expired or will expire soon
    const token = await getFirebaseToken();
    if (!token) {
      return true;
    }

    const isValid = await validateFirebaseToken(token);
    return !isValid;
  } catch (error) {
    console.error('❌ Error checking re-authentication need:', error);
    return true;
  }
};

/**
 * Get user profile information
 * @returns {object|null} - User profile data or null
 */
export const getUserProfile = () => {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    metadata: {
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime
    }
  };
};

/**
 * Check if user has verified email
 * @returns {boolean} - Whether user email is verified
 */
export const isEmailVerified = () => {
  const user = getCurrentUser();
  return user?.emailVerified || false;
};

/**
 * Get authentication state summary
 * @returns {object} - Authentication state information
 */
export const getAuthState = () => {
  const user = getCurrentUser();
  
  return {
    isAuthenticated: !!user && !user.isAnonymous,
    isAnonymous: user?.isAnonymous || false,
    isEmailVerified: user?.emailVerified || false,
    user: user ? getUserProfile() : null,
    needsReAuth: false // This would be set by needsReAuthentication()
  };
};

/**
 * Validate user session
 * @returns {Promise<object>} - Session validation result
 */
export const validateUserSession = async () => {
  try {
    const user = getCurrentUser();
    
    if (!user) {
      return {
        valid: false,
        reason: 'no_user',
        message: 'No user logged in'
      };
    }

    if (user.isAnonymous) {
      return {
        valid: false,
        reason: 'anonymous_user',
        message: 'User is anonymous'
      };
    }

    const token = await getFirebaseToken();
    if (!token) {
      return {
        valid: false,
        reason: 'no_token',
        message: 'No valid token available'
      };
    }

    const isValid = await validateFirebaseToken(token);
    if (!isValid) {
      return {
        valid: false,
        reason: 'invalid_token',
        message: 'Token is invalid or expired'
      };
    }

    return {
      valid: true,
      reason: 'valid_session',
      message: 'User session is valid'
    };
  } catch (error) {
    console.error('❌ Error validating user session:', error);
    return {
      valid: false,
      reason: 'validation_error',
      message: 'Error validating session'
    };
  }
};