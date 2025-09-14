// utils/validation.js
import validator from 'validator';
import moment from 'moment';

// Comprehensive validation system for Flow tracker
// Ensures data quality for flow creation, user inputs, and forms
// Usage: import { validateFlowTitle, validateFlowData, createValidator } from './validation';

/**
 * Validates flow title
 * @param {string} title
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateFlowTitle = (title) => {
  if (!title || !title.trim()) return { valid: false, error: 'Title is required' };
  if (title.trim().length < 3) return { valid: false, error: 'Title must be at least 3 characters' };
  if (title.trim().length > 100) return { valid: false, error: 'Title must be under 100 characters' };
  return { valid: true, error: null };
};

/**
 * Validates flow description
 * @param {string} description
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateFlowDescription = (description) => {
  if (description && description.length > 500) return { valid: false, error: 'Description must be under 500 characters' };
  return { valid: true, error: null };
};

/**
 * Validates tracking type
 * @param {string} trackingType
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateTrackingType = (trackingType) => {
  const validTypes = ['Binary', 'Quantitative', 'Time-based'];
  if (!validTypes.includes(trackingType)) return { valid: false, error: 'Invalid tracking type' };
  return { valid: true, error: null };
};

/**
 * Validates frequency
 * @param {string} frequency
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateFrequency = (frequency) => {
  const validFrequencies = ['Daily', 'Weekly', 'Monthly'];
  if (!validFrequencies.includes(frequency)) return { valid: false, error: 'Invalid frequency' };
  return { valid: true, error: null };
};

/**
 * Validates selected days for frequency
 * @param {string[]} selectedDays
 * @param {string} frequency
 * @param {boolean} everyDay
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateSelectedDays = (selectedDays, frequency, everyDay) => {
  if (frequency === 'Daily' && !everyDay && (!selectedDays || selectedDays.length === 0)) {
    return { valid: false, error: 'Please select at least one day or enable "Every Day"' };
  }
  if (frequency === 'Monthly' && (!selectedDays || selectedDays.length === 0)) {
    return { valid: false, error: 'Please select at least one day of the month' };
  }
  return { valid: true, error: null };
};

/**
 * Validates unit text for quantitative tracking
 * @param {string} unitText
 * @param {string} trackingType
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateUnitText = (unitText, trackingType) => {
  if (trackingType === 'Quantitative') {
    if (!unitText || !unitText.trim()) return { valid: false, error: 'Unit is required for Quantitative tracking' };
    if (unitText.trim().length > 20) return { valid: false, error: 'Unit must be under 20 characters' };
  }
  return { valid: true, error: null };
};

/**
 * Validates goal for quantitative tracking
 * @param {number|string} goal
 * @param {string} trackingType
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateGoal = (goal, trackingType) => {
  if (trackingType === 'Quantitative' && goal !== undefined && goal !== null && goal !== '') {
    const numGoal = typeof goal === 'string' ? parseInt(goal) : goal;
    if (isNaN(numGoal) || numGoal < 0) return { valid: false, error: 'Goal must be a non-negative number' };
    if (numGoal > 9999) return { valid: false, error: 'Goal must be under 9999' };
  }
  return { valid: true, error: null };
};

/**
 * Validates time-based duration
 * @param {number} hours
 * @param {number} minutes
 * @param {number} seconds
 * @param {string} trackingType
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateTimeDuration = (hours, minutes, seconds, trackingType) => {
  if (trackingType === 'Time-based') {
    if (hours === 0 && minutes === 0 && seconds === 0) {
      return { valid: false, error: 'Please set a non-zero goal duration for Time-based tracking' };
    }
    if (hours < 0 || hours > 23) return { valid: false, error: 'Hours must be between 0 and 23' };
    if (minutes < 0 || minutes > 59) return { valid: false, error: 'Minutes must be between 0 and 59' };
    if (seconds < 0 || seconds > 59) return { valid: false, error: 'Seconds must be between 0 and 59' };
  }
  return { valid: true, error: null };
};

/**
 * Validates reminder time
 * @param {Date|string|null} reminderTime
 * @param {boolean} reminderTimeEnabled
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateReminderTime = (reminderTime, reminderTimeEnabled) => {
  if (reminderTimeEnabled && reminderTime) {
    const time = moment(reminderTime);
    if (!time.isValid()) return { valid: false, error: 'Invalid reminder time format' };
  }
  return { valid: true, error: null };
};

/**
 * Validates reminder level
 * @param {string|number} reminderLevel
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateReminderLevel = (reminderLevel) => {
  const validLevels = ['1', '2', '3', 1, 2, 3];
  if (!validLevels.includes(reminderLevel)) return { valid: false, error: 'Invalid reminder level' };
  return { valid: true, error: null };
};

// ===== NEW V2 SCHEMA VALIDATIONS =====

/**
 * Validates username for profile
 * @param {string} username
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateUsername = (username) => {
  if (!username || !username.trim()) return { valid: false, error: 'Username is required' };
  const trimmed = username.trim();
  if (trimmed.length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
  if (trimmed.length > 20) return { valid: false, error: 'Username must be under 20 characters' };
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  return { valid: true, error: null };
};

/**
 * Validates plan kind
 * @param {string} planKind
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validatePlanKind = (planKind) => {
  const validKinds = ['Challenge', 'Template', 'CoachPlan'];
  if (!validKinds.includes(planKind)) return { valid: false, error: 'Invalid plan kind' };
  return { valid: true, error: null };
};

/**
 * Validates plan status
 * @param {string} status
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validatePlanStatus = (status) => {
  const validStatuses = ['draft', 'active', 'archived'];
  if (!validStatuses.includes(status)) return { valid: false, error: 'Invalid plan status' };
  return { valid: true, error: null };
};

/**
 * Validates progress mode
 * @param {string} progressMode
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateProgressMode = (progressMode) => {
  const validModes = ['sum', 'average', 'latest'];
  if (!validModes.includes(progressMode)) return { valid: false, error: 'Invalid progress mode' };
  return { valid: true, error: null };
};

/**
 * Validates visibility level
 * @param {string} visibility
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateVisibility = (visibility) => {
  const validLevels = ['private', 'friends', 'public'];
  if (!validLevels.includes(visibility)) return { valid: false, error: 'Invalid visibility level' };
  return { valid: true, error: null };
};

/**
 * Validates tags array
 * @param {string[]} tags
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateTags = (tags) => {
  if (!Array.isArray(tags)) return { valid: false, error: 'Tags must be an array' };
  if (tags.length > 10) return { valid: false, error: 'Maximum 10 tags allowed' };
  
  for (const tag of tags) {
    if (typeof tag !== 'string') return { valid: false, error: 'All tags must be strings' };
    if (tag.length === 0) return { valid: false, error: 'Tags cannot be empty' };
    if (tag.length > 30) return { valid: false, error: 'Tags must be under 30 characters' };
  }
  
  return { valid: true, error: null };
};

/**
 * Validates mood score
 * @param {number} moodScore
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateMoodScore = (moodScore) => {
  if (moodScore !== null && moodScore !== undefined) {
    const score = typeof moodScore === 'string' ? parseInt(moodScore) : moodScore;
    if (isNaN(score) || score < 1 || score > 5) {
      return { valid: false, error: 'Mood score must be between 1 and 5' };
    }
  }
  return { valid: true, error: null };
};

/**
 * Validates device type
 * @param {string} device
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateDevice = (device) => {
  const validDevices = ['mobile', 'web', 'api'];
  if (!validDevices.includes(device)) return { valid: false, error: 'Invalid device type' };
  return { valid: true, error: null };
};

/**
 * Validates goal object for flows
 * @param {object} goal
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateGoalObject = (goal) => {
  if (!goal) return { valid: true, error: null }; // Optional field
  
  if (typeof goal !== 'object') return { valid: false, error: 'Goal must be an object' };
  
  const validTypes = ['number', 'duration', 'count'];
  if (!validTypes.includes(goal.type)) return { valid: false, error: 'Invalid goal type' };
  
  if (typeof goal.value !== 'number' || goal.value < 0) {
    return { valid: false, error: 'Goal value must be a non-negative number' };
  }
  
  if (goal.unit && typeof goal.unit !== 'string') {
    return { valid: false, error: 'Goal unit must be a string' };
  }
  
  return { valid: true, error: null };
};

/**
 * Validates geo location data
 * @param {object} geo
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateGeo = (geo) => {
  if (!geo) return { valid: true, error: null }; // Optional field
  
  if (typeof geo !== 'object') return { valid: false, error: 'Geo must be an object' };
  
  if (typeof geo.lat !== 'number' || geo.lat < -90 || geo.lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }
  
  if (typeof geo.lng !== 'number' || geo.lng < -180 || geo.lng > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }
  
  if (geo.accuracy !== undefined && (typeof geo.accuracy !== 'number' || geo.accuracy < 0)) {
    return { valid: false, error: 'Accuracy must be a non-negative number' };
  }
  
  return { valid: true, error: null };
};

/**
 * Validates social links array
 * @param {object[]} links
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateSocialLinks = (links) => {
  if (!Array.isArray(links)) return { valid: false, error: 'Links must be an array' };
  if (links.length > 10) return { valid: false, error: 'Maximum 10 links allowed' };
  
  const validPlatforms = ['twitter', 'linkedin', 'github', 'instagram', 'facebook', 'youtube', 'tiktok', 'website'];
  
  for (const link of links) {
    if (typeof link !== 'object') return { valid: false, error: 'All links must be objects' };
    if (!validPlatforms.includes(link.platform)) return { valid: false, error: 'Invalid platform' };
    if (!validator.isURL(link.url)) return { valid: false, error: 'Invalid URL format' };
    if (link.label && typeof link.label !== 'string') return { valid: false, error: 'Link label must be a string' };
    if (link.label && link.label.length > 50) return { valid: false, error: 'Link label must be under 50 characters' };
  }
  
  return { valid: true, error: null };
};

/**
 * Validates achievements array
 * @param {object[]} achievements
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateAchievements = (achievements) => {
  if (!Array.isArray(achievements)) return { valid: false, error: 'Achievements must be an array' };
  
  const validCategories = ['streak', 'milestone', 'social', 'challenge', 'special'];
  
  for (const achievement of achievements) {
    if (typeof achievement !== 'object') return { valid: false, error: 'All achievements must be objects' };
    if (!achievement.id || typeof achievement.id !== 'string') return { valid: false, error: 'Achievement ID is required' };
    if (!achievement.name || typeof achievement.name !== 'string') return { valid: false, error: 'Achievement name is required' };
    if (achievement.name.length > 100) return { valid: false, error: 'Achievement name must be under 100 characters' };
    if (!moment(achievement.earnedAt).isValid()) return { valid: false, error: 'Invalid earned date' };
    if (achievement.category && !validCategories.includes(achievement.category)) {
      return { valid: false, error: 'Invalid achievement category' };
    }
  }
  
  return { valid: true, error: null };
};

/**
 * Validates email per RFC 5322
 * @param {string} email
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateEmail = (email) => {
  if (!validator.isEmail(email)) return { valid: false, error: 'Invalid email format' };
  return { valid: true, error: null };
};

/**
 * Validates numeric input
 * @param {string|number} value
 * @param {number} min
 * @param {number} max
 * @param {string} fieldName
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateNumericInput = (value, min = 0, max = 9999, fieldName = 'Value') => {
  if (value === '' || value === null || value === undefined) return { valid: true, error: null };
  
  const numValue = typeof value === 'string' ? parseInt(value) : value;
  if (isNaN(numValue)) return { valid: false, error: `${fieldName} must be a valid number` };
  if (numValue < min) return { valid: false, error: `${fieldName} must be at least ${min}` };
  if (numValue > max) return { valid: false, error: `${fieldName} must be at most ${max}` };
  
  return { valid: true, error: null };
};

/**
 * Creates validator from schema
 * @param {object} schema - { field: (value) => { valid, error } }
 * @param {object} options
 * @returns {(data: object) => { valid: boolean, errors: object }}
 */
