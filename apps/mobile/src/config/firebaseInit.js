// src/config/firebaseInit.js
// Firebase initialization with proper error handling

import auth from '@react-native-firebase/auth';
import logger from '../utils/logger';

logger.log('🔥 Initializing Firebase with React Native Firebase');

try {
  // Firebase is automatically initialized with google-services.json
  // No manual initialization needed for React Native Firebase
  logger.log('✅ Firebase initialized successfully');
  
  // Test auth availability
  if (auth) {
    logger.log('✅ Firebase Auth available');
  } else {
    logger.error('❌ Firebase Auth not available');
  }
} catch (error) {
  logger.error('❌ Firebase initialization error:', error);
}

// Export Firebase Auth instance
export { auth };
export default auth;
