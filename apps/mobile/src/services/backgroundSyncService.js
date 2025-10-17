/**
 * Background Sync Service - Handles periodic background synchronization
 * Ensures data is synced every 24 hours or when network becomes available
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import apiService from './apiService';
import syncService from './syncService';
import activityCacheService from './activityCacheService';

const BACKGROUND_SYNC_KEYS = {
  LAST_BACKGROUND_SYNC: '@flow_last_background_sync',
  SYNC_INTERVAL: '@flow_sync_interval',
  BACKGROUND_SYNC_ENABLED: '@flow_background_sync_enabled',
};

class BackgroundSyncService {
  constructor() {
    this.syncInterval = null;
    this.isRunning = false;
    this.syncIntervalMs = 24 * 60 * 60 * 1000; // 24 hours default
    this.isEnabled = true;
    this.lastSyncTime = null;
    
    this.init();
  }

  async init() {
    try {
      // Load configuration
      await this.loadConfiguration();
      
      // Setup listeners
      this.setupNetworkListener();
      this.setupAppStateListener();
      
      // Start background sync
      this.startBackgroundSync();
      
      console.log('✅ BackgroundSyncService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize BackgroundSyncService:', error);
    }
  }

  async loadConfiguration() {
    try {
      const [lastSync, interval, enabled] = await Promise.all([
        AsyncStorage.getItem(BACKGROUND_SYNC_KEYS.LAST_BACKGROUND_SYNC),
        AsyncStorage.getItem(BACKGROUND_SYNC_KEYS.SYNC_INTERVAL),
        AsyncStorage.getItem(BACKGROUND_SYNC_KEYS.BACKGROUND_SYNC_ENABLED),
      ]);

      this.lastSyncTime = lastSync ? new Date(lastSync) : null;
      this.syncIntervalMs = interval ? parseInt(interval) : 24 * 60 * 60 * 1000;
      this.isEnabled = enabled !== 'false';
      
      console.log('📱 Background sync config loaded:', {
        lastSync: this.lastSyncTime,
        interval: this.syncIntervalMs,
        enabled: this.isEnabled,
      });
    } catch (error) {
      console.error('Error loading background sync configuration:', error);
    }
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.isEnabled) {
        console.log('🌐 Network connected - checking if background sync needed...');
        this.checkAndTriggerSync();
      }
    });
  }

  setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && this.isEnabled) {
        console.log('📱 App became active - checking if background sync needed...');
        this.checkAndTriggerSync();
      }
    });
  }

  startBackgroundSync() {
    if (this.isRunning || !this.isEnabled) return;

    this.isRunning = true;
    
    // Clear existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.checkAndTriggerSync();
    }, this.syncIntervalMs);

    console.log('🔄 Background sync started with interval:', this.syncIntervalMs, 'ms');
  }

  stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Background sync stopped');
  }

  async checkAndTriggerSync() {
    try {
      if (!this.isEnabled) return;
      
      const now = new Date();
      const shouldSync = !this.lastSyncTime || 
        (now.getTime() - this.lastSyncTime.getTime()) >= this.syncIntervalMs;

      if (shouldSync) {
        console.log('🔄 Background sync triggered - interval reached');
        await this.performBackgroundSync();
      } else {
        console.log('⏸️ Background sync skipped - interval not reached');
      }
    } catch (error) {
      console.error('❌ Error checking background sync:', error);
    }
  }

  async performBackgroundSync() {
    try {
      console.log('🔄 Starting background sync...');
      
      // Double-check authentication before making any API calls
      const isAuthenticated = await apiService.isUserAuthenticated();
      if (!isAuthenticated) {
        console.log('⏸️ Background sync skipped - user not authenticated');
        return;
      }
      
      // Check if we can sync
      if (!(await apiService.canSync())) {
        console.log('⏸️ Background sync skipped - not authenticated or offline');
        return;
      }

      // Perform comprehensive sync
      await syncService.triggerSync();
      
      // Sync activity cache
      await activityCacheService.syncWithBackend();
      
      // Update last sync time
      this.lastSyncTime = new Date();
      await AsyncStorage.setItem(
        BACKGROUND_SYNC_KEYS.LAST_BACKGROUND_SYNC, 
        this.lastSyncTime.toISOString()
      );
      
      console.log('✅ Background sync completed successfully');
    } catch (error) {
      console.error('❌ Background sync failed:', error);
    }
  }

  // Configuration methods
  async setSyncInterval(intervalMs) {
    this.syncIntervalMs = intervalMs;
    await AsyncStorage.setItem(BACKGROUND_SYNC_KEYS.SYNC_INTERVAL, intervalMs.toString());
    
    // Restart sync with new interval
    if (this.isRunning) {
      this.stopBackgroundSync();
      this.startBackgroundSync();
    }
    
    console.log('⚙️ Background sync interval updated:', intervalMs, 'ms');
  }

  async setEnabled(enabled) {
    this.isEnabled = enabled;
    await AsyncStorage.setItem(BACKGROUND_SYNC_KEYS.BACKGROUND_SYNC_ENABLED, enabled.toString());
    
    if (enabled) {
      this.startBackgroundSync();
    } else {
      this.stopBackgroundSync();
    }
    
    console.log('⚙️ Background sync enabled:', enabled);
  }

  async forceBackgroundSync() {
    console.log('🔄 Force background sync triggered');
    await this.performBackgroundSync();
  }

  // Status methods
  getStatus() {
    return {
      isRunning: this.isRunning,
      isEnabled: this.isEnabled,
      lastSyncTime: this.lastSyncTime,
      syncIntervalMs: this.syncIntervalMs,
      nextSyncTime: this.lastSyncTime ? 
        new Date(this.lastSyncTime.getTime() + this.syncIntervalMs) : null,
    };
  }

  isSyncDue() {
    if (!this.lastSyncTime) return true;
    const now = new Date();
    return (now.getTime() - this.lastSyncTime.getTime()) >= this.syncIntervalMs;
  }

  getTimeUntilNextSync() {
    if (!this.lastSyncTime) return 0;
    const now = new Date();
    const nextSyncTime = this.lastSyncTime.getTime() + this.syncIntervalMs;
    return Math.max(0, nextSyncTime - now.getTime());
  }
}

export default new BackgroundSyncService();
