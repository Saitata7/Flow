// context/SettingsContext.js
// Settings and privacy management context
// Provides centralized access to user settings and privacy preferences

import React, { createContext, useState, useEffect, useCallback } from 'react';
import settingsService from '../services/settingsService';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [privacySettings, setPrivacySettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize settings service
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        setIsLoading(true);
        await settingsService.initialize();
        
        const loadedSettings = settingsService.getSettings();
        const loadedPrivacySettings = settingsService.getPrivacySettings();
        
        setSettings(loadedSettings);
        setPrivacySettings(loadedPrivacySettings);
        setIsInitialized(true);
        
        console.log('✅ Settings context initialized');
      } catch (error) {
        console.error('❌ Failed to initialize settings context:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettings();
  }, []);

  // Update a setting
  const updateSetting = useCallback(async (key, value) => {
    try {
      await settingsService.updateSetting(key, value);
      const updatedSettings = settingsService.getSettings();
      setSettings(updatedSettings);
      
      console.log(`⚙️ Setting updated: ${key} = ${value}`);
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }, []);

  // Update privacy setting
  const updatePrivacySetting = useCallback(async (key, value) => {
    try {
      await settingsService.updatePrivacySetting(key, value);
      const updatedPrivacySettings = settingsService.getPrivacySettings();
      setPrivacySettings(updatedPrivacySettings);
      
      console.log(`🔒 Privacy setting updated: ${key} = ${value}`);
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      throw error;
    }
  }, []);

  // Enable/disable sync
  const setSyncEnabled = useCallback(async (enabled) => {
    await updateSetting('syncEnabled', enabled);
  }, [updateSetting]);

  // Update notification setting
  const updateNotificationSetting = useCallback(async (key, value) => {
    await updateSetting(`notifications.${key}`, value);
  }, [updateSetting]);

  // Update data sharing setting
  const updateDataSharingSetting = useCallback(async (key, value) => {
    await updateSetting(`dataSharing.${key}`, value);
  }, [updateSetting]);

  // Set theme
  const setTheme = useCallback(async (theme) => {
    await updateSetting('theme', theme);
  }, [updateSetting]);

  // Set language
  const setLanguage = useCallback(async (language) => {
    await updateSetting('language', language);
  }, [updateSetting]);

  // Complete privacy setup
  const completePrivacySetup = useCallback(async (choices) => {
    try {
      await settingsService.completePrivacySetup(choices);
      
      const updatedSettings = settingsService.getSettings();
      const updatedPrivacySettings = settingsService.getPrivacySettings();
      
      setSettings(updatedSettings);
      setPrivacySettings(updatedPrivacySettings);
      
      console.log('✅ Privacy setup completed');
    } catch (error) {
      console.error('Error completing privacy setup:', error);
      throw error;
    }
  }, []);

  // Reset settings
  const resetSettings = useCallback(async () => {
    try {
      await settingsService.resetSettings();
      const resetSettings = settingsService.getSettings();
      setSettings(resetSettings);
      console.log('🔄 Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }, []);

  // Reset privacy settings
  const resetPrivacySettings = useCallback(async () => {
    try {
      await settingsService.resetPrivacySettings();
      const resetPrivacySettings = settingsService.getPrivacySettings();
      setPrivacySettings(resetPrivacySettings);
      console.log('🔒 Privacy settings reset');
    } catch (error) {
      console.error('Error resetting privacy settings:', error);
      throw error;
    }
  }, []);

  // Enhanced cross-device sync
  const syncSettingsCrossDevice = useCallback(async () => {
    try {
      console.log('🔄 Starting cross-device settings sync...');
      
      // First, sync local changes to backend
      await settingsService.syncLocalChangesToBackend();
      
      // Then, pull latest settings from backend
      await settingsService.pullLatestSettingsFromBackend();
      
      // Update local state
      const updatedSettings = settingsService.getSettings();
      const updatedPrivacySettings = settingsService.getPrivacySettings();
      
      setSettings(updatedSettings);
      setPrivacySettings(updatedPrivacySettings);
      
      console.log('✅ Cross-device settings sync completed');
    } catch (error) {
      console.error('❌ Cross-device settings sync failed:', error);
      throw error;
    }
  }, []);

  // Check for settings conflicts
  const checkSettingsConflicts = useCallback(async () => {
    try {
      const conflicts = await settingsService.checkForConflicts();
      return conflicts;
    } catch (error) {
      console.error('Error checking settings conflicts:', error);
      return [];
    }
  }, []);

  // Resolve settings conflicts
  const resolveSettingsConflicts = useCallback(async (conflicts, resolutionStrategy) => {
    try {
      await settingsService.resolveConflicts(conflicts, resolutionStrategy);
      
      const updatedSettings = settingsService.getSettings();
      const updatedPrivacySettings = settingsService.getPrivacySettings();
      
      setSettings(updatedSettings);
      setPrivacySettings(updatedPrivacySettings);
      
      console.log('✅ Settings conflicts resolved');
    } catch (error) {
      console.error('Error resolving settings conflicts:', error);
      throw error;
    }
  }, []);

  // Sync settings with backend
  const syncSettings = useCallback(async () => {
    try {
      await settingsService.syncWithBackend();
      
      const updatedSettings = settingsService.getSettings();
      const updatedPrivacySettings = settingsService.getPrivacySettings();
      
      setSettings(updatedSettings);
      setPrivacySettings(updatedPrivacySettings);
      
      console.log('🔄 Settings synced with backend');
    } catch (error) {
      console.error('Error syncing settings:', error);
      throw error;
    }
  }, []);

  // Export settings
  const exportSettings = useCallback(() => {
    return settingsService.exportSettings();
  }, []);

  // Import settings
  const importSettings = useCallback(async (backupData) => {
    try {
      await settingsService.importSettings(backupData);
      
      const updatedSettings = settingsService.getSettings();
      const updatedPrivacySettings = settingsService.getPrivacySettings();
      
      setSettings(updatedSettings);
      setPrivacySettings(updatedPrivacySettings);
      
      console.log('📥 Settings imported from backup');
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }, []);

  // Computed values
  const isSyncEnabled = useCallback(() => {
    return settingsService.isSyncEnabled();
  }, [settings]);

  const isAutoSyncEnabled = useCallback(() => {
    return settingsService.isAutoSyncEnabled();
  }, [settings]);

  const getSyncFrequency = useCallback(() => {
    return settingsService.getSyncFrequency();
  }, [settings]);

  const isWifiOnlySync = useCallback(() => {
    return settingsService.isWifiOnlySync();
  }, [settings]);

  const getNotificationSettings = useCallback(() => {
    return settingsService.getNotificationSettings();
  }, [settings]);

  const getTheme = useCallback(() => {
    return settingsService.getTheme();
  }, [settings]);

  const getLanguage = useCallback(() => {
    return settingsService.getLanguage();
  }, [settings]);

  const getDataSharingSettings = useCallback(() => {
    return settingsService.getDataSharingSettings();
  }, [settings]);

  const isAnalyticsEnabled = useCallback(() => {
    return settingsService.isAnalyticsEnabled();
  }, [settings]);

  const isCrashReportsEnabled = useCallback(() => {
    return settingsService.isCrashReportsEnabled();
  }, [settings]);

  const isUsageStatsEnabled = useCallback(() => {
    return settingsService.isUsageStatsEnabled();
  }, [settings]);

  const isPersonalizedAdsEnabled = useCallback(() => {
    return settingsService.isPersonalizedAdsEnabled();
  }, [settings]);

  const getBackupSettings = useCallback(() => {
    return settingsService.getBackupSettings();
  }, [settings]);

  const getPrivacySummary = useCallback(() => {
    return settingsService.getPrivacySummary();
  }, [settings, privacySettings]);

  const getDataSharingLevel = useCallback(() => {
    return settingsService.getDataSharingLevel();
  }, [settings]);

  const hasCompletedPrivacySetup = useCallback(() => {
    return settingsService.hasCompletedPrivacySetup();
  }, [privacySettings]);

  const contextValue = {
    // State
    settings,
    privacySettings,
    isLoading,
    isInitialized,
    
    // Actions
    updateSetting,
    updatePrivacySetting,
    setSyncEnabled,
    updateNotificationSetting,
    updateDataSharingSetting,
    setTheme,
    setLanguage,
    completePrivacySetup,
    resetSettings,
    resetPrivacySettings,
    syncSettings,
    syncSettingsCrossDevice,
    checkSettingsConflicts,
    resolveSettingsConflicts,
    exportSettings,
    importSettings,
    
    // Computed values
    isSyncEnabled,
    isAutoSyncEnabled,
    getSyncFrequency,
    isWifiOnlySync,
    getNotificationSettings,
    getTheme,
    getLanguage,
    getDataSharingSettings,
    isAnalyticsEnabled,
    isCrashReportsEnabled,
    isUsageStatsEnabled,
    isPersonalizedAdsEnabled,
    getBackupSettings,
    getPrivacySummary,
    getDataSharingLevel,
    hasCompletedPrivacySetup,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
