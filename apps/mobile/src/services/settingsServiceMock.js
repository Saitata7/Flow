// services/settingsServiceMock.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = 'app_settings';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Default settings structure
const defaultSettings = {
  theme: 'light',
  accentColor: '#007AFF',
  textSize: 'medium',
  highContrast: false,
  cheatMode: false,
  highlightDayStreak: true,
  closeTime: '21:00',
  habitDefaults: {
    type: 'binary',
    goalFrequency: 'daily',
    repeatTimesPerWeek: 7,
    reminderMethod: 'notification',
  },
  scoring: {
    showDetailedStats: true,
    showEmotionNotes: true,
    motivationalInsights: true,
  },
  emotionalLogging: {
    promptFrequency: 'always',
    customEmotions: ['Happy', 'Sad', 'Motivated'],
  },
  social: {
    shareProgress: false,
    communityChallenges: false,
    peerEncouragement: false,
  },
  dataPrivacy: {
    cloudBackup: false,
    localBackup: false,
    clinicianConsent: false,
  },
  clinician: {
    enableDashboard: false,
    sharedData: 'stats',
    clinicians: [],
  },
  integrations: {
    wearables: [],
    externalApps: [],
  },
  appBehavior: {
    defaultLandingPage: 'dashboard',
  },
  notifications: {
    dailyReminders: true,
    weeklyReports: true,
    achievementAlerts: true,
    communityUpdates: false,
    reminderTime: '09:00',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  },
  privacy: {
    shareStats: false,
    shareAchievements: false,
    allowFriendRequests: false,
    showOnlineStatus: false
  },
  location: {
    enabled: false,
    precision: 'city',
    shareLocation: false
  },
  schemaVersion: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

class SettingsServiceMock {
  constructor() {
    this.cache = null;
    this.cacheTimestamp = null;
  }

  // Get current user ID (mock)
  getCurrentUserId() {
    return 'demo-user-123';
  }

  // Check if settings cache is valid
  isCacheValid() {
    if (!this.cacheTimestamp) return false;
    return Date.now() - this.cacheTimestamp < CACHE_DURATION;
  }

  // Get settings from cache
  getCachedSettings() {
    if (this.isCacheValid()) {
      return this.cache;
    }
    return null;
  }

  // Cache settings
  cacheSettings(settings) {
    this.cache = settings;
    this.cacheTimestamp = Date.now();
  }

  // Get settings from local storage
  async getLocalSettings() {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting local settings:', error);
      return null;
    }
  }

  // Save settings to local storage
  async saveLocalSettings(settings) {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving local settings:', error);
    }
  }

  // Get settings (with caching and offline support)
  async getSettings() {
    // Check cache first
    const cachedSettings = this.getCachedSettings();
    if (cachedSettings) {
      return cachedSettings;
    }

    try {
      // Try to get from local storage
      const localSettings = await this.getLocalSettings();
      if (localSettings) {
        this.cacheSettings(localSettings);
        return localSettings;
      }
      
      // Return default settings if none exists
      const newSettings = { ...defaultSettings };
      await this.createSettings(newSettings);
      return newSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return { ...defaultSettings };
    }
  }

  // Create new settings
  async createSettings(settingsData = {}) {
    const settings = {
      ...defaultSettings,
      ...settingsData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Update cache and local storage
      this.cacheSettings(settings);
      await this.saveLocalSettings(settings);
      
      return settings;
    } catch (error) {
      console.error('Error creating settings:', error);
      throw error;
    }
  }

  // Update settings
  async updateSettings(updates) {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    try {
      // Get current settings
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...updateData };
      
      // Update cache and local storage
      this.cacheSettings(updatedSettings);
      await this.saveLocalSettings(updatedSettings);
      
      return updatedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  // Update specific setting category
  async updateSettingCategory(category, updates) {
    const currentSettings = await this.getSettings();
    const updatedCategory = {
      ...currentSettings[category],
      ...updates
    };
    
    return await this.updateSettings({
      [category]: updatedCategory
    });
  }

  // Reset settings to defaults
  async resetSettings() {
    try {
      // Update cache and local storage
      this.cacheSettings(defaultSettings);
      await this.saveLocalSettings(defaultSettings);
      
      return defaultSettings;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  // Clear all data (for account deletion)
  async clearAllData() {
    try {
      // Clear local storage
      await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
      
      // Clear cache
      this.cache = null;
      this.cacheTimestamp = null;
      
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Validate settings data
  validateSettings(settings) {
    const errors = [];

    // Validate theme
    if (settings.theme && !['light', 'dark', 'auto'].includes(settings.theme)) {
      errors.push('Invalid theme value');
    }

    // Validate text size
    if (settings.textSize && !['small', 'medium', 'large'].includes(settings.textSize)) {
      errors.push('Invalid text size value');
    }

    // Validate accent color (basic hex color validation)
    if (settings.accentColor && !/^#[0-9A-F]{6}$/i.test(settings.accentColor)) {
      errors.push('Invalid accent color format');
    }

    // Validate time format (HH:MM)
    if (settings.closeTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(settings.closeTime)) {
      errors.push('Invalid close time format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Clear cache
  clearCache() {
    this.cache = null;
    this.cacheTimestamp = null;
  }

  // Export settings (for backup)
  async exportSettings() {
    const settings = await this.getSettings();
    return {
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import settings (from backup)
  async importSettings(importData) {
    try {
      if (!importData.settings) {
        throw new Error('Invalid import data');
      }

      const validation = this.validateSettings(importData.settings);
      if (!validation.isValid) {
        throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
      }

      await this.updateSettings(importData.settings);
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }
}

export default new SettingsServiceMock();
