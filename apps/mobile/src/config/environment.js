// src/config/environment.js
/**
 * Environment Configuration for Flow Mobile App
 * Handles different environments and API endpoints
 */

import { Platform } from 'react-native';

// Environment configuration
const ENV_CONFIG = {
  development: {
    // API URLs for development - Use GCP Cloud Run server
    API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://flow-api-firebase-891963913698.us-central1.run.app',
    
    // JWT Configuration
    JWT_SECRET: process.env.EXPO_PUBLIC_JWT_SECRET || 'Flow-dev-secret-key-2024',
    JWT_EXPIRES_IN: '7d',
    
    // Debug settings
    DEBUG: true,
    LOG_LEVEL: 'debug',
  },
  
  production: {
    // API URLs for production - GCP Cloud Run
    API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://flow-api-firebase-891963913698.us-central1.run.app',
    
    // JWT Configuration
    JWT_SECRET: process.env.EXPO_PUBLIC_JWT_SECRET || 'Flow-prod-secret-key-2024',
    JWT_EXPIRES_IN: '7d',
    
    // Debug settings
    DEBUG: false,
    LOG_LEVEL: 'error',
  }
};

// Get current environment
const getCurrentEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

// Get environment configuration
const getEnvironmentConfig = () => {
  const env = getCurrentEnvironment();
  return ENV_CONFIG[env] || ENV_CONFIG.development;
};

// Get API base URL
const getApiBaseUrl = () => {
  // Check if custom URL is provided via environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  return getEnvironmentConfig().API_BASE_URL;
};

// Export configuration
export const config = {
  ...getEnvironmentConfig(),
  API_BASE_URL: getApiBaseUrl(),
  ENVIRONMENT: getCurrentEnvironment(),
  PLATFORM: Platform.OS,
};

// Log configuration for debugging (only in development)
if (config.DEBUG) {
  console.log('🌐 Environment Configuration:');
  console.log('  Environment:', config.ENVIRONMENT);
  console.log('  Platform:', config.PLATFORM);
  console.log('  API Base URL:', config.API_BASE_URL);
  console.log('  Debug Mode:', config.DEBUG);
}

export default config;
