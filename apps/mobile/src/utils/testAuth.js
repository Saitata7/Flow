// src/utils/testAuth.js
// Simple test script to verify authentication functionality

import mockAuthService from '../services/mockAuthService';

const testAuthentication = async () => {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Email/Password Registration
    console.log('1. Testing Email/Password Registration...');
    const registerResult = await mockAuthService.signUpWithEmail('test@example.com', 'password123');
    console.log('✅ Registration Result:', registerResult.success ? 'SUCCESS' : 'FAILED');
    if (!registerResult.success) {
      console.log('❌ Error:', registerResult.error);
    }
    console.log('');

    // Test 2: Email/Password Login
    console.log('2. Testing Email/Password Login...');
    const loginResult = await mockAuthService.signInWithEmail('test@example.com', 'password123');
    console.log('✅ Login Result:', loginResult.success ? 'SUCCESS' : 'FAILED');
    if (!loginResult.success) {
      console.log('❌ Error:', loginResult.error);
    }
    console.log('');

    // Test 3: Google Sign-In
    console.log('3. Testing Google Sign-In...');
    const googleResult = await mockAuthService.signInWithGoogle();
    console.log('✅ Google Sign-In Result:', googleResult.success ? 'SUCCESS' : 'FAILED');
    if (!googleResult.success) {
      console.log('❌ Error:', googleResult.error);
    }
    console.log('');

    // Test 4: Anonymous Sign-In
    console.log('4. Testing Anonymous Sign-In...');
    const anonResult = await mockAuthService.signInAnonymously();
    console.log('✅ Anonymous Sign-In Result:', anonResult.success ? 'SUCCESS' : 'FAILED');
    if (!anonResult.success) {
      console.log('❌ Error:', anonResult.error);
    }
    console.log('');

    // Test 5: Password Reset
    console.log('5. Testing Password Reset...');
    const resetResult = await mockAuthService.sendPasswordResetEmail('test@example.com');
    console.log('✅ Password Reset Result:', resetResult.success ? 'SUCCESS' : 'FAILED');
    if (!resetResult.success) {
      console.log('❌ Error:', resetResult.error);
    }
    console.log('');

    // Test 6: Auth State Listener
    console.log('6. Testing Auth State Listener...');
    const unsubscribe = mockAuthService.addAuthStateListener((user) => {
      console.log('✅ Auth State Changed:', user ? `User ${user.uid} signed in` : 'User signed out');
    });
    
    // Test sign in to trigger listener
    await mockAuthService.signInWithEmail('listener@example.com', 'password123');
    
    // Clean up
    unsubscribe();
    console.log('✅ Auth State Listener Test Complete');
    console.log('');

    console.log('🎉 All Authentication Tests Completed!');
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
};

export default testAuthentication;
