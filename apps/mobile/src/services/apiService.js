// services/apiService.js
// Centralized API service for Flow mobile app
// Handles authenticated requests, sync endpoints, and offline-first architecture

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import auth, { getApp } from '@react-native-firebase/auth';
import apiClient from './apiClient'; // Use the new auto-refresh API client
import { config } from '../config/environment';
import logger from '../utils/logger';

// API Configuration
const API_CONFIG = {
  baseURL: config.API_BASE_URL,  // Use environment configuration
  timeout: 30000,  // Increased timeout to 30 seconds
  retryAttempts: 3,
  retryDelay: 1000,
  // Dev token for development testing only
  DEV_TOKEN: 'dev-token',
};

// Storage keys for offline data
const STORAGE_KEYS = {
  PENDING_SYNC: 'pending_sync_queue',
  LAST_SYNC: 'last_sync_timestamp',
  USER_SETTINGS: 'user_settings',
  SYNC_ENABLED: 'sync_enabled',
};

class ApiService {
  constructor() {
    this.client = null;
    this.isOnline = false;
    this.syncQueue = [];
    this.lastSyncTime = null;
    this.syncEnabled = true;
    this.retryCount = 0;
    
    this.initializeClient();
    this.setupNetworkListener();
    this.loadSyncSettings();
  }

  /**
   * Initialize axios client with interceptors
   */
  initializeClient() {
    logger.log('🌐 Initializing API client with baseURL:', API_CONFIG.baseURL);
    logger.log('🌐 Environment:', __DEV__ ? 'DEVELOPMENT' : 'PRODUCTION');
    
    // Use the validated apiClient instead of creating our own
    this.client = apiClient;

    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        logger.log('🚀 Making API request to:', config.url);
        logger.log('🚀 Full URL:', config.baseURL + config.url);
        
        try {
          // Get JWT auth token
          const token = await this.getAuthToken(false);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            logger.log('✅ API Request: Added JWT auth token:', token.substring(0, 10) + '...');
          } else {
            logger.log('ℹ️ API Request: No JWT auth token available - skipping auth token');
            // Don't cancel the request, just skip adding auth token
            return config;
          }
        } catch (error) {
          logger.error('❌ Error getting auth token:', error);
          // Don't cancel the request, just skip adding auth token
          logger.log('ℹ️ API Request: Skipping auth token due to error, continuing with request');
          return config;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors and retries
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Don't log CanceledError as it's expected behavior when not authenticated
        if (error.name === 'CanceledError') {
          return Promise.reject(error);
        }
        
        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !error.config._retry) {
          logger.log('🔄 401 error detected, attempting token refresh...');
          try {
            const refreshedToken = await this.getAuthToken(true);
            if (refreshedToken) {
              logger.log('✅ Token refreshed successfully, retrying request');
              error.config.headers.Authorization = `Bearer ${refreshedToken}`;
              error.config._retry = true;
              return this.client.request(error.config);
            } else {
              logger.log('ℹ️ Token refresh failed - user not authenticated (expected)');
              // Don't treat this as an error if user is not authenticated
              const cancelError = new Error('Request canceled - user not authenticated');
              cancelError.name = 'CanceledError';
              cancelError.code = 'CANCELED';
              return Promise.reject(cancelError);
            }
          } catch (refreshError) {
            logger.log('ℹ️ Token refresh failed - user not authenticated (expected)');
            const cancelError = new Error('Request canceled - user not authenticated');
            cancelError.name = 'CanceledError';
            cancelError.code = 'CANCELED';
            return Promise.reject(cancelError);
          }
        }
        
