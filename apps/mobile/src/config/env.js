// src/config/env.js
// Firebase Configuration from environment variables or fallback values

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAAji36Lb_YOtuQIt2nK_bk6aUC8PDU3ZI",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "quick-doodad-472200-k0.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "quick-doodad-472200-k0",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "quick-doodad-472200-k0.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "891963913698",
  appId: process.env.FIREBASE_APP_ID || "1:891963913698:android:2b12a4b7652a8d013275bb",
};

// iOS specific configuration
const iosConfig = {
  apiKey: process.env.FIREBASE_IOS_API_KEY || "AIzaSyBmOF722JixRJP4ia5BNHl-3cbyNOtyCzc",
  appId: process.env.FIREBASE_IOS_APP_ID || "1:891963913698:ios:d2ad7d67940456e53275bb",
};

export { firebaseConfig, iosConfig };