export const createValidator = (schema, options = { async: false }) => {
  return async (data) => {
    const errors = {};
    let valid = true;

    for (const [field, validatorFn] of Object.entries(schema)) {
      const result = options.async ? await validatorFn(data[field]) : validatorFn(data[field]);
      if (!result.valid) {
        valid = false;
        errors[field] = result.error;
      }
    }

    return { valid, errors };
  };
};

/**
 * Comprehensive flow validation schema (v2)
 */
export const flowValidationSchema = {
  // Required fields
  title: validateFlowTitle,
  trackingType: validateTrackingType,
  frequency: validateFrequency,
  
  // Optional fields
  description: validateFlowDescription,
  unitText: (value, data) => validateUnitText(value, data.trackingType),
  goal: (value, data) => validateGoal(value, data.trackingType),
  hours: (value, data) => validateTimeDuration(value, data.minutes, data.seconds, data.trackingType),
  minutes: (value, data) => validateTimeDuration(data.hours, value, data.seconds, data.trackingType),
  seconds: (value, data) => validateTimeDuration(data.hours, data.minutes, value, data.trackingType),
  reminderTime: (value, data) => validateReminderTime(value, data.reminderTimeEnabled),
  reminderLevel: validateReminderLevel,
  selectedDays: (value, data) => validateSelectedDays(value, data.frequency, data.everyDay),
  
  // New v2 fields
  planId: (value) => value ? { valid: true, error: null } : { valid: true, error: null }, // Optional
  goal: validateGoalObject,
  progressMode: validateProgressMode,
  tags: validateTags,
  visibility: validateVisibility,
};

