// src/config/env.js
// Firebase Configuration for React Native
// Environment variables are handled via React Native's built-in support
// For development, you can set these in your app.json or use Expo's environment variables

// Default Firebase configuration (replace with your actual values)
const defaultFirebaseConfig = {
  apiKey: "your_firebase_api_key_here",
  authDomain: "your_project_id.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project_id.firebasestorage.app",
  messagingSenderId: "your_messaging_sender_id",
  appId: "your_android_app_id",
};

// iOS specific configuration (optional)
const defaultIosConfig = {
  apiKey: "your_ios_api_key_here",
  appId: "your_ios_app_id",
};

// Try to get environment variables, fallback to defaults
const getEnvVar = (key, defaultValue) => {
  // In React Native, process.env might not be available or might be undefined
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return defaultValue;
};

const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY', defaultFirebaseConfig.apiKey),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', defaultFirebaseConfig.authDomain),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', defaultFirebaseConfig.projectId),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', defaultFirebaseConfig.storageBucket),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', defaultFirebaseConfig.messagingSenderId),
  appId: getEnvVar('FIREBASE_APP_ID', defaultFirebaseConfig.appId),
};

const iosConfig = {
  apiKey: getEnvVar('FIREBASE_IOS_API_KEY', defaultIosConfig.apiKey),
  appId: getEnvVar('FIREBASE_IOS_APP_ID', defaultIosConfig.appId),
};

// Check if using default values (development mode)
const isUsingDefaults = firebaseConfig.apiKey === defaultFirebaseConfig.apiKey;

if (isUsingDefaults) {
  console.warn('⚠️ Using default Firebase configuration. Please update with your actual Firebase credentials.');
  console.warn('📝 For production, set environment variables or update the default configuration.');
} else {
  console.log('✅ Firebase configuration loaded successfully');
}

export { firebaseConfig, iosConfig };
