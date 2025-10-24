// services/jwtApiService.js
// Professional JWT API Service
// Handles all API communications with proper JWT authentication

import { getApiBaseUrl } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'jwt_access_token';
const REFRESH_TOKEN_KEY = 'jwt_refresh_token';

class JWTAPIService {
  constructor() {
    try {
      this.baseURL = getApiBaseUrl();
      console.log('🌐 JWT API Service initialized with base URL:', this.baseURL);
    } catch (error) {
      console.error('❌ Error initializing JWT API Service:', error);
      this.baseURL = 'https://flow-api-firebase-891963913698.us-central1.run.app';
    }
  }

  // Token management
  async getStoredTokens() {
    try {
      const [accessToken, refreshToken] = await AsyncStorage.multiGet([TOKEN_KEY, REFRESH_TOKEN_KEY]);
      return {
        accessToken: accessToken[1],
        refreshToken: refreshToken[1]
      };
    } catch (error) {
      console.error('❌ Error getting stored tokens:', error);
      return { accessToken: null, refreshToken: null };
    }
  }

  async getAuthToken() {
    try {
      const { accessToken } = await this.getStoredTokens();
      return accessToken;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  async isUserAuthenticated() {
    try {
      const { accessToken } = await this.getStoredTokens();
      return !!accessToken;
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      return false;
    }
  }

  async waitForAuthReady() {
    // For JWT auth, we don't need to wait for Firebase initialization
    return true;
  }

  async canSync() {
    try {
      const isAuthenticated = await this.isUserAuthenticated();
      return isAuthenticated;
    } catch (error) {
      console.error('❌ Error checking sync capability:', error);
      return false;
    }
  }

  // HTTP request helper
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const token = await this.getAuthToken();
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const config = {
        method: 'GET',
        headers: defaultHeaders,
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      };

      console.log(`🌐 API Request: ${config.method} ${url}`);
      
      // Check if fetch is available
      if (typeof fetch === 'undefined') {
        throw new Error('Fetch is not available');
      }
      
      const response = await fetch(url, config);
      
      // Handle token expiration - only attempt refresh if we have a token
      if (response.status === 401 && token) {
        console.log('⚠️ Token expired, attempting refresh...');
        try {
          await this.refreshToken();
          // Retry the request with new token
          const newToken = await this.getAuthToken();
          if (newToken) {
            config.headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(url, config);
            return await this.handleResponse(retryResponse);
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          // Don't override the original error, let it bubble up
          throw refreshError;
        }
      }
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ API Request error:', error);
      throw error;
    }
  }

  async handleResponse(response) {
    try {
      const data = await response.json();
      
      // For validation errors (400) and conflict errors (409), return the response data instead of throwing
      if (!response.ok && (response.status === 400 || response.status === 409)) {
        return data;
      }
      
      // For other errors, throw as before
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      if (error.name === 'SyntaxError') {
        throw new Error('Invalid response format');
      }
      throw error;
    }
  }

  // Authentication endpoints
  async login(email, password) {
    try {
      console.log('🌐 JWT API Service: Starting login for:', email);
      console.log('🌐 JWT API Service: Base URL:', this.baseURL);
      console.log('🌐 JWT API Service: Making request to:', `${this.baseURL}/v1/auth/login`);
      
      const response = await this.makeRequest('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      console.log('🌐 JWT API Service: Login response:', response);
      return response;
    } catch (error) {
      console.error('❌ JWT API Service: Login error:', error);
      console.error('❌ JWT API Service: Error details:', error.message, error.stack);
      return { success: false, error: error.message };
    }
  }

  async register(registrationData) {
    try {
      console.log('🌐 JWT API Service: Starting registration for:', registrationData.email);
      console.log('🌐 JWT API Service: Base URL:', this.baseURL);
      console.log('🌐 JWT API Service: Making request to:', `${this.baseURL}/v1/auth/register`);
      
      const response = await this.makeRequest('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(registrationData),
      });
      
      console.log('🌐 JWT API Service: Registration response:', response);
      return response;
    } catch (error) {
      console.error('❌ JWT API Service: Registration error:', error);
      console.error('❌ JWT API Service: Error details:', error.message, error.stack);
      return { success: false, error: error.message };
    }
  }

  async logout() {
    return this.makeRequest('/v1/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(refreshToken) {
    try {
      const url = `${this.baseURL}/v1/auth/refresh`;
      const config = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      };

      console.log(`🌐 API Request: ${config.method} ${url}`);
      
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      throw error;
    }
  }

  async forgotPassword(email) {
    return this.makeRequest('/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, password) {
    return this.makeRequest('/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async verifyEmail(token) {
    return this.makeRequest('/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Profile endpoints
  async getProfile() {
    return this.makeRequest('/v1/profile');
  }

  async updateProfile(profileData) {
    return this.makeRequest('/v1/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Flows endpoints
  async getFlows(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/v1/flows?${queryString}` : '/v1/flows';
    return this.makeRequest(endpoint);
  }

  async createFlow(flowData) {
    // Only create cloud flows via API
    if (flowData.storagePreference === 'local') {
      console.log('JWT API Service: Skipping API call for local-only flow');
      return { success: true, data: flowData, message: 'Local flow created' };
    }
    return this.makeRequest('/v1/flows', {
      method: 'POST',
      body: JSON.stringify(flowData),
    });
  }

  async getFlow(flowId) {
    return this.makeRequest(`/v1/flows/${flowId}`);
  }

  async updateFlow(flowId, flowData) {
    return this.makeRequest(`/v1/flows/${flowId}`, {
      method: 'PUT',
      body: JSON.stringify(flowData),
    });
  }

  async deleteFlow(flowId) {
    return this.makeRequest(`/v1/flows/${flowId}`, {
      method: 'DELETE',
    });
  }

  async archiveFlow(flowId) {
    return this.makeRequest(`/v1/flows/${flowId}/archive`, {
      method: 'PATCH',
    });
  }

  // Flow entries endpoints
  async getFlowEntries(flowId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `/v1/flows/${flowId}/entries?${queryString}` 
      : `/v1/flows/${flowId}/entries`;
    return this.makeRequest(endpoint);
  }

  async createFlowEntry(flowId, entryData) {
    return this.makeRequest(`/v1/flows/${flowId}/entries`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  async updateFlowEntry(flowId, entryId, entryData) {
    return this.makeRequest(`/v1/flows/${flowId}/entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
  }

  async deleteFlowEntry(flowId, entryId) {
    return this.makeRequest(`/v1/flows/${flowId}/entries/${entryId}`, {
      method: 'DELETE',
    });
  }

  // Stats endpoints
  async getStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/v1/stats?${queryString}` : '/v1/stats';
    return this.makeRequest(endpoint);
  }

  async getFlowStats(flowId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `/v1/flows/${flowId}/stats?${queryString}` 
      : `/v1/flows/${flowId}/stats`;
    return this.makeRequest(endpoint);
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/health');
  }
}

// Create singleton instance
const jwtApiService = new JWTAPIService();

export default jwtApiService;
