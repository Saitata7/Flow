/**
 * Global constants for Flow data models
 */

// API Version
export const API_VERSION = '2.0.0';

// Schema Versions
export const SCHEMA_VERSIONS = {
  FLOW: 2,
  FLOW_ENTRY: 2,
  PLAN: 2,
  PROFILE: 2,
  SETTINGS: 2
};

// Common Enums
export const VISIBILITY_LEVELS = {
  PRIVATE: 'private',
  FRIENDS: 'friends',
  PUBLIC: 'public',
  GROUP: 'group'
};

export const PLAN_KINDS = {
  CHALLENGE: 'Challenge',
  TEMPLATE: 'Template',
  COACH_PLAN: 'CoachPlan'
};

export const PLAN_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived'
};

export const PROGRESS_MODES = {
  SUM: 'sum',
  AVERAGE: 'average',
  LATEST: 'latest'
};

export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  WEB: 'web',
  API: 'api'
};

export const SOCIAL_PLATFORMS = {
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  GITHUB: 'github',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  YOUTUBE: 'youtube',
  TIKTOK: 'tiktok'
};

export const BACKUP_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MANUAL: 'manual'
};

export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  PDF: 'pdf'
};

export const DATA_RETENTION_PERIODS = {
  ONE_MONTH: '1month',
  THREE_MONTHS: '3months',
  SIX_MONTHS: '6months',
  ONE_YEAR: '1year',
  FOREVER: 'forever'
};
