// services/settingsService.js
// User settings and privacy management service
// Handles sync preferences, privacy settings, and user preferences

import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtApiService from './jwtApiService';

const SETTINGS_STORAGE_KEY = 'user_settings';
const PRIVACY_STORAGE_KEY = 'privacy_settings';

// Default settings
const DEFAULT_SETTINGS = {
  // Sync preferences
  syncEnabled: true,
  autoSync: true,
  syncFrequency: 'realtime', // 'realtime', 'hourly', 'daily', 'manual'
  syncOnWifiOnly: false,
  
  // Privacy settings
  dataSharing: {
    analytics: true,
    crashReports: true,
    usageStats: true,
    personalizedAds: false,
  },
  
  // App preferences
  theme: 'system', // 'light', 'dark', 'system'
  language: 'en',
  notifications: {
    reminders: true,
    achievements: true,
    streaks: true,
    weeklyReports: true,
  },
  
  // Flow preferences
  defaultReminderTime: '09:00',
  defaultReminderLevel: '1',
  showCompletedFlows: true,
  showArchivedFlows: false,
  
  // Backup preferences
  backupEnabled: true,
  backupFrequency: 'daily',
  lastBackupTime: null,
};

class SettingsService {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.privacySettings = {};
    this.isInitialized = false;
  }

  /**
   * Initialize settings service
   */
  async initialize() {
    try {
      await this.loadSettings();
      await this.loadPrivacySettings();
      this.isInitialized = true;
      console.log('✅ Settings service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize settings service:', error);
    }
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const settingsData = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (settingsData) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) };
        console.log('📱 Settings loaded from storage');
      } else {
        console.log('📱 Using default settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Load privacy settings from storage
   */
  async loadPrivacySettings() {
    try {
      const privacyData = await AsyncStorage.getItem(PRIVACY_STORAGE_KEY);
      if (privacyData) {
        this.privacySettings = JSON.parse(privacyData);
        console.log('🔒 Privacy settings loaded from storage');
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      this.privacySettings = {};
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      console.log('💾 Settings saved to storage');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Save privacy settings to storage
   */
  async savePrivacySettings() {
    try {
      await AsyncStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(this.privacySettings));
      console.log('🔒 Privacy settings saved to storage');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  }

  /**
   * Get all settings (async version for API compatibility)
   */
  async getSettings() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Try to get settings from backend first
      const backendSettings = await jwtApiService.getUserSettings();
      if (backendSettings.success) {
        // Merge backend settings with local settings
        this.settings = { ...this.settings, ...backendSettings.data };
        await this.saveSettings();
        console.log('📥 Settings loaded from backend');
        return { ...this.settings };
      }
    } catch (error) {
      console.log('⚠️ Failed to load settings from backend, using local settings');
    }
    
    // Fallback to local settings
    return { ...this.settings };
  }

  /**
   * Get a specific setting by key with fallback
   */
  getSetting(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.settings;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Get privacy settings
   */
  getPrivacySettings() {
    return { ...this.privacySettings };
  }

  /**
   * Update a specific setting
   */
  async updateSetting(key, value) {
    try {
      // Handle nested keys (e.g., 'notifications.reminders')
      const keys = key.split('.');
      let current = this.settings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      await this.saveSettings();
      
      // Handle special cases
      if (key === 'syncEnabled') {
        await jwtApiService.setSyncEnabled(value);
        console.log(`🔄 Sync ${value ? 'enabled' : 'disabled'}`);
      }
      
      console.log(`⚙️ Setting updated: ${key} = ${value}`);
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  /**
   * Update privacy setting
   */
  async updatePrivacySetting(key, value) {
    try {
      this.privacySettings[key] = value;
      await this.savePrivacySettings();
      console.log(`🔒 Privacy setting updated: ${key} = ${value}`);
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      throw error;
    }
  }

  /**
   * Check if sync is enabled
   */
  isSyncEnabled() {
    return this.settings.syncEnabled && this.privacySettings.allowCloudSync !== false;
  }

  /**
   * Enable/disable cloud sync
   */
  async setSyncEnabled(enabled) {
    await this.updateSetting('syncEnabled', enabled);
    await jwtApiService.setSyncEnabled(enabled);
  }

  /**
   * Check if auto-sync is enabled
   */
  isAutoSyncEnabled() {
    return this.settings.autoSync && this.isSyncEnabled();
  }

  /**
   * Get sync frequency
   */
  getSyncFrequency() {
    return this.settings.syncFrequency;
  }

  /**
   * Check if sync should only happen on WiFi
   */
  isWifiOnlySync() {
    return this.settings.syncOnWifiOnly;
  }

  /**
   * Get notification preferences
   */
  getNotificationSettings() {
    return { ...this.settings.notifications };
  }

  /**
   * Update notification setting
   */
  async updateNotificationSetting(key, value) {
    await this.updateSetting(`notifications.${key}`, value);
  }

  /**
   * Get theme preference
   */
  getTheme() {
    return this.settings.theme;
  }

  /**
   * Set theme preference
   */
  async setTheme(theme) {
    await this.updateSetting('theme', theme);
  }

  /**
   * Get language preference
   */
  getLanguage() {
    return this.settings.language;
  }

  /**
   * Set language preference
   */
  async setLanguage(language) {
    await this.updateSetting('language', language);
  }

  /**
   * Get data sharing preferences
   */
  getDataSharingSettings() {
    return { ...this.settings.dataSharing };
  }

  /**
   * Update data sharing preference
   */
  async updateDataSharingSetting(key, value) {
    await this.updateSetting(`dataSharing.${key}`, value);
  }

  /**
   * Check if analytics are enabled
   */
  isAnalyticsEnabled() {
    return this.settings.dataSharing.analytics;
  }

  /**
   * Check if crash reports are enabled
   */
  isCrashReportsEnabled() {
    return this.settings.dataSharing.crashReports;
  }

  /**
   * Check if usage stats are enabled
   */
  isUsageStatsEnabled() {
    return this.settings.dataSharing.usageStats;
  }

  /**
   * Check if personalized ads are enabled
   */
  isPersonalizedAdsEnabled() {
    return this.settings.dataSharing.personalizedAds;
  }

  /**
   * Get backup preferences
   */
  getBackupSettings() {
    return {
      enabled: this.settings.backupEnabled,
      frequency: this.settings.backupFrequency,
      lastBackupTime: this.settings.lastBackupTime,
    };
  }

  /**
   * Update backup setting
   */
  async updateBackupSetting(key, value) {
    await this.updateSetting(`backup.${key}`, value);
  }

  /**
   * Set last backup time
   */
  async setLastBackupTime(timestamp) {
    await this.updateSetting('lastBackupTime', timestamp);
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings() {
    try {
      this.settings = { ...DEFAULT_SETTINGS };
      await this.saveSettings();
      console.log('🔄 Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  /**
   * Reset privacy settings
   */
  async resetPrivacySettings() {
    try {
      this.privacySettings = {};
      await this.savePrivacySettings();
      console.log('🔒 Privacy settings reset');
    } catch (error) {
      console.error('Error resetting privacy settings:', error);
      throw error;
    }
  }

  /**
   * Export settings for backup
   */
  exportSettings() {
    return {
      settings: this.getSettings(),
      privacySettings: this.getPrivacySettings(),
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Import settings from backup
   */
  async importSettings(backupData) {
    try {
      if (backupData.settings) {
        this.settings = { ...DEFAULT_SETTINGS, ...backupData.settings };
        await this.saveSettings();
      }
      
      if (backupData.privacySettings) {
        this.privacySettings = { ...backupData.privacySettings };
        await this.savePrivacySettings();
      }
      
      console.log('📥 Settings imported from backup');
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }

  /**
   * Sync settings with backend
   */
  async syncWithBackend() {
    if (!this.isSyncEnabled()) {
      console.log('⏸️ Settings sync skipped - disabled');
      return;
    }

    try {
      console.log('🔄 Syncing settings with backend...');
      
      // Check authentication before making API calls
      const isAuthenticated = await jwtApiService.isUserAuthenticated();
      if (!isAuthenticated) {
        console.log('🔄 User not authenticated, skipping settings sync');
        return;
      }
      
      // Pull settings from backend
      const response = await jwtApiService.getUserSettings();
      if (response.success) {
        const serverSettings = response.data;
        
        // Merge server settings with local settings
        this.settings = { ...this.settings, ...serverSettings };
        await this.saveSettings();
        
        console.log('📥 Settings synced from backend');
      }
      
      // Push local settings to backend
      const updateResponse = await jwtApiService.updateUserSettings(this.settings);
      if (updateResponse.success) {
        console.log('📤 Settings synced to backend');
      }
      
    } catch (error) {
      console.error('❌ Settings sync failed:', error);
    }
  }

  /**
   * Get privacy summary for user
   */
  getPrivacySummary() {
    return {
      syncEnabled: this.isSyncEnabled(),
      analyticsEnabled: this.isAnalyticsEnabled(),
      crashReportsEnabled: this.isCrashReportsEnabled(),
      usageStatsEnabled: this.isUsageStatsEnabled(),
      personalizedAdsEnabled: this.isPersonalizedAdsEnabled(),
      dataSharingLevel: this.getDataSharingLevel(),
    };
  }

  /**
   * Get data sharing level
   */
  getDataSharingLevel() {
    const settings = this.settings.dataSharing;
    const enabledCount = Object.values(settings).filter(Boolean).length;
    const totalCount = Object.keys(settings).length;
    
    if (enabledCount === 0) return 'minimal';
    if (enabledCount === totalCount) return 'full';
    if (enabledCount <= totalCount / 2) return 'limited';
    return 'moderate';
  }

  /**
   * Check if user has completed privacy setup
   */
  hasCompletedPrivacySetup() {
    return Object.keys(this.privacySettings).length > 0;
  }

  /**
   * Complete privacy setup with user choices
   */
  async completePrivacySetup(choices) {
    try {
      const {
        allowCloudSync = true,
        allowAnalytics = true,
        allowCrashReports = true,
        allowUsageStats = true,
        allowPersonalizedAds = false,
      } = choices;

      await this.updateSetting('syncEnabled', allowCloudSync);
      await this.updateSetting('dataSharing.analytics', allowAnalytics);
      await this.updateSetting('dataSharing.crashReports', allowCrashReports);
      await this.updateSetting('dataSharing.usageStats', allowUsageStats);
      await this.updateSetting('dataSharing.personalizedAds', allowPersonalizedAds);

      this.privacySettings.completed = true;
      this.privacySettings.completedAt = new Date().toISOString();
      await this.savePrivacySettings();

      console.log('✅ Privacy setup completed');
    } catch (error) {
      console.error('Error completing privacy setup:', error);
      throw error;
    }
  }

  /**
   * Update multiple settings at once
   */
  async updateSettings(updates) {
    try {
      // Update local settings first
      for (const [key, value] of Object.entries(updates)) {
        await this.updateSetting(key, value);
      }
      
      // Sync with backend
      try {
        const backendResponse = await jwtApiService.updateUserSettings(updates);
        if (backendResponse.success) {
          console.log('📤 Settings synced to backend');
          // Update local settings with backend response
          this.settings = { ...this.settings, ...backendResponse.data };
          await this.saveSettings();
        }
      } catch (error) {
        console.log('⚠️ Failed to sync settings to backend:', error.message);
      }
      
      return this.getSettings();
    } catch (error) {
      console.error('Error updating multiple settings:', error);
      throw error;
    }
  }

  /**
   * Update a specific setting category
   */
  async updateSettingCategory(category, updates) {
    try {
      const categorySettings = { ...this.settings[category], ...updates };
      await this.updateSetting(category, categorySettings);
      return this.getSettings();
    } catch (error) {
      console.error('Error updating setting category:', error);
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings() {
    try {
      this.settings = { ...DEFAULT_SETTINGS };
      await this.saveSettings();
      console.log('🔄 Settings reset to defaults');
      return this.getSettings();
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    try {
      await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
      await AsyncStorage.removeItem(PRIVACY_STORAGE_KEY);
      this.settings = { ...DEFAULT_SETTINGS };
      this.privacySettings = {};
      console.log('🗑️ All settings data cleared');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new SettingsService();