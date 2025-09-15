// API SDK Configuration
// This file is auto-generated during deployment

// Production API URL (set during deployment)
export const API_BASE_URL = process.env.API_BASE_URL || 'https://flow-api-xxxxx-uc.a.run.app/v1';

// Development API URL (for local development)
export const DEV_API_BASE_URL = 'http://localhost:4000/v1';

// Current environment
export const isProduction = process.env.NODE_ENV === 'production';

// Get the appropriate API URL based on environment
export const getApiUrl = () => {
  if (isProduction) {
    return API_BASE_URL;
  }
  return DEV_API_BASE_URL;
};

// API Configuration
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Endpoints
export const ENDPOINTS = {
  // Flows
  FLOWS: '/flows',
  FLOW_BY_ID: (id) => `/flows/${id}`,
  FLOW_SEARCH: '/flows/search',
  
  // Flow Entries
  FLOW_ENTRIES: '/flow-entries',
  FLOW_ENTRY_BY_ID: (id) => `/flow-entries/${id}`,
  TODAY_ENTRIES: '/flow-entries/today',
  BULK_ENTRIES: '/flow-entries/bulk',
  
  // Statistics
  USER_STATS: (userId) => `/stats/users/${userId}`,
  LEADERBOARD: '/stats/leaderboard',
  FLOW_STATS: (flowId) => `/stats/flows/${flowId}`,
  TRENDS: '/stats/trends',
  GLOBAL_STATS: '/stats/global',
  
  // Plans
  PLANS: '/plans',
  PLAN_BY_ID: (id) => `/plans/${id}`,
  JOIN_PLAN: (id) => `/plans/${id}/join`,
  LEAVE_PLAN: (id) => `/plans/${id}/leave`,
  
  // Profiles
  PROFILE_BY_ID: (userId) => `/profiles/${userId}`,
  PROFILE_SEARCH: '/profiles/search',
  
  // Settings
  SETTINGS: '/settings',
  
  // Health
  HEALTH: '/health',
};

// Error codes
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

// Default export
export default {
  API_BASE_URL,
  DEV_API_BASE_URL,
  isProduction,
  getApiUrl,
  API_CONFIG,
  ENDPOINTS,
  ERROR_CODES,
};