        if (this.shouldRetry(error)) {
          return this.retryRequest(error.config);
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Test API connection and token validation
   */
  async testApiConnection() {
    try {
      logger.log('🧪 Testing API connection...');
      const token = await this.getAuthToken(false);
      if (!token) {
        logger.log('❌ No token available for API test');
        return { success: false, error: 'No authentication token' };
      }

      const response = await this.client.get('/health');
      logger.log('✅ API connection test successful:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('❌ API connection test failed:', error);
      return { 
        success: false, 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      return !!token;
    } catch (error) {
      logger.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Setup network connectivity listener
   */
  setupNetworkListener() {
    NetInfo.addEventListener(async (state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      if (!wasOnline && this.isOnline) {
        logger.log('🌐 Network connected - checking if sync is possible');
        // Only trigger sync if user is authenticated
        if (await this.canSync()) {
          logger.log('🌐 Network connected - triggering sync');
          this.triggerSync();
        } else {
          logger.log('🌐 Network connected - sync skipped (not authenticated)');
        }
      } else if (wasOnline && !this.isOnline) {
        logger.log('📱 Network disconnected - switching to offline mode');
      }
    });
  }

  /**
   * Load sync settings from storage
   */
  async loadSyncSettings() {
    try {
      const [syncEnabled, lastSync] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SYNC_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);
      
      this.syncEnabled = syncEnabled !== 'false';
      this.lastSyncTime = lastSync ? new Date(lastSync) : null;
      
      logger.log('📱 Sync settings loaded:', { 
        enabled: this.syncEnabled, 
        lastSync: this.lastSyncTime 
      });
    } catch (error) {
      logger.error('Error loading sync settings:', error);
    }
  }

  /**
   * Debug authentication state
   */
  async debugAuthState() {
    logger.log('🔍 === AUTHENTICATION DEBUG ===');
    
    try {
      const currentUser = auth().currentUser;
      logger.log('🔍 Firebase currentUser:', currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified
      } : 'null');
      
      const token = await this.getAuthToken();
      logger.log('🔍 Auth token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      const isAuth = await this.isUserAuthenticated();
      logger.log('🔍 Is authenticated:', isAuth);
      
      logger.log('🔍 === END AUTH DEBUG ===');
      
      return {
        hasFirebaseUser: !!currentUser,
        hasToken: !!token,
        isAuthenticated: isAuth
      };
    } catch (error) {
      logger.error('🔍 Auth debug error:', error);
      return {
        hasFirebaseUser: false,
        hasToken: false,
        isAuthenticated: false,
        error: error.message
      };
    }
  }

  /**
   * Check if user is properly authenticated
   */
  async isUserAuthenticated() {
    try {
      logger.log('🔍 === FIREBASE AUTHENTICATION CHECK START ===');
      
      // Check if we have a Firebase user
      const currentUser = auth().currentUser;
      if (!currentUser) {
        logger.log('❌ Firebase Authentication check: No Firebase user');
        logger.log('❌ SOLUTION: User must login with Firebase authentication');
        return false;
      }

      logger.log('✅ Firebase user found:', currentUser.uid);
      
      // Check if we can get a Firebase token
      const token = await this.getAuthToken();
      if (!token) {
        logger.log('❌ Firebase Authentication check: Cannot get Firebase token');
        return false;
      }

      logger.log('✅ Firebase token available, length:', token.length);
      logger.log('✅ Firebase Authentication check: PASSED');
      logger.log('🔍 === FIREBASE AUTHENTICATION CHECK END ===');
      return true;
    } catch (error) {
      logger.error('❌ Firebase Authentication check error:', error);
      return false;
    }
  }

  /**
   * Wait for Firebase authentication to be ready
   */
  async waitForAuthReady() {
    try {
      // Check if Firebase user is available
      const currentUser = auth().currentUser;
      if (currentUser) {
        logger.log('🔍 Firebase user available');
        return { id: currentUser.uid, email: currentUser.email };
      } else {
        logger.log('🔍 No Firebase user available');
        return null;
      }
    } catch (error) {
      logger.error('Error waiting for auth ready:', error);
      return null;
    }
  }

  /**
   * Get authentication token from Firebase Auth
   */
  async getAuthToken(forceRefresh = false) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        logger.log('ℹ️ No Firebase user found');
        return null;
      }

      logger.log('✅ Firebase user found:', currentUser.uid);
      
      // Get Firebase ID token
      const token = await currentUser.getIdToken(forceRefresh);
      logger.log('✅ Firebase token retrieved successfully, length:', token.length);
      logger.log('✅ Token preview:', token.substring(0, 20) + '...');
      
      return token;
    } catch (error) {
      logger.error('❌ Error getting Firebase token:', error);
      return null;
    }
  }

  /**
   * Check if request should be retried
   */
  shouldRetry(error) {
    if (this.retryCount >= API_CONFIG.retryAttempts) {
      return false;
    }

    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT'];
    
    return (
      retryableStatuses.includes(error.response?.status) ||
      retryableErrors.includes(error.code) ||
      error.message.includes('Network Error')
    );
  }

  /**
   * Retry failed request with exponential backoff
   */
  async retryRequest(config) {
    this.retryCount++;
    const delay = API_CONFIG.retryDelay * Math.pow(2, this.retryCount - 1);
    
    logger.log(`🔄 Retrying request (attempt ${this.retryCount}/${API_CONFIG.retryAttempts}) in ${delay}ms`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.client.request(config);
  }

  /**
   * Handle API errors with user-friendly messages
   */
  handleError(error) {
    logger.log('🔍 Full error details:', {
      message: error.message,
      code: error.code,
      request: error.request,
      response: error.response,
      config: error.config,
      stack: error.stack
    });
    
    const errorResponse = {
      message: 'An error occurred',
      code: error.code || 'UNKNOWN_ERROR',
      status: error.response?.status,
      data: error.response?.data,
    };

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          errorResponse.message = 'Authentication required';
          errorResponse.code = 'UNAUTHORIZED';
          break;
        case 403:
          errorResponse.message = 'Access denied';
          errorResponse.code = 'FORBIDDEN';
          break;
        case 404:
          errorResponse.message = 'Resource not found';
          errorResponse.code = 'NOT_FOUND';
          break;
        case 422:
          errorResponse.message = data?.message || 'Validation error';
          errorResponse.code = 'VALIDATION_ERROR';
          break;
        case 429:
          errorResponse.message = 'Too many requests';
          errorResponse.code = 'RATE_LIMITED';
          break;
        case 500:
          errorResponse.message = 'Server error';
          errorResponse.code = 'SERVER_ERROR';
          break;
        default:
          errorResponse.message = data?.message || 'Request failed';
      }
    } else if (error.request) {
      // Network error
      errorResponse.message = 'Network error - please check your connection';
      errorResponse.code = 'NETWORK_ERROR';
    } else {
      // Other error
      if (error.message === 'No authentication token available' || error.message === 'Request canceled - no authentication token') {
        errorResponse.message = 'User not authenticated';
        errorResponse.code = 'NOT_AUTHENTICATED';
      } else if (error.code === 'CANCELED') {
        errorResponse.message = 'Request canceled - no authentication';
        errorResponse.code = 'CANCELED';
      } else {
        errorResponse.message = error.message || 'Unknown error occurred';
      }
    }

    return errorResponse;
  }

