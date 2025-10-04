// hooks/useSettings.js
import { useState, useEffect, useCallback } from 'react';
import settingsService from '../services/settingsService';
import { useAuthSimple as useAuth } from './useAuthSimple';

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Load settings data
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const settingsData = await settingsService.getSettings();
      setSettings(settingsData);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(async (updates) => {
    try {
      setUpdating(true);
      setError(null);
      
      // Optimistic update
      const optimisticSettings = { ...settings, ...updates };
      setSettings(optimisticSettings);
      
      const updatedSettings = await settingsService.updateSettings(updates);
      setSettings(updatedSettings);
      
      return updatedSettings;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.message);
      
      // Revert optimistic update
      await loadSettings();
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [settings, loadSettings]);

  // Update specific setting category
  const updateSettingCategory = useCallback(async (category, updates) => {
    try {
      setUpdating(true);
      setError(null);
      
      const updatedSettings = await settingsService.updateSettingCategory(category, updates);
      setSettings(updatedSettings);
      
      return updatedSettings;
    } catch (err) {
      console.error('Error updating setting category:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    try {
      setUpdating(true);
      setError(null);
      
      const defaultSettings = await settingsService.resetSettings();
      setSettings(defaultSettings);
      
      return defaultSettings;
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  // Clear all data
  const clearAllData = useCallback(async () => {
    try {
      setUpdating(true);
      setError(null);
      
      await settingsService.clearAllData();
      setSettings(null);
      
      return true;
    } catch (err) {
      console.error('Error clearing all data:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  // Validate settings data
  const validateSettings = useCallback((settingsData) => {
    return settingsService.validateSettings(settingsData);
  }, []);

  // Export settings
  const exportSettings = useCallback(async () => {
    try {
      return await settingsService.exportSettings();
    } catch (err) {
      console.error('Error exporting settings:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Import settings
  const importSettings = useCallback(async (importData) => {
    try {
      setUpdating(true);
      setError(null);
      
      await settingsService.importSettings(importData);
      await loadSettings(); // Reload settings after import
      
      return true;
    } catch (err) {
      console.error('Error importing settings:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [loadSettings]);

  // Clear cache
  const clearCache = useCallback(() => {
    settingsService.clearCache();
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updating,
    updateSettings,
    updateSettingCategory,
    resetSettings,
    clearAllData,
    validateSettings,
    exportSettings,
    importSettings,
    clearCache,
    refetch: loadSettings
  };
};

// Hook for specific setting categories
export const useThemeSettings = () => {
  const { settings, updateSettings, updating } = useSettings();
  
  const themeSettings = settings ? {
    theme: settings.theme,
    accentColor: settings.accentColor,
    textSize: settings.textSize,
    highContrast: settings.highContrast
  } : null;

  const updateThemeSettings = useCallback(async (updates) => {
    return await updateSettings(updates);
  }, [updateSettings]);

  return {
    themeSettings,
    updating,
    updateThemeSettings
  };
};

export const useNotificationSettings = () => {
  const { settings, updateSettingCategory, updating } = useSettings();
  
  const notificationSettings = settings?.notifications || null;

  const updateNotificationSettings = useCallback(async (updates) => {
    return await updateSettingCategory('notifications', updates);
  }, [updateSettingCategory]);

  return {
    notificationSettings,
    updating,
    updateNotificationSettings
  };
};

export const usePrivacySettings = () => {
  const { settings, updateSettingCategory, updating } = useSettings();
  
  const privacySettings = settings?.privacy || null;

  const updatePrivacySettings = useCallback(async (updates) => {
    return await updateSettingCategory('privacy', updates);
  }, [updateSettingCategory]);

  return {
    privacySettings,
    updating,
    updatePrivacySettings
  };
};

export const useLocationSettings = () => {
  const { settings, updateSettingCategory, updating } = useSettings();
  
  const locationSettings = settings?.location || null;

  const updateLocationSettings = useCallback(async (updates) => {
    return await updateSettingCategory('location', updates);
  }, [updateSettingCategory]);

  return {
    locationSettings,
    updating,
    updateLocationSettings
  };
};
