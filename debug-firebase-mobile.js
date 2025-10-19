#!/usr/bin/env node

/**
 * Debug Firebase Authentication in Mobile App
 */

console.log('🔥 Debugging Firebase Authentication in Mobile App');
console.log('================================================================================');

// Check Firebase configuration files
const fs = require('fs');
const path = require('path');

const firebaseConfigPath = path.join(__dirname, 'apps/mobile/android/app/google-services.json');
const firebaseConfigTemplatePath = path.join(__dirname, 'apps/mobile/firebase-config-template.env');

console.log('📋 Checking Firebase Configuration Files:');
console.log('   google-services.json exists:', fs.existsSync(firebaseConfigPath));
console.log('   firebase-config-template.env exists:', fs.existsSync(firebaseConfigTemplatePath));

if (fs.existsSync(firebaseConfigPath)) {
  const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  console.log('   Project ID:', config.project_info.project_id);
  console.log('   Project Number:', config.project_info.project_number);
  console.log('   API Key:', config.client[0].api_key[0].current_key);
}

if (fs.existsSync(firebaseConfigTemplatePath)) {
  const template = fs.readFileSync(firebaseConfigTemplatePath, 'utf8');
  console.log('   Template content preview:', template.substring(0, 200) + '...');
}

// Check mobile app configuration
const mobileConfigPath = path.join(__dirname, 'apps/mobile/src/config/environment.js');
console.log('\n📱 Checking Mobile App Configuration:');
console.log('   environment.js exists:', fs.existsSync(mobileConfigPath));

if (fs.existsSync(mobileConfigPath)) {
  const config = fs.readFileSync(mobileConfigPath, 'utf8');
  console.log('   Contains API_BASE_URL:', config.includes('API_BASE_URL'));
  console.log('   Contains Firebase config:', config.includes('FIREBASE'));
}

// Check Firebase auth service
const firebaseAuthPath = path.join(__dirname, 'apps/mobile/src/services/firebaseAuth.js');
console.log('\n🔐 Checking Firebase Auth Service:');
console.log('   firebaseAuth.js exists:', fs.existsSync(firebaseAuthPath));

if (fs.existsSync(firebaseAuthPath)) {
  const auth = fs.readFileSync(firebaseAuthPath, 'utf8');
  console.log('   Contains React Native Firebase:', auth.includes('@react-native-firebase/auth'));
  console.log('   Contains signInWithEmail:', auth.includes('signInWithEmail'));
  console.log('   Contains getIdToken:', auth.includes('getIdToken'));
}

// Check API client
const apiClientPath = path.join(__dirname, 'apps/mobile/src/services/apiClient.js');
console.log('\n🌐 Checking API Client:');
console.log('   apiClient.js exists:', fs.existsSync(apiClientPath));

if (fs.existsSync(apiClientPath)) {
  const client = fs.readFileSync(apiClientPath, 'utf8');
  console.log('   Contains Firebase token handling:', client.includes('firebaseAuth'));
  console.log('   Contains Authorization header:', client.includes('Authorization'));
}

console.log('\n✅ Firebase Authentication Debug Complete');
console.log('================================================================================');
