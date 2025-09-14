// Base types
const BaseEntity = {
  id: 'string',
  schemaVersion: 'number',
  createdAt: 'string',
  updatedAt: 'string',
  deletedAt: 'string | null'
};

// Flow types
const TrackingType = ['Binary', 'Quantitative', 'Time-based'];
const Frequency = ['Daily', 'Weekly', 'Monthly'];
const ProgressMode = ['sum', 'average', 'latest'];
const Visibility = ['private', 'friends', 'public'];

const Goal = {
  type: ['number', 'duration', 'count'],
  value: 'number',
  unit: 'string'
};

const Flow = {
  ...BaseEntity,
  title: 'string',
  description: 'string',
  trackingType: TrackingType,
  frequency: Frequency,
  everyDay: 'boolean',
  daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  reminderTime: 'string',
  reminderLevel: ['1', '2', '3'],
  cheatMode: 'boolean',
  planId: 'string | null',
  goal: Goal,
  progressMode: ProgressMode,
  tags: 'string[]',
  archived: 'boolean',
  visibility: Visibility,
  ownerId: 'string'
};

// FlowEntry types
const Symbol = ['✓', '✗', '+'];

const QuantitativeData = {
  unitText: 'string',
  count: 'number'
};

const TimeBasedData = {
  totalDuration: 'number',
  segments: [{
    start: 'string',
    end: 'string',
    duration: 'number'
  }]
};

const GeoLocation = {
  lat: 'number',
  lng: 'number',
  accuracy: 'number'
};

const FlowEntry = {
  ...BaseEntity,
  flowId: 'string',
  date: 'string',
  symbol: Symbol,
  emotion: 'string',
  moodScore: 'number',
  note: 'string',
  quantitative: QuantitativeData,
  timebased: TimeBasedData,
  device: ['mobile', 'web', 'api'],
  geo: GeoLocation,
  streakCount: 'number',
  edited: 'boolean',
  editedBy: 'string',
  editedAt: 'string',
  timestamp: 'string'
};

// Plan types
const PlanKind = ['Challenge', 'Template', 'CoachPlan'];
const PlanType = ['Public', 'Private', 'Group'];
const PlanStatus = ['draft', 'active', 'archived'];

const PlanRules = {
  frequency: Frequency,
  scoring: {
    pointsPerEntry: 'number',
    streakBonus: 'number',
    cheatModePenalty: 'number'
  },
  cheatModePolicy: ['allowed', 'penalty', 'forbidden']
};

const Plan = {
  ...BaseEntity,
  title: 'string',
  category: 'string',
  planKind: PlanKind,
  type: PlanType,
  visibility: Visibility,
  participants: 'string[]',
  startDate: 'string',
  endDate: 'string',
  status: PlanStatus,
  rules: PlanRules,
  tags: 'string[]',
  ownerId: 'string'
};

// UserProfile types
const SocialLink = {
  platform: 'string',
  url: 'string'
};

const ProfileTheme = {
  color: 'string',
  banner: 'string'
};

const ProfileVisibility = {
  bio: 'boolean',
  stats: 'boolean',
  plans: 'boolean'
};

const UserStats = {
  totalFlows: 'number',
  totalEntries: 'number',
  currentStreak: 'number',
  longestStreak: 'number',
  joinDate: 'string'
};

const UserProfile = {
  ...BaseEntity,
  username: 'string',
  displayName: 'string',
  avatarUrl: 'string',
  bio: 'string',
  stats: UserStats,
  achievements: 'string[]',
  badges: 'string[]',
  links: [SocialLink],
  profileTheme: ProfileTheme,
  visibility: ProfileVisibility,
  userId: 'string'
};

// UserSettings types
const UIPreferences = {
  theme: ['light', 'dark', 'auto'],
  accentColor: 'string',
  textSize: ['small', 'medium', 'large'],
  highContrast: 'boolean'
};

const HabitDefaults = {
  type: TrackingType,
  goalFrequency: Frequency,
  repeatTimesPerWeek: 'number'
};

const ReminderSettings = {
  dailyReminders: 'boolean',
  quietHours: {
    start: 'string',
    end: 'string'
  },
  timezone: 'string'
};