  /**
   * Enable/disable cloud sync
   */
  async setSyncEnabled(enabled) {
    this.syncEnabled = enabled;
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_ENABLED, enabled.toString());
    
    if (enabled && this.isOnline) {
      logger.log('🔄 Sync enabled - checking if sync is possible');
      // Only trigger sync if user is authenticated
      if (await this.canSync()) {
        logger.log('🔄 Sync enabled - triggering sync');
        this.triggerSync();
      } else {
        logger.log('🔄 Sync enabled - sync skipped (not authenticated)');
      }
    }
  }

  /**
   * Check if sync is enabled and user is authenticated
   */
  async canSync() {
    // Wait for Firebase auth to be ready
    await this.waitForAuthReady();
    
    const token = await this.getAuthToken();
    const canSyncResult = this.syncEnabled && this.isOnline && !!token;
    
    logger.log('🔍 ApiService.canSync() detailed check:', {
      syncEnabled: this.syncEnabled,
      isOnline: this.isOnline,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
      canSync: canSyncResult
    });
    
    return canSyncResult;
  }

  /**
   * Add operation to sync queue
   */
  async addToSyncQueue(operation) {
    try {
      const queue = await this.getSyncQueue();
      queue.push({
        ...operation,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        retryCount: 0,
      });
      
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(queue));
      logger.log('📝 Added to sync queue:', operation.type);
      
      // Trigger sync if online
      if (await this.canSync()) {
        this.triggerSync();
      }
    } catch (error) {
      logger.error('Error adding to sync queue:', error);
    }
  }

  /**
   * Get pending sync queue
   */
  async getSyncQueue() {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      logger.error('Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
      logger.log('🧹 Sync queue cleared');
    } catch (error) {
      logger.error('Error clearing sync queue:', error);
    }
  }

  /**
   * Trigger sync process
   */
  async triggerSync() {
    if (!(await this.canSync())) {
      logger.log('⏸️ Sync skipped - not online or disabled');
      return;
    }

    try {
      logger.log('🔄 Starting sync process...');
      
      // Process sync queue
      await this.processSyncQueue();
      
      // Pull latest data from server
      await this.pullLatestData();
      
      // Update last sync time
      this.lastSyncTime = new Date();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime.toISOString());
      
      logger.log('✅ Sync completed successfully');
    } catch (error) {
      logger.error('❌ Sync failed:', error);
    }
  }

  /**
   * Process pending sync queue
   */
  async processSyncQueue() {
    const queue = await this.getSyncQueue();
    if (queue.length === 0) return;

    logger.log(`📤 Processing ${queue.length} pending operations...`);

    for (const operation of queue) {
      try {
        await this.executeSyncOperation(operation);
        
        // Remove successful operation from queue
        const updatedQueue = queue.filter(op => op.id !== operation.id);
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(updatedQueue));
        
        logger.log(`✅ Synced operation: ${operation.type}`);
      } catch (error) {
        logger.error(`❌ Failed to sync operation ${operation.type}:`, error);
        
        // Increment retry count
        operation.retryCount = (operation.retryCount || 0) + 1;
        
        // Remove from queue if max retries exceeded
        if (operation.retryCount >= 3) {
          const updatedQueue = queue.filter(op => op.id !== operation.id);
          await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(updatedQueue));
          logger.log(`🗑️ Removed failed operation after max retries: ${operation.type}`);
        }
      }
    }
  }

  /**
   * Execute individual sync operation
   */
  async executeSyncOperation(operation) {
    const { type, data, flowId, entryId } = operation;

    switch (type) {
      case 'CREATE_FLOW':
        await this.createFlow(data);
        break;
      case 'UPDATE_FLOW':
        await this.updateFlow(flowId, data);
        break;
      case 'DELETE_FLOW':
        await this.deleteFlow(flowId);
        break;
      case 'CREATE_ENTRY':
        await this.createFlowEntry(data);
        break;
      case 'UPDATE_ENTRY':
        await this.updateFlowEntry(entryId, data);
        break;
      case 'DELETE_ENTRY':
        await this.deleteFlowEntry(entryId);
        break;
      default:
        throw new Error(`Unknown sync operation: ${type}`);
    }
  }

  /**
   * Pull latest data from server
   */
  async pullLatestData() {
    try {
      logger.log('📥 Pulling latest data from server...');
      
      // Get flows
      const flowsResponse = await this.getFlows();
      if (flowsResponse.success) {
        // Update local storage with server data
        await AsyncStorage.setItem('flows', JSON.stringify(flowsResponse.data));
        logger.log(`📥 Synced ${flowsResponse.data.length} flows from server`);
      }
      
      // Get flow entries for last 30 days
      const entriesResponse = await this.getFlowEntries({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });
      
      if (entriesResponse.success) {
        // Merge entries with local flows
        await this.mergeFlowEntries(entriesResponse.data);
        logger.log(`📥 Synced ${entriesResponse.data.length} flow entries from server`);
      }
      
    } catch (error) {
      logger.error('Error pulling latest data:', error);
    }
  }

  /**
   * Merge flow entries from server with local flows
   */
  async mergeFlowEntries(serverEntries) {
    try {
      const localFlows = await AsyncStorage.getItem('flows');
      if (!localFlows) return;

      const flows = JSON.parse(localFlows);
      
      // Group entries by flow ID
      const entriesByFlow = {};
      serverEntries.forEach(entry => {
        if (!entriesByFlow[entry.flowId]) {
          entriesByFlow[entry.flowId] = {};
        }
        entriesByFlow[entry.flowId][entry.date] = entry;
      });

      // Merge entries into flows
      flows.forEach(flow => {
        if (entriesByFlow[flow.id]) {
          flow.status = { ...flow.status, ...entriesByFlow[flow.id] };
        }
      });

      await AsyncStorage.setItem('flows', JSON.stringify(flows));
    } catch (error) {
      logger.error('Error merging flow entries:', error);
    }
  }

  // ==================== FLOW OPERATIONS ====================

  /**
   * Get user's flows
   */
  async getFlows(params = {}) {
    try {
      // Check authentication before making the request
      const isAuthenticated = await this.isUserAuthenticated();
      if (!isAuthenticated) {
        logger.log('❌ getFlows: User not authenticated, skipping API call');
        logger.log('ℹ️ This is expected if user just logged in and auth state is still updating');
        return { 
          success: false, 
          error: { 
            message: 'Please login to access your flows', 
            code: 'NOT_AUTHENTICATED',
            action: 'LOGIN_REQUIRED'
          } 
        };
      }

      logger.log('✅ getFlows: User authenticated, making API call');
      
      // Try a simple test request first
      logger.log('🧪 Testing API connection...');
      try {
        const testResponse = await this.client.get('/health', { timeout: 5000 });
        logger.log('✅ Health check successful:', testResponse.status);
      } catch (testError) {
        logger.log('❌ Health check failed:', testError.message);
        logger.log('ℹ️ Continuing with flows request anyway...');
      }
      
      // Add cache-busting parameter to ensure fresh data
      const cacheBustParams = {
        ...params,
        _t: Date.now(), // Timestamp to bust cache
      };
      
      const response = await this.client.get('/v1/flows', { params: cacheBustParams });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      logger.error('Error getting flows:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Create a new flow
   */
  async createFlow(flowData) {
    try {
      const response = await this.client.post('/v1/flows', flowData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error creating flow:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Update flow
   */
  async updateFlow(flowId, updates) {
    try {
      const response = await this.client.put(`/v1/flows/${flowId}`, updates);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error updating flow:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Delete flow
   */
  async deleteFlow(flowId) {
    try {
      const response = await this.client.delete(`/v1/flows/${flowId}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error deleting flow:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Get flow by ID
   */
  async getFlow(flowId) {
    try {
      const response = await this.client.get(`/v1/flows/${flowId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      logger.error('Error getting flow:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Archive flow
   */
  async archiveFlow(flowId) {
    try {
      const response = await this.client.patch(`/v1/flows/${flowId}/archive`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error archiving flow:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  // ==================== PROFILE OPERATIONS ====================

  /**
   * Get user profile
   */
  async getProfile() {
    try {
      logger.log('✅ getProfile: Making API call');
      logger.log('✅ getProfile: Calling GET /v1/profile...');
      
      const response = await this.client.get('/v1/profile');
      
      logger.log('✅ getProfile: API response received:', response.data);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error getting profile:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(username) {
    try {
      logger.log('🔍 checkUsernameAvailability: Checking username:', username);
      
      const response = await this.client.get(`/v1/auth/check-username/${encodeURIComponent(username)}`);
      logger.log('✅ checkUsernameAvailability: Response received:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      logger.error('❌ checkUsernameAvailability: Error:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    try {
      // Check authentication before making the request
      const isAuthenticated = await this.isUserAuthenticated();
      if (!isAuthenticated) {
        logger.log('❌ updateProfile: User not authenticated, skipping API call');
        return {
          success: false,
          error: {
            message: 'Please login to update your profile',
            code: 'NOT_AUTHENTICATED',
            action: 'LOGIN_REQUIRED'
          }
        };
      }

      logger.log('✅ updateProfile: User authenticated, making API call');
      logger.log('✅ updateProfile: Calling PUT /v1/profile...');
      logger.log('✅ updateProfile: Profile data:', profileData);
      const response = await this.client.put('/v1/profile', profileData);
      logger.log('✅ updateProfile: API response received:', response.data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error updating profile:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Get profile statistics
   */
  async getProfileStats() {
    try {
      // Check authentication before making the request
      const isAuthenticated = await this.isUserAuthenticated();
      if (!isAuthenticated) {
        logger.log('❌ getProfileStats: User not authenticated, skipping API call');
        return {
          success: false,
          error: {
            message: 'Please login to access your profile statistics',
            code: 'NOT_AUTHENTICATED',
            action: 'LOGIN_REQUIRED'
          }
        };
      }

      logger.log('✅ getProfileStats: User authenticated, making API call');
      logger.log('✅ getProfileStats: Calling GET /v1/profile/stats...');
      const response = await this.client.get('/v1/profile/stats');
      logger.log('✅ getProfileStats: API response received:', response.data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error getting profile stats:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  // ==================== STATISTICS OPERATIONS ====================

  /**
   * Get statistics
   */
  async getStats() {
    try {
      // Check authentication before making the request
      const isAuthenticated = await this.isUserAuthenticated();
      if (!isAuthenticated) {
        logger.log('❌ getStats: User not authenticated, skipping API call');
        return {
          success: false,
          error: {
            message: 'Please login to access your statistics',
            code: 'NOT_AUTHENTICATED',
            action: 'LOGIN_REQUIRED'
          }
        };
      }

      logger.log('✅ getStats: User authenticated, making API call');
      logger.log('✅ getStats: Calling GET /v1/stats...');
      const response = await this.client.get('/v1/stats/users/{userId}');
      logger.log('✅ getStats: API response received:', response.data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error getting stats:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  // ==================== FLOW ENTRY OPERATIONS ====================

  /**
   * Get flow entries
   */
  async getFlowEntries(params = {}) {
    try {
      // Check authentication before making the request
      const isAuthenticated = await this.isUserAuthenticated();
      if (!isAuthenticated) {
        logger.log('❌ getFlowEntries: User not authenticated, skipping API call');
        return {
          success: false,
          error: {
            message: 'Please login to access your flow entries',
            code: 'NOT_AUTHENTICATED',
            action: 'LOGIN_REQUIRED'
          }
        };
      }

      logger.log('✅ getFlowEntries: User authenticated, making API call');
      const response = await this.client.get('/v1/flow-entries', { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      logger.error('Error getting flow entries:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Create flow entry
   */
  async createFlowEntry(entryData) {
    try {
      const response = await this.client.post('/v1/flow-entries', entryData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error creating flow entry:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Update flow entry
   */
  async updateFlowEntry(entryId, updates) {
    try {
      const response = await this.client.put(`/v1/flow-entries/${entryId}`, updates);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error updating flow entry:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Delete flow entry
   */
  async deleteFlowEntry(entryId) {
    try {
      const response = await this.client.delete(`/v1/flow-entries/${entryId}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error deleting flow entry:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  // ==================== STATS OPERATIONS ====================

  /**
   * Get flow scoreboard data (for ActivityContext)
   */
  async getFlowScoreboard(flowId, params = {}) {
    try {
      const response = await this.client.get(`/stats/flows/${flowId}/scoreboard`, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      logger.error('Error getting flow scoreboard:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Get flow activity stats (for ActivityContext)
   */
  async getFlowActivityStats(flowId, params = {}) {
    try {
      const response = await this.client.get(`/stats/flows/${flowId}/activity`, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      logger.error('Error getting flow activity stats:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Get flow emotional activity (for ActivityContext)
   */
  async getFlowEmotionalActivity(flowId, params = {}) {
    try {
      const response = await this.client.get(`/stats/flows/${flowId}/emotional`, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      logger.error('Error getting flow emotional activity:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Get flow statistics
   */
  async getFlowStats(flowId, params = {}) {
    try {
      const response = await this.client.get(`/stats/flows/${flowId}`, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      logger.error('Error getting flow stats:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Get overall statistics
   */
  async getOverallStats(params = {}) {
    try {
      // Get current user ID from auth service
      const authService = require('./authService').default;
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser || !currentUser.id) {
        return {
          success: false,
          error: 'User not authenticated',
          message: 'Please login to access statistics'
        };
      }
      
      const response = await this.client.get(`/v1/stats/users/${currentUser.id}`, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      logger.error('Error getting overall stats:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  // ==================== SETTINGS OPERATIONS ====================

  /**
   * Get user settings
   */
  async getUserSettings() {
    try {
      // Check authentication before making the request
      const isAuthenticated = await this.isUserAuthenticated();
      if (!isAuthenticated) {
        logger.log('❌ getUserSettings: User not authenticated, skipping API call');
        return { 
          success: false, 
          error: { 
            message: 'Please login to access your settings', 
            code: 'NOT_AUTHENTICATED',
            action: 'LOGIN_REQUIRED'
          } 
        };
      }

      logger.log('✅ getUserSettings: User authenticated, making API call');
      const response = await this.client.get('/v1/user/settings');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      logger.error('Error getting user settings:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Update user settings
   */
  async updateUserSettings(settings) {
    try {
      const response = await this.client.put('/v1/user/settings', settings);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error updating user settings:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings() {
    try {
      const response = await this.client.get('/v1/user/settings/notifications');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error getting notification settings:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings) {
    try {
      const response = await this.client.patch('/notifications/settings', settings);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error updating notification settings:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Get notification logs
   */
  async getNotificationLogs(params = {}) {
    try {
      // TODO: Implement when backend supports notification logs
      console.warn('⚠️ Notification logs endpoint not available in backend');
      return {
        success: true,
        data: [],
        message: 'Notification logs not available',
      };
    } catch (error) {
      logger.error('Error getting notification logs:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  // Register device for notifications
  async registerDevice(deviceData) {
    try {
      logger.log('📱 Registering device with data:', deviceData);
      // TODO: Implement when backend supports device registration
      console.warn('⚠️ Device registration endpoint not available in backend');
      return {
        success: true,
        data: { registered: false },
        message: 'Device registration not available',
      };
    } catch (error) {
      logger.error('❌ Error registering device:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  // ==================== DEBUG METHODS ====================

  /**
   * Debug authentication state
   */
  async debugAuthState() {
    logger.log('🔍 === AUTHENTICATION DEBUG START ===');
    
    try {
      // Check Firebase user
      const firebaseUser = auth().currentUser;
      logger.log('🔍 Firebase current user:', {
        exists: !!firebaseUser,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        emailVerified: firebaseUser?.emailVerified,
        isAnonymous: firebaseUser?.isAnonymous
      });

      // Check if user is authenticated
      const isAuthenticated = await this.isUserAuthenticated();
      logger.log('🔍 Is user authenticated:', isAuthenticated);

      // Try to get token
      const token = await this.getAuthToken();
      logger.log('🔍 Auth token available:', !!token);

      // Test API call
      const testResult = await this.healthCheck();
      logger.log('🔍 API test result:', testResult);

      logger.log('🔍 === AUTHENTICATION DEBUG END ===');
      
      return {
        firebaseUser: !!firebaseUser,
        isAuthenticated,
        hasToken: !!token,
        apiTest: testResult
      };
    } catch (error) {
      logger.error('❌ Auth debug error:', error);
      return { error: error.message };
    }
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Check API health
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return { success: false, error: this.handleError(error) };
    }
  }
}

// Export singleton instance
export default new ApiService();
