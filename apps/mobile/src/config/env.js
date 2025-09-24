// src/config/env.js
// Firebase Configuration from environment variables
// IMPORTANT: Create a .env file with your Firebase credentials
// Copy firebase-config-template.env to .env and fill in your values

const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN', 
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
];

// Check if all required environment variables are set
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('📝 Please create a .env file with your Firebase credentials');
  console.error('📋 Copy firebase-config-template.env to .env and fill in your values');
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// iOS specific configuration (optional)
const iosConfig = {
  apiKey: process.env.FIREBASE_IOS_API_KEY,
  appId: process.env.FIREBASE_IOS_APP_ID,
};

console.log('✅ Firebase environment variables loaded successfully');

export { firebaseConfig, iosConfig };
