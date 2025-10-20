// src/services/authService.js
/**
 * Authentication Service for Flow Mobile App
 * Handles login, logout, and session management
 */

import api from './apiClient';
import { storeJWTToken, clearJWTToken, getStoredJWTToken } from '../utils/jwtAuth';
import { handleAuthError, isAuthError, getAuthErrorMessage } from '../utils/authErrorHandler';

class AuthService {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.currentToken = null;
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password (not used in simple login)
   * @returns {Promise<object>} Login result
   */
  async login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await api.post('/v1/auth/login', {
        email,
        name: email.split('@')[0] // Use email prefix as default name, ignore password
      });

      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Store token securely
        await storeJWTToken(token);
        
        // Update service state
        this.currentToken = token;
        this.currentUser = user;
        this.isAuthenticated = true;
        
        console.log('✅ Login successful for:', user.name);
        
        return {
          success: true,
          user,
          token,
          message: 'Login successful'
        };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      
      // Handle auth errors
      if (isAuthError(error)) {
        await handleAuthError(error);
      }
      
      return {
        success: false,
        error: getAuthErrorMessage(error),
        message: 'Login failed'
      };
    }
  }

  /**
   * Logout user and clear session
   * @returns {Promise<object>} Logout result
   */
  async logout() {
    try {
      console.log('🔐 Logging out user');
      
      // Clear stored token
      await clearJWTToken();
      
      // Update service state
      this.currentToken = null;
      this.currentUser = null;
      this.isAuthenticated = false;
      
      console.log('✅ Logout successful');
      
      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      console.error('❌ Logout failed:', error.message);
      
      // Even if logout fails, clear local state
      this.currentToken = null;
      this.currentUser = null;
      this.isAuthenticated = false;
      
      return {
        success: false,
        error: error.message,
        message: 'Logout failed'
      };
    }
  }

  /**
   * Verify JWT token with backend
   * @returns {Promise<object>} Verification result
   */
  async verifyToken() {
    try {
      const token = await getStoredJWTToken();
      
      if (!token) {
        return {
          success: false,
          error: 'No token found',
          message: 'No authentication token available'
        };
      }

      // Verify token with server
      const response = await api.post('/v1/auth/verify', { token });
      
      if (response.data.success && response.data.data.valid) {
        this.isAuthenticated = true;
        this.currentUser = response.data.data.user;
        this.currentToken = token;
        
        return {
          success: true,
          user: response.data.data.user,
          message: 'Token verified successfully'
        };
      } else {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.currentToken = null;
        
        return {
          success: false,
          error: 'Token verification failed',
          message: 'Invalid or expired token'
        };
      }
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      
      this.isAuthenticated = false;
      this.currentUser = null;
      this.currentToken = null;
      
      return {
        success: false,
        error: error.message,
        message: 'Token verification failed'
      };
    }
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} Authentication status
   */
  async checkAuthStatus() {
    try {
      const token = await getStoredJWTToken();
      
      if (!token) {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.currentToken = null;
        return false;
      }

      // Verify token with server
      const response = await api.post('/v1/auth/verify', { token });
      
      if (response.data.success && response.data.data.valid) {
        this.isAuthenticated = true;
        this.currentUser = response.data.data.user;
        this.currentToken = token;
        return true;
      } else {
        // Token is invalid, clear it
        await this.logout();
        return false;
      }
    } catch (error) {
      console.error('❌ Auth status check failed:', error.message);
      
      // Handle auth errors
      if (isAuthError(error)) {
        await handleAuthError(error);
      }
      
      this.isAuthenticated = false;
      this.currentUser = null;
      this.currentToken = null;
      return false;
    }
  }

  /**
   * Get current user
   * @returns {object|null} Current user or null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get current token
   * @returns {string|null} Current token or null
   */
  getCurrentToken() {
    return this.currentToken;
  }

  /**
   * Check if user is authenticated (synchronous)
   * @returns {boolean} Authentication status
   */
  isLoggedIn() {
    return this.isAuthenticated;
  }

  /**
   * Handle API errors gracefully
   * @param {Error} error - The API error
   * @returns {Promise<object>} Error handling result
   */
  async handleApiError(error) {
    console.log('🔍 Handling API error:', error.message);
    
    if (isAuthError(error)) {
      console.log('🔄 Authentication error detected, clearing session...');
      
      // Clear session
      await this.logout();
      
      return {
        handled: true,
        message: getAuthErrorMessage(error),
        action: 'LOGIN_REQUIRED'
      };
    }
    
    return {
      handled: false,
      message: getAuthErrorMessage(error)
    };
  }

  /**
   * Register new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} displayName - User display name
   * @returns {Promise<object>} Registration result
   */
  async register(email, password, displayName = null) {
    try {
      console.log('🔐 Attempting registration for:', email);
      
      const response = await api.post('/v1/auth/register', {
        email,
        password,
        name: displayName || email.split('@')[0]
      });

      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Store token securely
        await storeJWTToken(token);
        
        // Update service state
        this.currentToken = token;
        this.currentUser = user;
        this.isAuthenticated = true;
        
        console.log('✅ Registration successful for:', user.name);
        
        return {
          success: true,
          user,
          token,
          message: 'Registration successful'
        };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      
      // Handle auth errors
      if (isAuthError(error)) {
        await handleAuthError(error);
      }
      
      return {
        success: false,
        error: getAuthErrorMessage(error),
        message: 'Registration failed'
      };
    }
  }

  /**
   * Reset password for user
   * @param {string} email - User email
   * @returns {Promise<object>} Password reset result
   */
  async resetPassword(email) {
    try {
      console.log('🔐 Attempting password reset for:', email);
      
      const response = await api.post('/v1/auth/reset-password', {
        email
      });

      if (response.data.success) {
        console.log('✅ Password reset email sent successfully');
        
        return {
          success: true,
          message: response.data.message || 'Password reset email sent successfully'
        };
      } else {
        throw new Error(response.data.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('❌ Password reset failed:', error.message);
      
      // Handle auth errors
      if (isAuthError(error)) {
        await handleAuthError(error);
      }
      
      return {
        success: false,
        error: getAuthErrorMessage(error),
        message: 'Password reset failed'
      };
    }
  }
}

// Export singleton instance
export default new AuthService();