// src/config/api.js
/**
 * API Configuration for Flow Mobile App
 * Handles different environments and network configurations
 */

import { Platform } from 'react-native';

// API Configuration
const API_CONFIG = {
  // Development URLs - Use environment variables
  development: {
    // For Android emulator
    android: process.env.EXPO_PUBLIC_API_URL || 'https://flow-api-891963913698.us-central1.run.app',
    // For iOS simulator
    ios: process.env.EXPO_PUBLIC_API_URL || 'https://flow-api-891963913698.us-central1.run.app',
    // For physical device
    device: process.env.EXPO_PUBLIC_API_URL || 'https://flow-api-891963913698.us-central1.run.app',
  },
  
  // Production URL - GCP Cloud Run
  production: {
    android: process.env.EXPO_PUBLIC_API_URL || 'https://flow-api-891963913698.us-central1.run.app',
    ios: process.env.EXPO_PUBLIC_API_URL || 'https://flow-api-891963913698.us-central1.run.app',
    device: process.env.EXPO_PUBLIC_API_URL || 'https://flow-api-891963913698.us-central1.run.app',
  }
};

// Get current environment
const getEnvironment = () => {
  try {
    return process.env.NODE_ENV || 'production'; // Default to production for release builds
  } catch (error) {
    console.warn('⚠️ Error getting environment, defaulting to production:', error);
    return 'production';
  }
};

// Get current platform
const getPlatform = () => {
  try {
    return Platform.OS || 'android'; // Default to android for release builds
  } catch (error) {
    console.warn('⚠️ Error getting platform, defaulting to android:', error);
    return 'android';
  }
};

// Get API base URL
const getApiBaseUrl = () => {
  try {
    const env = getEnvironment();
    const platform = getPlatform();
    
    console.log('🔍 API Config: Environment:', env, 'Platform:', platform);
    
    // Check if custom URL is provided via environment variable
    if (process.env.EXPO_PUBLIC_API_URL) {
      console.log('🔍 API Config: Using custom URL:', process.env.EXPO_PUBLIC_API_URL);
      return process.env.EXPO_PUBLIC_API_URL;
    }
    
    // Use environment-specific URL
    const config = API_CONFIG[env];
    if (config && config[platform]) {
      console.log('🔍 API Config: Using config URL:', config[platform]);
      return config[platform];
    }
    
    // Fallback to default URL
    console.log('🔍 API Config: Using fallback URL');
    return 'https://flow-api-891963913698.us-central1.run.app';
  } catch (error) {
    console.error('❌ Error getting API base URL:', error);
    return 'https://flow-api-891963913698.us-central1.run.app';
  }
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

export { getApiBaseUrl };
export default config;