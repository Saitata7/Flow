// src/utils/tokenRefresh.js
/**
 * Production-ready token refresh utility for Flow mobile app
 * Handles automatic Firebase token refresh with intelligent timing and error handling
 */

import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_REFRESH_KEY = 'last_token_refresh';
const TOKEN_REFRESH_THRESHOLD = 45 * 60 * 1000; // 45 minutes (Firebase tokens expire in 1 hour)

class TokenRefreshManager {
  constructor() {
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  /**
   * Check if token needs refresh based on last refresh time
   * @returns {Promise<boolean>} - Whether token needs refresh
   */
  async needsRefresh() {
    try {
      const lastRefresh = await AsyncStorage.getItem(TOKEN_REFRESH_KEY);
      if (!lastRefresh) {
        return true; // Never refreshed before
      }

      const timeSinceLastRefresh = Date.now() - parseInt(lastRefresh);
      return timeSinceLastRefresh > TOKEN_REFRESH_THRESHOLD;
    } catch (error) {
      console.error('❌ Error checking refresh need:', error);
      return true; // Default to refresh on error
    }
  }

  /**
   * Get Firebase token with intelligent refresh
   * @param {boolean} forceRefresh - Force refresh regardless of timing
   * @returns {Promise<string|null>} - Firebase ID token or null
   */
  async getToken(forceRefresh = false) {
    try {
      const user = auth().currentUser;
      if (!user) {
        console.log('⚠️ No authenticated user for token retrieval');
        return null;
      }

      // Check if we need to refresh
      const shouldRefresh = forceRefresh || await this.needsRefresh();
      
      if (shouldRefresh) {
        console.log('🔄 Token needs refresh, getting fresh token...');
        const token = await user.getIdToken(true); // Force refresh
        
        // Update last refresh time
        await AsyncStorage.setItem(TOKEN_REFRESH_KEY, Date.now().toString());
        console.log('✅ Token refreshed and cached');
        
        return token;
      } else {
        console.log('✅ Token still valid, using cached token');
        return await user.getIdToken(false); // Use cached token
      }
    } catch (error) {
      console.error('❌ Error getting Firebase token:', error);
      return null;
    }
  }

  /**
   * Refresh token with retry logic
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<string|null>} - Refreshed token or null
   */
  async refreshTokenWithRetry(maxRetries = 3) {
    if (this.isRefreshing && this.refreshPromise) {
      console.log('🔄 Token refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._performRefresh(maxRetries);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh with retry logic
   * @private
   */
  async _performRefresh(maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const user = auth().currentUser;
        if (!user) {
          throw new Error('No authenticated user');
        }

        console.log(`🔄 Token refresh attempt ${attempt}/${maxRetries}`);
        const token = await user.getIdToken(true);
        
        // Update last refresh time
        await AsyncStorage.setItem(TOKEN_REFRESH_KEY, Date.now().toString());
        
        console.log('✅ Token refresh successful');
        return token;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Token refresh attempt ${attempt} failed:`, error.message);
        
        // Don't retry on certain errors
        if (error.code === 'auth/user-not-found' || 
            error.code === 'auth/invalid-credential' ||
            error.code === 'auth/user-disabled') {
          console.log('🚫 Non-retryable error, stopping refresh attempts');
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('❌ All token refresh attempts failed');
    return null;
  }

  /**
   * Clear refresh cache (useful for logout)
   */
  async clearRefreshCache() {
    try {
      await AsyncStorage.removeItem(TOKEN_REFRESH_KEY);
      console.log('✅ Token refresh cache cleared');
    } catch (error) {
      console.error('❌ Error clearing refresh cache:', error);
    }
  }

  /**
   * Get token info for debugging
   * @returns {Promise<object>} - Token information
   */
  async getTokenInfo() {
    try {
      const user = auth().currentUser;
      if (!user) {
        return { error: 'No authenticated user' };
      }

      const token = await user.getIdToken(false);
      const lastRefresh = await AsyncStorage.getItem(TOKEN_REFRESH_KEY);
      
      // Decode token to get expiration
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return {
        tokenLength: token.length,
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        expiresIn: payload.exp - now,
        lastRefresh: lastRefresh ? new Date(parseInt(lastRefresh)).toISOString() : 'Never',
        needsRefresh: await this.needsRefresh(),
        isRefreshing: this.isRefreshing
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Validate token and refresh if needed
   * @returns {Promise<boolean>} - Whether token is valid
   */
  async validateAndRefresh() {
    try {
      const user = auth().currentUser;
      if (!user) {
        return false;
      }

      const token = await user.getIdToken(false);
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token expires in next 5 minutes
      if (payload.exp - now < 300) {
        console.log('🔄 Token expires soon, refreshing...');
        await this.refreshTokenWithRetry();
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new TokenRefreshManager();
