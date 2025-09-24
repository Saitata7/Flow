// src/utils/firebaseTest.js
import firebaseAuthService from '../services/firebaseAuth';

export const testFirebaseConnection = async () => {
  try {
    console.log('🔥 Testing Firebase Authentication Connection...');
    
    // Test 1: Check if Firebase is initialized
    const currentUser = firebaseAuthService.getCurrentUser();
    console.log('✅ Firebase initialized:', currentUser ? 'User logged in' : 'No user');
    
    // Test 2: Test anonymous sign-in (for testing purposes)
    console.log('🧪 Testing anonymous sign-in...');
    const result = await firebaseAuthService.signInAnonymously();
    
    if (result.success) {
      console.log('✅ Anonymous sign-in successful');
      console.log('User ID:', result.user.uid);
      
      // Test 3: Test sign out
      console.log('🧪 Testing sign-out...');
      const signOutResult = await firebaseAuthService.signOut();
      
      if (signOutResult.success) {
        console.log('✅ Sign-out successful');
        console.log('🔥 Firebase Authentication is working correctly!');
        return true;
      } else {
        console.error('❌ Sign-out failed:', signOutResult.error);
        return false;
      }
    } else {
      console.error('❌ Anonymous sign-in failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    return false;
  }
};

export const testEmailPasswordAuth = async (email, password) => {
  try {
    console.log('🧪 Testing email/password authentication...');
    
    // Test sign up
    console.log('Testing sign up...');
    const signUpResult = await firebaseAuthService.signUpWithEmail(email, password);
    
    if (signUpResult.success) {
      console.log('✅ Sign up successful');
      
      // Test sign out
      await firebaseAuthService.signOut();
      
      // Test sign in
      console.log('Testing sign in...');
      const signInResult = await firebaseAuthService.signInWithEmail(email, password);
      
      if (signInResult.success) {
        console.log('✅ Sign in successful');
        console.log('🔥 Email/Password authentication is working correctly!');
        
        // Clean up - sign out
        await firebaseAuthService.signOut();
        return true;
      } else {
        console.error('❌ Sign in failed:', signInResult.error);
        return false;
      }
    } else {
      console.error('❌ Sign up failed:', signUpResult.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Email/password test failed:', error);
    return false;
  }
};

export const testGoogleSignIn = async () => {
  try {
    console.log('🧪 Testing Google Sign-In...');
    
    const result = await firebaseAuthService.signInWithGoogle();
    
    if (result.success) {
      console.log('✅ Google Sign-In successful');
      console.log('User ID:', result.user.uid);
      console.log('Email:', result.user.email);
      
      // Clean up - sign out
      await firebaseAuthService.signOut();
      console.log('🔥 Google Sign-In is working correctly!');
      return true;
    } else {
      console.error('❌ Google Sign-In failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Google Sign-In test failed:', error);
    return false;
  }
};
