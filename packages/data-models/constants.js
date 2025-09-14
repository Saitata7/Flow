/**
 * Global constants for Flow data models
 */

// API Version
const API_VERSION = '2.0.0';

// Schema Versions
const SCHEMA_VERSIONS = {
  FLOW: 2,
  FLOW_ENTRY: 2,
  PLAN: 2,
  PROFILE: 2,
  SETTINGS: 2
};

// Common Enums
const VISIBILITY_LEVELS = {
  PRIVATE: 'private',
  FRIENDS: 'friends',
  PUBLIC: 'public',
  GROUP: 'group'
};

const PLAN_KINDS = {
  CHALLENGE: 'Challenge',
  TEMPLATE: 'Template',
  COACH_PLAN: 'CoachPlan'
};

const PLAN_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived'
};

const PROGRESS_MODES = {
  SUM: 'sum',
  AVERAGE: 'average',
  LATEST: 'latest'
};

const DEVICE_TYPES = {
  MOBILE: 'mobile',
  WEB: 'web',
  API: 'api'
};

const SOCIAL_PLATFORMS = {
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  GITHUB: 'github',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  YOUTUBE: 'youtube',
  TIKTOK: 'tiktok'
};

const BACKUP_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MANUAL: 'manual'
};

const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  PDF: 'pdf'
};

const DATA_RETENTION_PERIODS = {
  ONE_MONTH: '1month',
  THREE_MONTHS: '3months',
  SIX_MONTHS: '6months',
  ONE_YEAR: '1year',
  FOREVER: 'forever'
};

module.exports = {
  API_VERSION,
  SCHEMA_VERSIONS,
  VISIBILITY_LEVELS,
  PLAN_KINDS,
  PLAN_STATUS,
  PROGRESS_MODES,
  DEVICE_TYPES,
  SOCIAL_PLATFORMS,
  BACKUP_FREQUENCIES,
  EXPORT_FORMATS,
  DATA_RETENTION_PERIODS,
};
