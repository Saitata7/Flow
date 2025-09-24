// src/config/firebase.js
import { firebaseConfig } from './env';

// Firebase configuration for React Native Firebase
const config = {
  // Android configuration
  android: {
    apiKey: firebaseConfig.apiKey,
    appId: firebaseConfig.appId,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
  },
  // iOS configuration  
  ios: {
    apiKey: firebaseConfig.apiKey,
    appId: firebaseConfig.appId,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
  },
};

export default config;