/**
 * Plan validation schema (v2)
 */
export const planValidationSchema = {
  // Required fields
  title: validateFlowTitle, // Reuse title validation
  planKind: validatePlanKind,
  
  // Optional fields
  description: validateFlowDescription,
  status: validatePlanStatus,
  tags: validateTags,
  visibility: validateVisibility,
  
  // Date fields
  startDate: (value) => value ? (moment(value).isValid() ? { valid: true, error: null } : { valid: false, error: 'Invalid start date' }) : { valid: true, error: null },
  endDate: (value) => value ? (moment(value).isValid() ? { valid: true, error: null } : { valid: false, error: 'Invalid end date' }) : { valid: true, error: null },
};

/**
 * Profile validation schema (v2)
 */
export const profileValidationSchema = {
  // Required fields
  username: validateUsername,
  displayName: validateFlowTitle, // Reuse title validation
  
  // Optional fields
  bio: validateFlowDescription,
  links: validateSocialLinks,
  achievements: validateAchievements,
  
  // Theme validation
  profileTheme: (theme) => {
    if (!theme) return { valid: true, error: null };
    if (typeof theme !== 'object') return { valid: false, error: 'Profile theme must be an object' };
    
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (theme.primaryColor && !colorRegex.test(theme.primaryColor)) {
      return { valid: false, error: 'Invalid primary color format' };
    }
    if (theme.secondaryColor && !colorRegex.test(theme.secondaryColor)) {
      return { valid: false, error: 'Invalid secondary color format' };
    }
    if (theme.accentColor && !colorRegex.test(theme.accentColor)) {
      return { valid: false, error: 'Invalid accent color format' };
    }
    
    return { valid: true, error: null };
  },
};

