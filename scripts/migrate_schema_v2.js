/**
 * Migration script for Flow schema v2 enhancements
 * Migrates existing data to new schema structure with all enhancements
 */

const { SCHEMA_VERSIONS } = require('../packages/data-models/constants');

/**
 * Migrate Flow schema to v2
 */
function migrateFlowToV2(flowData) {
  const migrated = {
    ...flowData,
    schemaVersion: SCHEMA_VERSIONS.FLOW,
    // Add new fields with defaults
    planId: flowData.planId || null,
    goal: flowData.goal || null,
    progressMode: flowData.progressMode || 'sum',
    tags: flowData.tags || [],
    archived: flowData.archived || false,
    visibility: flowData.visibility || 'private',
    deletedAt: flowData.deletedAt || null,
    // Ensure required fields
    createdAt: flowData.createdAt || new Date().toISOString(),
    updatedAt: flowData.updatedAt || new Date().toISOString()
  };

  return migrated;
}

/**
 * Migrate FlowEntry schema to v2
 */
function migrateFlowEntryToV2(flowEntryData) {
  const migrated = {
    ...flowEntryData,
    schemaVersion: SCHEMA_VERSIONS.FLOW_ENTRY,
    // Add new fields with defaults
    id: flowEntryData.id || generateId(),
    flowId: flowEntryData.flowId || null,
    moodScore: flowEntryData.moodScore || null,
    device: flowEntryData.device || 'mobile',
    geo: flowEntryData.geo || null,
    streakCount: flowEntryData.streakCount || 0,
    deletedAt: flowEntryData.deletedAt || null,
    // Ensure required fields
    createdAt: flowEntryData.createdAt || new Date().toISOString(),
    updatedAt: flowEntryData.updatedAt || new Date().toISOString()
  };

  return migrated;
}

/**
 * Migrate Plan schema to v2
 */
function migratePlanToV2(planData) {
  const migrated = {
    ...planData,
    schemaVersion: SCHEMA_VERSIONS.PLAN,
    // Add new fields with defaults
    description: planData.description || '',
    planKind: planData.planKind || mapLegacyTypeToPlanKind(planData.type),
    startDate: planData.startDate || null,
    endDate: planData.endDate || null,
    status: planData.status || 'draft',
    rules: planData.rules || {
      frequency: 'daily',
      scoring: {
        method: 'binary',
        pointsPerCompletion: 1
      },
      cheatModePolicy: 'flexible',
      maxParticipants: 100
    },
    tags: planData.tags || [],
    deletedAt: planData.deletedAt || null,
    // Ensure required fields
    createdAt: planData.createdAt || new Date().toISOString(),
    updatedAt: planData.updatedAt || new Date().toISOString()
  };

  return migrated;
}

/**
 * Migrate Profile schema to v2
 */
function migrateProfileToV2(profileData) {
  const migrated = {
    ...profileData,
    schemaVersion: SCHEMA_VERSIONS.PROFILE,
    // Add new fields with defaults
    username: profileData.username || generateUsername(profileData.displayName),
    joinedAt: profileData.joinedAt || profileData.createdAt || new Date().toISOString(),
    links: profileData.links || convertSocialToLinks(profileData.social),
    achievements: profileData.achievements || [],
    profileTheme: profileData.profileTheme || {
      primaryColor: '#007AFF',
      secondaryColor: '#5856D6',
      bannerUrl: null,
      accentColor: '#FF9500'
    },
    deletedAt: profileData.deletedAt || null,
    // Ensure required fields
    createdAt: profileData.createdAt || new Date().toISOString(),
    updatedAt: profileData.updatedAt || new Date().toISOString()
  };

  return migrated;
}

/**
 * Migrate Settings schema to v2 (restructured into modules)
 */
