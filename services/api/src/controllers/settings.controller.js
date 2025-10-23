// controllers/settings.controller.js
// Settings and privacy management controller
// Handles user settings, privacy preferences, and cross-device sync

const { FlowModel } = require('../db/flowModel');
const { ConflictError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const moment = require('moment');

// Default settings structure matching mobile app
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

/**
 * Get user settings
 */
const getUserSettings = async (request, reply) => {
  const { user } = request;

  try {
    console.log('Getting user settings for user:', user.id);

    let userSettings;
    try {
      // Get user settings from database
      userSettings = await FlowModel.getUserSettings(user.id);
    } catch (dbError) {
      console.log('Database not available, using default settings:', dbError.message);
      // Use default settings when database is not available
      userSettings = DEFAULT_SETTINGS;
    }

    // Merge with defaults
    const settings = {
      ...DEFAULT_SETTINGS,
      ...userSettings,
    };

    return reply.send({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    request.log.error({ error: error.message, userId: user.id }, 'Failed to get user settings');
    throw new ConflictError('Failed to retrieve user settings');
  }
};

/**
 * Update user settings
 */
const updateUserSettings = async (request, reply) => {
  const { user } = request;
  const settingsData = request.body;

  try {
    console.log('Updating user settings for user:', user.id);

    let updatedSettings;
    try {
      // Update user settings in database
      await FlowModel.updateUserSettings(user.id, settingsData);
      // Get updated settings
      updatedSettings = await FlowModel.getUserSettings(user.id);
    } catch (dbError) {
      console.log('Database not available, using default settings:', dbError.message);
      // Use default settings when database is not available
      updatedSettings = DEFAULT_SETTINGS;
    }

    const settings = {
      ...DEFAULT_SETTINGS,
      ...updatedSettings,
    };

    return reply.send({
      success: true,
      data: settings,
      message: 'User settings updated successfully',
    });
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    request.log.error({ error: error.message, userId: user.id }, 'Failed to update user settings');
    throw new ConflictError('Failed to update user settings');
  }
};

/**
 * Update specific setting
 */
const updateSetting = async (request, reply) => {
  const { key } = request.params;
  const { value } = request.body;
  const { user } = request;

  try {
    console.log('Updating setting:', key, 'for user:', user.id);

    let currentSettings;
    try {
      // Get current settings
      currentSettings = (await FlowModel.getUserSettings(user.id)) || {};
    } catch (dbError) {
      console.log('Database not available, using default settings:', dbError.message);
      currentSettings = DEFAULT_SETTINGS;
    }

    // Handle nested keys (e.g., 'notifications.reminders')
    const keys = key.split('.');
    let current = currentSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;

    // Update settings in database
    let updatedSettings;
    try {
      await FlowModel.updateUserSettings(user.id, currentSettings);
      // Get updated settings
      updatedSettings = await FlowModel.getUserSettings(user.id);
    } catch (dbError) {
      console.log('Database not available, using default settings:', dbError.message);
      updatedSettings = DEFAULT_SETTINGS;
    }

    const settings = {
      ...DEFAULT_SETTINGS,
      ...updatedSettings,
    };

    return reply.send({
      success: true,
      data: settings,
      message: `Setting ${key} updated successfully`,
    });
  } catch (error) {
    console.error('Error in updateSetting:', error);
    request.log.error({ error: error.message, userId: user.id, key }, 'Failed to update setting');
    throw new ConflictError('Failed to update setting');
  }
};

/**
 * Update privacy setting
 */
const updatePrivacySetting = async (request, reply) => {
  const { key } = request.params;
  const { value } = request.body;
  const { user } = request;

  try {
    console.log('Updating privacy setting:', key, 'for user:', user.id);

    // Get current settings
    const currentSettings = (await FlowModel.getUserSettings(user.id)) || {};

    // Update privacy setting
    if (!currentSettings.privacySettings) {
      currentSettings.privacySettings = {};
    }
    currentSettings.privacySettings[key] = value;

    // Update settings in database
    await FlowModel.updateUserSettings(user.id, currentSettings);

    // Get updated settings
    const updatedSettings = await FlowModel.getUserSettings(user.id);
    const settings = {
      ...DEFAULT_SETTINGS,
      ...updatedSettings,
    };

    return reply.send({
      success: true,
      data: settings,
      message: `Privacy setting ${key} updated successfully`,
    });
  } catch (error) {
    console.error('Error in updatePrivacySetting:', error);
    request.log.error(
      { error: error.message, userId: user.id, key },
      'Failed to update privacy setting'
    );
    throw new ConflictError('Failed to update privacy setting');
  }
};

/**
 * Reset settings to defaults
 */
const resetSettings = async (request, reply) => {
  const { user } = request;

  try {
    console.log('Resetting settings for user:', user.id);

    // Reset to default settings
    await FlowModel.updateUserSettings(user.id, DEFAULT_SETTINGS);

    return reply.send({
      success: true,
      message: 'Settings reset to defaults successfully',
    });
  } catch (error) {
    console.error('Error in resetSettings:', error);
    request.log.error({ error: error.message, userId: user.id }, 'Failed to reset settings');
    throw new ConflictError('Failed to reset settings');
  }
};

/**
 * Reset privacy settings
 */
const resetPrivacySettings = async (request, reply) => {
  const { user } = request;

  try {
    console.log('Resetting privacy settings for user:', user.id);

    // Get current settings
    const currentSettings = (await FlowModel.getUserSettings(user.id)) || {};

    // Reset privacy settings
    currentSettings.privacySettings = {};

    // Update settings in database
    await FlowModel.updateUserSettings(user.id, currentSettings);

    return reply.send({
      success: true,
      message: 'Privacy settings reset successfully',
    });
  } catch (error) {
    console.error('Error in resetPrivacySettings:', error);
    request.log.error(
      { error: error.message, userId: user.id },
      'Failed to reset privacy settings'
    );
    throw new ConflictError('Failed to reset privacy settings');
  }
};

/**
 * Sync settings with backend
 */
const syncSettings = async (request, reply) => {
  const { user } = request;

  try {
    console.log('Syncing settings for user:', user.id);

    // Get current settings
    const currentSettings = (await FlowModel.getUserSettings(user.id)) || {};

    // Merge with defaults
    const settings = {
      ...DEFAULT_SETTINGS,
      ...currentSettings,
    };

    return reply.send({
      success: true,
      data: settings,
      message: 'Settings synced successfully',
    });
  } catch (error) {
    console.error('Error in syncSettings:', error);
    request.log.error({ error: error.message, userId: user.id }, 'Failed to sync settings');
    throw new ConflictError('Failed to sync settings');
  }
};

/**
 * Export settings for backup
 */
const exportSettings = async (request, reply) => {
  const { user } = request;

  try {
    console.log('Exporting settings for user:', user.id);

    // Get current settings
    const currentSettings = (await FlowModel.getUserSettings(user.id)) || {};
    const privacySettings = currentSettings.privacySettings || {};

    const exportData = {
      settings: currentSettings,
      privacySettings,
      exportDate: moment().toISOString(),
      version: '1.0.0',
    };

    return reply.send({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Error in exportSettings:', error);
    request.log.error({ error: error.message, userId: user.id }, 'Failed to export settings');
    throw new ConflictError('Failed to export settings');
  }
};

/**
 * Import settings from backup
 */
const importSettings = async (request, reply) => {
  const { user } = request;
  const { settings, privacySettings, exportDate, version } = request.body;

  try {
    console.log('Importing settings for user:', user.id);

    // Validate backup data
    if (!settings) {
      throw new ConflictError('Invalid backup data: settings missing');
    }

    // Import settings
    const importData = {
      ...settings,
      privacySettings: privacySettings || {},
      lastImportDate: moment().toISOString(),
      importedFromBackup: {
        exportDate,
        version,
      },
    };

    // Update settings in database
    await FlowModel.updateUserSettings(user.id, importData);

    // Get updated settings
    const updatedSettings = await FlowModel.getUserSettings(user.id);
    const finalSettings = {
      ...DEFAULT_SETTINGS,
      ...updatedSettings,
    };

    return reply.send({
      success: true,
      data: finalSettings,
      message: 'Settings imported successfully',
    });
  } catch (error) {
    console.error('Error in importSettings:', error);
    request.log.error({ error: error.message, userId: user.id }, 'Failed to import settings');
    throw new ConflictError('Failed to import settings');
  }
};

/**
 * Complete privacy setup
 */
const completePrivacySetup = async (request, reply) => {
  const { user } = request;
  const {
    allowCloudSync = true,
    allowAnalytics = true,
    allowCrashReports = true,
    allowUsageStats = true,
    allowPersonalizedAds = false,
  } = request.body;

  try {
    console.log('Completing privacy setup for user:', user.id);

    // Get current settings
    const currentSettings = (await FlowModel.getUserSettings(user.id)) || {};

    // Update settings based on privacy choices
    currentSettings.syncEnabled = allowCloudSync;
    currentSettings.dataSharing = {
      analytics: allowAnalytics,
      crashReports: allowCrashReports,
      usageStats: allowUsageStats,
      personalizedAds: allowPersonalizedAds,
    };

    // Update privacy settings
    currentSettings.privacySettings = {
      completed: true,
      completedAt: moment().toISOString(),
      choices: {
        allowCloudSync,
        allowAnalytics,
        allowCrashReports,
        allowUsageStats,
        allowPersonalizedAds,
      },
    };

    // Update settings in database
    await FlowModel.updateUserSettings(user.id, currentSettings);

    // Get updated settings
    const updatedSettings = await FlowModel.getUserSettings(user.id);
    const settings = {
      ...DEFAULT_SETTINGS,
      ...updatedSettings,
    };

    return reply.send({
      success: true,
      data: settings,
      message: 'Privacy setup completed successfully',
    });
  } catch (error) {
    console.error('Error in completePrivacySetup:', error);
    request.log.error(
      { error: error.message, userId: user.id },
      'Failed to complete privacy setup'
    );
    throw new ConflictError('Failed to complete privacy setup');
  }
};

/**
 * Get privacy summary
 */
const getPrivacySummary = async (request, reply) => {
  const { user } = request;

  try {
    console.log('Getting privacy summary for user:', user.id);

    // Get current settings
    const currentSettings = (await FlowModel.getUserSettings(user.id)) || {};
    const privacySettings = currentSettings.privacySettings || {};
    const dataSharing = currentSettings.dataSharing || DEFAULT_SETTINGS.dataSharing;

    const privacySummary = {
      syncEnabled: currentSettings.syncEnabled !== false,
      analyticsEnabled: dataSharing.analytics !== false,
      crashReportsEnabled: dataSharing.crashReports !== false,
      usageStatsEnabled: dataSharing.usageStats !== false,
      personalizedAdsEnabled: dataSharing.personalizedAds === true,
      dataSharingLevel: getDataSharingLevelValue(dataSharing),
      privacySetupCompleted: privacySettings.completed === true,
      completedAt: privacySettings.completedAt,
    };

    return reply.send({
      success: true,
      data: privacySummary,
    });
  } catch (error) {
    console.error('Error in getPrivacySummary:', error);
    request.log.error({ error: error.message, userId: user.id }, 'Failed to get privacy summary');
    throw new ConflictError('Failed to retrieve privacy summary');
  }
};

/**
 * Get data sharing level
 */
const getDataSharingLevel = async (request, reply) => {
  const { user } = request;

  try {
    console.log('Getting data sharing level for user:', user.id);

    // Get current settings
    const currentSettings = (await FlowModel.getUserSettings(user.id)) || {};
    const dataSharing = currentSettings.dataSharing || DEFAULT_SETTINGS.dataSharing;

    const level = getDataSharingLevelValue(dataSharing);

    return reply.send({
      success: true,
      data: { level },
    });
  } catch (error) {
    console.error('Error in getDataSharingLevel:', error);
    request.log.error(
      { error: error.message, userId: user.id },
      'Failed to get data sharing level'
    );
    throw new ConflictError('Failed to retrieve data sharing level');
  }
};

/**
 * Check if privacy setup is completed
 */
const hasCompletedPrivacySetup = async (request, reply) => {
  const { user } = request;

  try {
    console.log('Checking privacy setup status for user:', user.id);

    // Get current settings
    const currentSettings = (await FlowModel.getUserSettings(user.id)) || {};
    const privacySettings = currentSettings.privacySettings || {};

    const completed = privacySettings.completed === true;

    return reply.send({
      success: true,
      data: { completed },
    });
  } catch (error) {
    console.error('Error in hasCompletedPrivacySetup:', error);
    request.log.error(
      { error: error.message, userId: user.id },
      'Failed to check privacy setup status'
    );
    throw new ConflictError('Failed to check privacy setup status');
  }
};

// Helper functions
const getDataSharingLevelValue = dataSharing => {
  const enabledCount = Object.values(dataSharing).filter(Boolean).length;
  const totalCount = Object.keys(dataSharing).length;

  if (enabledCount === 0) return 'minimal';
  if (enabledCount === totalCount) return 'full';
  if (enabledCount <= totalCount / 2) return 'limited';
  return 'moderate';
};

module.exports = {
  getUserSettings,
  updateUserSettings,
  updateSetting,
  updatePrivacySetting,
  resetSettings,
  resetPrivacySettings,
  syncSettings,
  exportSettings,
  importSettings,
  completePrivacySetup,
  getPrivacySummary,
  getDataSharingLevel,
  hasCompletedPrivacySetup,
};
