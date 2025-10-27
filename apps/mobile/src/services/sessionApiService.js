// services/sessionApiService.js
// Session-based API Service for flows
// Uses session tokens instead of JWT tokens

import api from './apiClient';
import { getStoredSessionToken } from '../utils/sessionAuth';

class SessionAPIService {
  constructor() {
    console.log('🌐 Session API Service initialized');
  }

  // Check if user can sync (has session token)
  async canSync() {
    try {
      const sessionToken = await getStoredSessionToken();
      return !!sessionToken;
    } catch (error) {
      console.error('❌ Error checking sync capability:', error);
      return false;
    }
  }

  // Check if user is authenticated
  async isUserAuthenticated() {
    try {
      const sessionToken = await getStoredSessionToken();
      return !!sessionToken;
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      return false;
    }
  }

  // Debug auth state
  async debugAuthState() {
    try {
      const sessionToken = await getStoredSessionToken();
      return {
        hasSessionToken: !!sessionToken,
        sessionTokenPreview: sessionToken ? sessionToken.substring(0, 20) + '...' : null
      };
    } catch (error) {
      console.error('❌ Error debugging auth state:', error);
      return { hasSessionToken: false, error: error.message };
    }
  }

  // Get flows from server
  async getFlows() {
    try {
      const response = await api.get('/v1/flows');
      return response.data;
    } catch (error) {
      console.error('❌ Error getting flows:', error);
      throw error;
    }
  }

  // Create a flow on server
  async createFlow(flowData) {
    try {
      // Check if user has session token before making API call
      const sessionToken = await getStoredSessionToken();
      if (!sessionToken) {
        console.warn('⚠️ No session token, cannot create flow via API');
        // Return a failure object instead of throwing
        return { success: false, error: 'Not authenticated' };
      }
      
      console.log('📤 Creating flow via API:', flowData.title);
      const response = await api.post('/v1/flows', flowData);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Error creating flow via API:', error.message);
      // Return failure object instead of throwing - let the caller decide what to do
      return { success: false, error: error.message, code: error.code, status: error.status };
    }
  }

  // Update a flow on server
  async updateFlow(flowId, flowData) {
    try {
      const response = await api.put(`/v1/flows/${flowId}`, flowData);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating flow:', error);
      throw error;
    }
  }

  // Delete a flow on server
  async deleteFlow(flowId) {
    try {
      const response = await api.delete(`/v1/flows/${flowId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting flow:', error);
      throw error;
    }
  }

  // Add to sync queue (for offline-first architecture)
  async addToSyncQueue(operation) {
    try {
      // In a production app, you might have a proper sync queue table
      // For now, we'll just log it
      console.log('📝 Queued sync operation:', operation.type, operation.flowId || operation.data?.id);
      
      // Store in AsyncStorage for offline sync
      const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
      const existingQueue = await AsyncStorage.getItem('sync_queue');
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      queue.push({
        ...operation,
        timestamp: new Date().toISOString()
      });
      await AsyncStorage.setItem('sync_queue', JSON.stringify(queue));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error adding to sync queue:', error);
      return { success: false, error: error.message };
    }
  }

  // Dummy method for compatibility with jwtApiService interface
  async refreshToken() {
    console.log('⚠️ refreshToken called but session tokens don\'t refresh');
    // Session tokens don't need refresh, just return
    return { success: true };
  }

  // Register user
  async register(registrationData) {
    try {
      const response = await api.post('/v1/auth/register', registrationData);
      return response.data;
    } catch (error) {
      console.error('❌ Error registering:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      const response = await api.post('/v1/auth/logout');
      return response.data;
    } catch (error) {
      console.error('❌ Error logging out:', error);
      // Always return success even if API fails - logout should succeed locally
      return { success: true };
    }
  }

  // Get profile
  async getProfile() {
    try {
      const response = await api.get('/v1/profile');
      return response.data;
    } catch (error) {
      console.error('❌ Error getting profile:', error);
      throw error;
    }
  }

  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/v1/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post('/v1/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('❌ Error requesting password reset:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token, password) {
    try {
      const response = await api.post('/v1/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await api.post('/v1/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      console.error('❌ Error verifying email:', error);
      throw error;
    }
  }
}

const sessionApiService = new SessionAPIService();
export default sessionApiService;

