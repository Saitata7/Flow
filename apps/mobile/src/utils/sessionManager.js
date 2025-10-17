// utils/sessionManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { verifyJWTToken } from './jwtAuth';

const SESSION_STORAGE_KEY = 'user_session';
const TOKEN_STORAGE_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

/**
 * Session Manager for handling JWT authentication state persistence
 * Provides secure storage, token validation, and session rehydration
 * 
 * Mobile App Session Strategy:
 * - Sessions last 30 days (standard for mobile apps)
 * - JWT tokens last 7 days and are validated on each request
 * - Users stay logged in until they explicitly sign out
 * - Provides seamless UX without frequent re-authentication
 */
class SessionManager {
  constructor() {
    // Mobile app session settings - much longer for better UX
    this.sessionTimeout = 30 * 24 * 60 * 60 * 1000; // 30 days (mobile app standard)
    this.refreshThreshold = 24 * 60 * 60 * 1000; // 24 hours before expiry (refresh daily)
    this.isRefreshing = false;
  }

  /**
   * Store user session data securely
   * @param {object} userData - User data from JWT authentication
   * @param {string} token - JWT token
   * @returns {Promise<boolean>}
   */
  async storeSession(userData, token) {
    try {
      const sessionData = {
        userData: userData,
        token,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.sessionTimeout,
        lastTokenRefresh: Date.now(), // Track when token was last refreshed
      };

      // Validate JWT token
      if (token && !verifyJWTToken(token)) {
        console.error('Invalid JWT token provided');
        return false;
      }

      // Store in SecureStore for sensitive data
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
      
      // Only store token if it exists
      if (token) {
        await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
      }
      
      // Store session metadata in AsyncStorage
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        timestamp: sessionData.timestamp,
        expiresAt: sessionData.expiresAt,
        userId: userData.id || userData.uid,
      }));

      console.log('✅ Session stored successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to store session:', error);
      return false;
    }
  }

  /**
   * Retrieve and validate stored session
   * @returns {Promise<object|null>}
   */
  async getStoredSession() {
    try {
      // Check if session exists
      const sessionMeta = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionMeta) {
        console.log('No session metadata found');
        return null;
      }

      const { timestamp, expiresAt, userId } = JSON.parse(sessionMeta);
      
      // Check if session is expired
      if (Date.now() > expiresAt) {
        console.log('Session expired, clearing stored data');
        await this.clearSession();
        return null;
      }

      // Retrieve user data and token
      const userDataStr = await SecureStore.getItemAsync(USER_DATA_KEY);
      const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);

      if (!userDataStr) {
        console.log('Missing user data');
        await this.clearSession();
        return null;
      }

      const userData = JSON.parse(userDataStr);
      
      // Validate JWT token only if it exists
      if (token) {
        if (!verifyJWTToken(token)) {
          console.log('Invalid stored JWT token');
          await this.clearSession();
          return null;
        }
      }

      console.log('✅ Session retrieved successfully');
      return { userData, token, timestamp, expiresAt };
    } catch (error) {
      console.error('❌ Failed to retrieve session:', error);
      await this.clearSession();
      return null;
    }
  }

  /**
   * Check if JWT token needs refresh
   * @returns {Promise<string|null>}
   */
  async refreshTokenIfNeeded() {
    try {
      if (this.isRefreshing) {
        console.log('Token refresh already in progress');
        return null;
      }

      // Get current token
      const currentToken = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      if (!currentToken) {
        console.log('No current JWT token for refresh');
        return null;
      }

      // Check if token is still valid
      if (verifyJWTToken(currentToken)) {
        console.log('JWT token still valid, no refresh needed');
        return currentToken;
      }

      // Token is expired, user needs to login again
      console.log('🔄 JWT token expired, user needs to login again');
      await this.clearSession();
      return null;
    } catch (error) {
      this.isRefreshing = false;
      console.error('❌ Token refresh check failed:', error);
      return null;
    }
  }

  /**
   * Clear all stored session data
   * @returns {Promise<void>}
   */
  async clearSession() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(USER_DATA_KEY),
        SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY),
        AsyncStorage.removeItem(SESSION_STORAGE_KEY),
      ]);
      console.log('✅ Session cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
    }
  }

  /**
   * Check if session is valid and not expired
   * @returns {Promise<boolean>}
   */
  async isSessionValid() {
    try {
      const sessionMeta = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionMeta) return false;

      const { expiresAt } = JSON.parse(sessionMeta);
      return Date.now() < expiresAt;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  /**
   * Get current stored token
   * @returns {Promise<string|null>}
   */
  async getCurrentToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('Error getting current token:', error);
      return null;
    }
  }




  /**
   * Initialize session manager and restore state
   * @returns {Promise<object>}
   */
  async initialize() {
    try {
      console.log('🔄 Initializing session manager...');
      
      // Check for valid user session
      const userSession = await this.getStoredSession();
      if (userSession) {
        console.log('✅ User session restored');
        return {
          type: 'user',
          data: userSession,
        };
      }

      console.log('No existing session found');
      return {
        type: 'none',
        data: null,
      };
    } catch (error) {
      console.error('❌ Session manager initialization failed:', error);
      return {
        type: 'error',
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Handle app state changes for session management
   * @param {string} appState - 'active', 'background', 'inactive'
   */
  async handleAppStateChange(appState) {
    try {
      if (appState === 'active') {
        // App became active, check session validity
        const isValid = await this.isSessionValid();
        if (!isValid) {
          console.log('Session invalid on app resume, clearing...');
          await this.clearSession();
        } else {
          // Refresh token if needed
          await this.refreshTokenIfNeeded();
        }
      } else if (appState === 'background') {
        // App went to background, update session timestamp
        const sessionMeta = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (sessionMeta) {
          const session = JSON.parse(sessionMeta);
          session.lastBackgroundTime = Date.now();
          await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        }
      }
    } catch (error) {
      console.error('Error handling app state change:', error);
    }
  }
}

// Export singleton instance
export default new SessionManager();