const PrivacySettings = {
  profileVisibility: Visibility,
  allowFriendRequests: 'boolean',
  showInLeaderboards: 'boolean'
};

const IntegrationSettings = {
  wearables: 'string[]',
  externalApps: 'string[]'
};

const UserSettings = {
  ...BaseEntity,
  uiPreferences: UIPreferences,
  habitDefaults: HabitDefaults,
  reminders: ReminderSettings,
  privacy: PrivacySettings,
  integrations: IntegrationSettings,
  backupFrequency: ['daily', 'weekly', 'monthly'],
  dataRetention: 'number', // days
  exportFormat: ['json', 'csv'],
  cheatMode: 'boolean',
  userId: 'string'
};

// API Response types
const ApiResponse = {
  success: 'boolean',
  data: 'any',
  error: 'string',
  message: 'string'
};

const PaginatedResponse = {
  success: 'boolean',
  data: 'any[]',
  pagination: {
    page: 'number',
    limit: 'number',
    total: 'number',
    totalPages: 'number'
  }
};

// Request types
const CreateFlowRequest = {
  title: 'string',
  description: 'string',
  trackingType: TrackingType,
  frequency: Frequency,
  everyDay: 'boolean',
  daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  reminderTime: 'string',
  reminderLevel: ['1', '2', '3'],
  cheatMode: 'boolean',
  planId: 'string',
  goal: Goal,
  progressMode: ProgressMode,
  tags: 'string[]',
  visibility: Visibility
};

const UpdateFlowRequest = {
  ...CreateFlowRequest,
  archived: 'boolean'
};

const CreateFlowEntryRequest = {
  flowId: 'string',
  date: 'string',
  symbol: Symbol,
  emotion: 'string',
  moodScore: 'number',
  note: 'string',
  quantitative: QuantitativeData,
  timebased: TimeBasedData,
  device: ['mobile', 'web', 'api'],
  geo: GeoLocation
};

const UpdateFlowEntryRequest = CreateFlowEntryRequest;

const CreatePlanRequest = {
  title: 'string',
  category: 'string',
  planKind: PlanKind,
  type: PlanType,
  visibility: Visibility,
  startDate: 'string',
  endDate: 'string',
  rules: PlanRules,
  tags: 'string[]'
};

const UpdatePlanRequest = {
  ...CreatePlanRequest,
  status: PlanStatus,
  participants: 'string[]'
};

const UpdateProfileRequest = {
  username: 'string',
  displayName: 'string',
  avatarUrl: 'string',
  bio: 'string',
  links: [SocialLink],
  profileTheme: ProfileTheme,
  visibility: ProfileVisibility
};

const UpdateSettingsRequest = {
  uiPreferences: UIPreferences,
  habitDefaults: HabitDefaults,
  reminders: ReminderSettings,
  privacy: PrivacySettings,
  integrations: IntegrationSettings,
  backupFrequency: ['daily', 'weekly', 'monthly'],
  dataRetention: 'number',
  exportFormat: ['json', 'csv'],
  cheatMode: 'boolean'
};

// Export all types
module.exports = {
  // Base
  BaseEntity,
  
  // Flow
  TrackingType,
  Frequency,
  ProgressMode,
  Visibility,
  Goal,
  Flow,
  
  // FlowEntry
  Symbol,
  QuantitativeData,
  TimeBasedData,
  GeoLocation,
  FlowEntry,
  
  // Plan
  PlanKind,
  PlanType,
  PlanStatus,
  PlanRules,
  Plan,
  
  // UserProfile
  SocialLink,
  ProfileTheme,
  ProfileVisibility,
  UserStats,
  UserProfile,
  
  // UserSettings
  UIPreferences,
  HabitDefaults,
  ReminderSettings,
  PrivacySettings,
  IntegrationSettings,
  UserSettings,
  
  // API
  ApiResponse,
  PaginatedResponse,
  
  // Requests
  CreateFlowRequest,
  UpdateFlowRequest,
  CreateFlowEntryRequest,
  UpdateFlowEntryRequest,
  CreatePlanRequest,
  UpdatePlanRequest,
  UpdateProfileRequest,
  UpdateSettingsRequest
};
