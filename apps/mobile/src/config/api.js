// src/config/api.js
/**
 * API Configuration for Flow Mobile App
 * Handles different environments and network configurations
 */

import { Platform } from 'react-native';

// API Configuration
const API_CONFIG = {
  // Development URLs - Use production API for consistency
  development: {
    // For Android emulator
    android: 'https://flow-api-891963913698.us-central1.run.app',
    // For iOS simulator
    ios: 'https://flow-api-891963913698.us-central1.run.app',
    // For physical device
    device: 'https://flow-api-891963913698.us-central1.run.app',
  },
  
  // Production URL - GCP Cloud Run
  production: {
    android: 'https://flow-api-891963913698.us-central1.run.app',
    ios: 'https://flow-api-891963913698.us-central1.run.app',
    device: 'https://flow-api-891963913698.us-central1.run.app',
  }
};

// Get current environment
const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

// Get current platform
const getPlatform = () => {
  return Platform.OS;
};

// Get API base URL
const getApiBaseUrl = () => {
  const env = getEnvironment();
  const platform = getPlatform();
  
  // Check if custom URL is provided via environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Use environment-specific URL
  const config = API_CONFIG[env];
  
  if (config) {
    // For development, try to detect if running on device or emulator
    if (env === 'development') {
      // You can add logic here to detect device vs emulator
      // For now, default to Android emulator IP
      return config.android;
    }
    
    return config[platform] || config.android;
  }
  
  // Fallback
  return 'https://flow-api-891963913698.us-central1.run.app';
};

// API Configuration object
const config = {
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': 'flow-mobile-v1',
    'X-Platform': Platform.OS,
  },
};

// Log configuration for debugging
console.log('🌐 API Configuration:');
console.log('  Environment:', getEnvironment());
console.log('  Platform:', getPlatform());
console.log('  Base URL:', config.baseURL);

export default config;