/**
 * FlowEntry validation schema (v2)
 */
export const flowEntryValidationSchema = {
  // Required fields
  flowId: (value) => value ? { valid: true, error: null } : { valid: false, error: 'Flow ID is required' },
  date: (value) => moment(value).isValid() ? { valid: true, error: null } : { valid: false, error: 'Invalid date' },
  symbol: (value) => ['✓', '✗', '+'].includes(value) ? { valid: true, error: null } : { valid: false, error: 'Invalid symbol' },
  
  // Optional fields
  moodScore: validateMoodScore,
  device: validateDevice,
  geo: validateGeo,
  note: (value) => value && value.length > 1000 ? { valid: false, error: 'Note must be under 1000 characters' } : { valid: true, error: null },
};

/**
 * Validates complete flow data (v2)
 * @param {object} flowData
 * @returns {{ valid: boolean, errors: object }}
 */
export const validateFlowData = async (flowData) => {
  const validator = createValidator(flowValidationSchema);
  return await validator(flowData);
};

/**
 * Validates complete plan data (v2)
 * @param {object} planData
 * @returns {{ valid: boolean, errors: object }}
 */
export const validatePlanData = async (planData) => {
  const validator = createValidator(planValidationSchema);
  return await validator(planData);
};

/**
 * Validates complete profile data (v2)
 * @param {object} profileData
 * @returns {{ valid: boolean, errors: object }}
 */
export const validateProfileData = async (profileData) => {
  const validator = createValidator(profileValidationSchema);
  return await validator(profileData);
};

/**
 * Validates complete flow entry data (v2)
 * @param {object} entryData
 * @returns {{ valid: boolean, errors: object }}
 */
export const validateFlowEntryData = async (entryData) => {
  const validator = createValidator(flowEntryValidationSchema);
  return await validator(entryData);
};

/**
 * Validates settings data (v2) - modular structure
 * @param {object} settingsData
 * @returns {{ valid: boolean, errors: object }}
 */
export const validateSettingsData = async (settingsData) => {
  const errors = {};
  let valid = true;

  // Validate each module
  const modules = ['uiPreferences', 'reminders', 'privacy', 'integrations', 'analyticsConsent', 'backupSettings', 'flowDefaults', 'scoring', 'emotionalLogging', 'clinician', 'profile'];
  
  for (const module of modules) {
    if (settingsData[module] && typeof settingsData[module] === 'object') {
      // Basic object validation - could be expanded with specific field validation
      const moduleData = settingsData[module];
      if (module === 'profile' && moduleData.email) {
        const emailResult = validateEmail(moduleData.email);
        if (!emailResult.valid) {
          valid = false;
          errors[`${module}.email`] = emailResult.error;
        }
      }
    }
  }

  return { valid, errors };
};