function migrateSettingsToV2(settingsData) {
  const migrated = {
    id: settingsData.id || generateId(),
    userId: settingsData.userId || null,
    schemaVersion: SCHEMA_VERSIONS.SETTINGS,
    // Restructure into modules
    uiPreferences: {
      theme: settingsData.theme || 'light',
      accentColor: settingsData.accentColor || '#007AFF',
      textSize: settingsData.textSize || 'medium',
      highContrast: settingsData.highContrast || false,
      defaultLandingPage: settingsData.appBehavior?.defaultLandingPage || 'dashboard'
    },
    reminders: {
      dailyReminders: settingsData.notifications?.dailyReminders || true,
      weeklyReports: settingsData.notifications?.weeklyReports || true,
      achievementAlerts: settingsData.notifications?.achievementAlerts || true,
      communityUpdates: settingsData.notifications?.communityUpdates || false,
      reminderTime: settingsData.notifications?.reminderTime || '09:00',
      quietHours: settingsData.notifications?.quietHours || {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    },
    privacy: {
      profileVisibility: settingsData.privacy?.profileVisibility || 'private',
      shareStats: settingsData.privacy?.shareStats || false,
      shareAchievements: settingsData.privacy?.shareAchievements || true,
      allowFriendRequests: settingsData.privacy?.allowFriendRequests || true,
      showOnlineStatus: settingsData.privacy?.showOnlineStatus || false,
      location: settingsData.location || {
        enabled: false,
        precision: 'city',
        shareLocation: false
      }
    },
    integrations: {
      wearables: settingsData.integrations?.wearables || [],
      externalApps: settingsData.integrations?.externalApps || [],
      social: settingsData.social || {
        shareProgress: false,
        communityChallenges: false,
        peerEncouragement: true
      }
    },
    analyticsConsent: {
      usageAnalytics: true,
      crashReporting: true,
      performanceMetrics: true,
      personalizedInsights: true
    },
    backupSettings: {
      backupFrequency: 'weekly',
      cloudBackup: settingsData.dataPrivacy?.cloudBackup || false,
      localBackup: settingsData.dataPrivacy?.localBackup || true,
      exportFormat: 'json',
      dataRetention: '1year',
      autoExport: false
    },
    flowDefaults: {
      cheatMode: settingsData.cheatMode || false,
      highlightDayStreak: settingsData.highlightDayStreak || true,
      closeTime: settingsData.closeTime || '23:59',
      type: settingsData.habitDefaults?.type || 'binary',
      goalFrequency: settingsData.habitDefaults?.goalFrequency || 'daily',
      repeatTimesPerWeek: settingsData.habitDefaults?.repeatTimesPerWeek || 7,
      reminderMethod: settingsData.habitDefaults?.reminderMethod || 'notification'
    },
    scoring: settingsData.scoring || {
      showDetailedStats: true,
      showEmotionNotes: true,
      motivationalInsights: true
    },
    emotionalLogging: settingsData.emotionalLogging || {
      promptFrequency: 'fail/skip',
      customEmotions: []
    },
    clinician: {
      enableDashboard: settingsData.clinician?.enableDashboard || false,
      sharedData: settingsData.clinician?.sharedData || 'stats',
      clinicians: settingsData.clinician?.clinicians || [],
      clinicianConsent: settingsData.dataPrivacy?.clinicianConsent || false
    },
    profile: settingsData.profile || {
      name: '',
      email: '',
      profilePicture: '',
      timeZone: 'UTC',
      language: 'en'
    },
    createdAt: settingsData.createdAt || new Date().toISOString(),
    updatedAt: settingsData.updatedAt || new Date().toISOString(),
    deletedAt: settingsData.deletedAt || null
  };

  return migrated;
}

// Helper functions
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function generateUsername(displayName) {
  if (!displayName) return `user_${generateId()}`;
  return displayName.toLowerCase().replace(/[^a-z0-9_-]/g, '').substr(0, 20) || `user_${generateId()}`;
}

function mapLegacyTypeToPlanKind(type) {
  const mapping = {
    'Public': 'Template',
    'Private': 'Challenge',
    'Group': 'Challenge'
  };
  return mapping[type] || 'Challenge';
}

function convertSocialToLinks(social) {
  if (!social) return [];
  
  const links = [];
  Object.entries(social).forEach(([platform, value]) => {
    if (value) {
      links.push({
        platform,
        url: value,
        label: platform.charAt(0).toUpperCase() + platform.slice(1)
      });
    }
  });
  
  return links;
}

// Export migration functions
module.exports = {
  migrateFlowToV2,
  migrateFlowEntryToV2,
  migratePlanToV2,
  migrateProfileToV2,
  migrateSettingsToV2
};
