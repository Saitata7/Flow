// services/apiService.js
// Centralized API service for Flow mobile app
// Handles authenticated requests, sync endpoints, and offline-first architecture

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';

// API Configuration
const API_CONFIG = {
  baseURL: __DEV__ 
    ? 'http://10.0.10.94:4000/v1'  // Local development server
    : 'https://api.flow.app/v1',  // Production custom domain
  timeout: 15000,
  retryAttempts: 3,
  retryDelay: 1000,
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
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '1.0.0',
        'X-Platform': 'mobile',
      },
    });

    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await this.getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('API Request: Added auth token:', token.substring(0, 10) + '...');
          } else {
            console.log('API Request: No auth token available');
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors and retries
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !error.config._retry) {
          try {
            const refreshedToken = await this.getAuthToken(true);
            if (refreshedToken) {
              error.config.headers.Authorization = `Bearer ${refreshedToken}`;
              error.config._retry = true;
              return this.client.request(error.config);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
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
   * Setup network connectivity listener
   */
  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      if (!wasOnline && this.isOnline) {
        console.log('🌐 Network connected - triggering sync');
        this.triggerSync();
      } else if (wasOnline && !this.isOnline) {
        console.log('📱 Network disconnected - switching to offline mode');
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
      
      console.log('📱 Sync settings loaded:', { 
        enabled: this.syncEnabled, 
        lastSync: this.lastSyncTime 
      });
    } catch (error) {
      console.error('Error loading sync settings:', error);
    }
  }

  /**
   * Get authentication token from Firebase Auth with automatic refresh
   */
  async getAuthToken(forceRefresh = false) {
    try {
      const user = auth().currentUser;
      if (user) {
        const token = await user.getIdToken(forceRefresh);
        return token;
      }
      
      // For development, use dev-token when no Firebase user is available
      if (__DEV__) {
        console.log('No Firebase user available, using dev-token for development');
        return 'dev-token';
      }
      
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      
      // For development, fallback to dev-token on error
      if (__DEV__) {
        console.log('Firebase auth error, using dev-token for development');
        return 'dev-token';
      }
      
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
    
    console.log(`🔄 Retrying request (attempt ${this.retryCount}/${API_CONFIG.retryAttempts}) in ${delay}ms`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.client.request(config);
  }

  /**
   * Handle API errors with user-friendly messages
   */
  handleError(error) {
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
      errorResponse.message = error.message || 'Unknown error occurred';
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
      this.triggerSync();
    }
  }

  /**
   * Check if sync is enabled and user is authenticated
   */
  async canSync() {
    const token = await this.getAuthToken();
    return this.syncEnabled && this.isOnline && !!token;
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
      console.log('📝 Added to sync queue:', operation.type);
      
      // Trigger sync if online
      if (await this.canSync()) {
        this.triggerSync();
      }
    } catch (error) {
      console.error('Error adding to sync queue:', error);
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
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
      console.log('🧹 Sync queue cleared');
    } catch (error) {
      console.error('Error clearing sync queue:', error);
    }
  }

  /**
   * Trigger sync process
   */
  async triggerSync() {
    if (!(await this.canSync())) {
      console.log('⏸️ Sync skipped - not online or disabled');
      return;
    }

    try {
      console.log('🔄 Starting sync process...');
      
      // Process sync queue
      await this.processSyncQueue();
      
      // Pull latest data from server
      await this.pullLatestData();
      
      // Update last sync time
      this.lastSyncTime = new Date();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime.toISOString());
      
      console.log('✅ Sync completed successfully');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    }
  }

  /**
   * Process pending sync queue
   */
  async processSyncQueue() {
    const queue = await this.getSyncQueue();
    if (queue.length === 0) return;

    console.log(`📤 Processing ${queue.length} pending operations...`);

    for (const operation of queue) {
      try {
        await this.executeSyncOperation(operation);
        
        // Remove successful operation from queue
        const updatedQueue = queue.filter(op => op.id !== operation.id);
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(updatedQueue));
        
        console.log(`✅ Synced operation: ${operation.type}`);
      } catch (error) {
        console.error(`❌ Failed to sync operation ${operation.type}:`, error);
        
        // Increment retry count
        operation.retryCount = (operation.retryCount || 0) + 1;
        
        // Remove from queue if max retries exceeded
        if (operation.retryCount >= 3) {
          const updatedQueue = queue.filter(op => op.id !== operation.id);
          await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(updatedQueue));
          console.log(`🗑️ Removed failed operation after max retries: ${operation.type}`);
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
      console.log('📥 Pulling latest data from server...');
      
      // Get flows
      const flowsResponse = await this.getFlows();
      if (flowsResponse.success) {
        // Update local storage with server data
        await AsyncStorage.setItem('flows', JSON.stringify(flowsResponse.data));
        console.log(`📥 Synced ${flowsResponse.data.length} flows from server`);
      }
      
      // Get flow entries for last 30 days
      const entriesResponse = await this.getFlowEntries({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });
      
      if (entriesResponse.success) {
        // Merge entries with local flows
        await this.mergeFlowEntries(entriesResponse.data);
        console.log(`📥 Synced ${entriesResponse.data.length} flow entries from server`);
      }
      
    } catch (error) {
      console.error('Error pulling latest data:', error);
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
      console.error('Error merging flow entries:', error);
    }
  }

  // ==================== FLOW OPERATIONS ====================

  /**
   * Get user's flows
   */
  async getFlows(params = {}) {
    try {
      // Add cache-busting parameter to ensure fresh data
      const cacheBustParams = {
        ...params,
        _t: Date.now(), // Timestamp to bust cache
      };
      
      const response = await this.client.get('/flows', { params: cacheBustParams });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('Error getting flows:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Create a new flow
   */
  async createFlow(flowData) {
    try {
      const response = await this.client.post('/flows', flowData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error creating flow:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Update flow
   */
  async updateFlow(flowId, updates) {
    try {
      const response = await this.client.put(`/flows/${flowId}`, updates);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error updating flow:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Delete flow
   */
  async deleteFlow(flowId) {
    try {
      const response = await this.client.delete(`/flows/${flowId}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error deleting flow:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Get flow by ID
   */
  async getFlow(flowId) {
    try {
      const response = await this.client.get(`/flows/${flowId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error getting flow:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Archive flow
   */
  async archiveFlow(flowId) {
    try {
      const response = await this.client.patch(`/flows/${flowId}/archive`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error archiving flow:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  // ==================== FLOW ENTRY OPERATIONS ====================

  /**
   * Get flow entries
   */
  async getFlowEntries(params = {}) {
    try {
      const response = await this.client.get('/flow-entries', { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('Error getting flow entries:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Create flow entry
   */
  async createFlowEntry(entryData) {
    try {
      const response = await this.client.post('/flow-entries', entryData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error creating flow entry:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Update flow entry
   */
  async updateFlowEntry(entryId, updates) {
    try {
      const response = await this.client.put(`/flow-entries/${entryId}`, updates);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error updating flow entry:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Delete flow entry
   */
  async deleteFlowEntry(entryId) {
    try {
      const response = await this.client.delete(`/flow-entries/${entryId}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error deleting flow entry:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  // ==================== STATS OPERATIONS ====================

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
      console.error('Error getting flow stats:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Get overall statistics
   */
  async getOverallStats(params = {}) {
    try {
      const response = await this.client.get('/stats/overall', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error getting overall stats:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  // ==================== SETTINGS OPERATIONS ====================

  /**
   * Get user settings
   */
  async getUserSettings() {
    try {
      const response = await this.client.get('/settings');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error getting user settings:', error);
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Update user settings
   */
  async updateUserSettings(settings) {
    try {
      const response = await this.client.put('/settings', settings);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error updating user settings:', error);
      return { success: false, error: this.handleError(error) };
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
      console.error('Health check failed:', error);
      return { success: false, error: this.handleError(error) };
    }
  }
}

// Export singleton instance
export default new ApiService();
