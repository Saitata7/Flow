/**
 * Activity Cache Service - Background sync and maintenance
 * 
 * This service handles background synchronization of activity cache
 * with the backend, ensuring optimal performance and data consistency.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import moment from 'moment';
import sessionApiService from './sessionApiService';
import syncService from './syncService';
import settingsService from './settingsService';

const ACTIVITY_CACHE_KEY = 'activity_cache';
const CACHE_METADATA_KEY = 'cache_metadata';
const LAST_SYNC_KEY = 'last_activity_cache_sync';

class ActivityCacheService {
  constructor() {
    this.syncInterval = null;
    this.isProcessing = false;
    this.lastSyncTime = null;
    this.init();
  }

  async init() {
    try {
      // Load last sync time
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      this.lastSyncTime = lastSync ? new Date(lastSync) : null;

      // Start periodic sync
      this.startPeriodicSync();

      // Listen for network changes
      NetInfo.addEventListener(async (state) => {
        if (state.isConnected && await this.shouldSync()) {
          console.log('🌐 Network reconnected, triggering activity cache sync...');
          this.syncWithBackend();
        }
      });

      console.log('✅ ActivityCacheService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ActivityCacheService:', error);
    }
  }

  /**
   * Start periodic sync (every 24 hours)
   */
  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (await this.shouldSync()) {
        console.log('⏰ Periodic activity cache sync triggered...');
        this.syncWithBackend();
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log('🔄 Periodic activity cache sync started');
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Periodic activity cache sync stopped');
    }
  }

  /**
   * Check if sync should be performed
   */
  async shouldSync() {
    // Don't sync if already processing
    if (this.isProcessing) return false;

    // Don't sync if not authenticated
    if (!syncService.canSync()) return false;

    // Don't sync if user has disabled cloud sync
    if (!settingsService.getSetting('cloudSyncEnabled', true)) return false;

    // Don't sync if not online - use async check
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) return false;

    // Sync if never synced before
    if (!this.lastSyncTime) return true;

    // Sync if last sync was more than 24 hours ago
    const hoursSinceLastSync = moment().diff(this.lastSyncTime, 'hours');
    return hoursSinceLastSync >= 24;
  }

  /**
   * Sync activity cache with backend
   */
  async syncWithBackend() {
    if (!(await this.shouldSync())) {
      console.log('⏸️ Activity cache sync skipped - conditions not met');
      return;
    }

    this.isProcessing = true;
    console.log('🔄 Starting activity cache sync with backend...');

    try {
      // Load current cache
      const [cacheData, metadata] = await Promise.all([
        AsyncStorage.getItem(ACTIVITY_CACHE_KEY),
        AsyncStorage.getItem(CACHE_METADATA_KEY),
      ]);

      const activityCache = cacheData ? JSON.parse(cacheData) : {};
      const cacheMetadata = metadata ? JSON.parse(metadata) : {};

      // Prepare sync data
      const syncData = {
        activityCache,
        metadata: cacheMetadata,
        lastSync: moment().toISOString(),
        version: '1.0.0',
      };

      // Upload to backend
      console.log('📤 Uploading activity cache to backend...');
      const uploadResponse = await sessionApiService.updateUserSettings({
        activityCache: syncData,
      });

      if (uploadResponse.success) {
        console.log('✅ Activity cache uploaded successfully');
      }

      // Download updated cache from backend
      console.log('📥 Downloading updated activity cache from backend...');
      
      // Check authentication before making API call
      const isAuthenticated = await sessionApiService.isUserAuthenticated();
      if (!isAuthenticated) {
        console.log('User not authenticated, skipping activity cache download');
        return;
      }
      
      const downloadResponse = await sessionApiService.getUserSettings();
      
      if (downloadResponse.success && downloadResponse.data.activityCache) {
        const serverCache = downloadResponse.data.activityCache;
        
        // Merge server cache with local cache
        const mergedCache = this.mergeCaches(activityCache, serverCache.activityCache || {});
        
        // Save merged cache
        await AsyncStorage.setItem(ACTIVITY_CACHE_KEY, JSON.stringify(mergedCache));
        
        if (serverCache.metadata) {
          await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(serverCache.metadata));
        }

        console.log('📥 Activity cache downloaded and merged successfully');
      }

      // Update last sync time
      this.lastSyncTime = new Date();
      await AsyncStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime.toISOString());

      console.log('✅ Activity cache sync completed successfully');
    } catch (error) {
      console.error('❌ Activity cache sync failed:', error);
      
      // Handle specific error types
      if (error.response?.status === 401) {
        console.log('🔐 Authentication failed during cache sync');
        // Could trigger re-authentication here
      } else if (error.code === 'NETWORK_ERROR') {
        console.log('🌐 Network error during cache sync - will retry later');
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Merge local and server caches intelligently
   */
  mergeCaches(localCache, serverCache) {
    const mergedCache = { ...localCache };

    Object.keys(serverCache).forEach(flowId => {
      const serverFlowCache = serverCache[flowId];
      const localFlowCache = localCache[flowId];

      if (!localFlowCache) {
        // New flow from server
        mergedCache[flowId] = serverFlowCache;
      } else {
        // Merge existing flow cache
        mergedCache[flowId] = this.mergeFlowCaches(localFlowCache, serverFlowCache);
      }
    });

    return mergedCache;
  }

  /**
   * Merge individual flow caches
   */
  mergeFlowCaches(localFlowCache, serverFlowCache) {
    const merged = { ...localFlowCache };

    // Use server's lastUpdated if it's newer
    const localUpdated = moment(localFlowCache.lastUpdated);
    const serverUpdated = moment(serverFlowCache.lastUpdated);

    if (serverUpdated.isAfter(localUpdated)) {
      // Server is newer, use server data
      merged.lastUpdated = serverFlowCache.lastUpdated;
      merged.version = serverFlowCache.version;
      
      // Merge timeframes
      ['weekly', 'monthly', 'yearly', 'all'].forEach(timeframe => {
        if (serverFlowCache[timeframe]) {
          merged[timeframe] = serverFlowCache[timeframe];
        }
      });

      // Merge daily entries
      if (serverFlowCache.dailyEntries) {
        merged.dailyEntries = {
          ...merged.dailyEntries,
          ...serverFlowCache.dailyEntries,
        };
      }
    }

    return merged;
  }

  /**
   * Force sync (ignore conditions)
   */
  async forceSync() {
    console.log('🔄 Forcing activity cache sync...');
    this.isProcessing = true;

    try {
      await this.syncWithBackend();
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const netInfo = await NetInfo.fetch();
    return {
      isProcessing: this.isProcessing,
      lastSyncTime: this.lastSyncTime,
      shouldSync: await this.shouldSync(),
      canSync: syncService.canSync(),
      syncEnabled: settingsService.getSetting('cloudSyncEnabled', true),
      isOnline: netInfo.isConnected,
    };
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ACTIVITY_CACHE_KEY),
        AsyncStorage.removeItem(CACHE_METADATA_KEY),
        AsyncStorage.removeItem(LAST_SYNC_KEY),
      ]);

      this.lastSyncTime = null;
      console.log('🧹 Activity cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear activity cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const [cacheData, metadata] = await Promise.all([
        AsyncStorage.getItem(ACTIVITY_CACHE_KEY),
        AsyncStorage.getItem(CACHE_METADATA_KEY),
      ]);

      const activityCache = cacheData ? JSON.parse(cacheData) : {};
      const cacheMetadata = metadata ? JSON.parse(metadata) : {};

      const totalFlows = Object.keys(activityCache).length;
      const totalEntries = Object.values(activityCache).reduce((sum, flowCache) => 
        sum + (flowCache.dailyEntries ? Object.keys(flowCache.dailyEntries).length : 0), 0
      );

      return {
        totalFlows,
        totalEntries,
        cacheSize: JSON.stringify(activityCache).length,
        lastFullRebuild: cacheMetadata.lastFullRebuild,
        version: cacheMetadata.version,
        lastSyncTime: this.lastSyncTime,
        syncStatus: await this.getSyncStatus(),
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return {
        totalFlows: 0,
        totalEntries: 0,
        cacheSize: 0,
        lastFullRebuild: null,
        version: '1.0.0',
        lastSyncTime: null,
        syncStatus: await this.getSyncStatus(),
      };
    }
  }
}

export default new ActivityCacheService();
