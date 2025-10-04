/**
 * Firebase Native Configuration Service
 * 
 * This service ensures Firebase is properly initialized for native React Native
 * and provides utilities for Firebase Auth integration with backend APIs.
 */

import { Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

class FirebaseNativeService {
  constructor() {
    this.isInitialized = false;
    this.auth = auth();
    this.init();
  }

  /**
   * Initialize Firebase native services
   */
  async init() {
    try {
      console.log('🔥 Initializing Firebase Native Service...');

      // Configure Google Sign-In
      await this.configureGoogleSignIn();

      // Check if Firebase is already initialized
      if (this.auth.app) {
        console.log('✅ Firebase Auth already initialized');
        this.isInitialized = true;
        return;
      }

      // Wait for Firebase to be ready
      await this.waitForFirebase();

      this.isInitialized = true;
      console.log('✅ Firebase Native Service initialized successfully');
    } catch (error) {
      console.error('❌ Firebase Native Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Configure Google Sign-In
   */
  async configureGoogleSignIn() {
    try {
      // Configure Google Sign-In with your web client ID
      await GoogleSignin.configure({
        webClientId: '891963913698-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com', // TODO: Replace with your actual web client ID from Firebase Console
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });

      console.log('✅ Google Sign-In configured');
    } catch (error) {
      console.error('❌ Google Sign-In configuration failed:', error);
      throw error;
    }
  }

  /**
   * Wait for Firebase to be ready
   */
  async waitForFirebase() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Firebase initialization timeout'));
      }, 10000);

      const checkFirebase = () => {
        if (this.auth.app) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkFirebase, 100);
        }
      };

      checkFirebase();
    });
  }

  /**
   * Get Firebase Auth instance
   */
  getAuth() {
    if (!this.isInitialized) {
      throw new Error('Firebase Native Service not initialized');
    }
    return this.auth;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.auth.currentUser;
  }

  /**
   * Get Firebase ID token for API authentication
   */
  async getIdToken(forceRefresh = false) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      const token = await user.getIdToken(forceRefresh);
      console.log('🔑 Firebase ID token retrieved');
      return token;
    } catch (error) {
      console.error('❌ Failed to get Firebase ID token:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmailAndPassword(email, password) {
    try {
      console.log('🔐 Signing in with email and password...');
      
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      console.log('✅ Email/password sign-in successful');
      
      return {
        user: userCredential.user,
        token: await this.getIdToken(),
      };
    } catch (error) {
      console.error('❌ Email/password sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      console.log('🔐 Signing in with Google...');

      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices();

      // Get user info from Google
      const { idToken } = await GoogleSignin.signIn();

      // Create Firebase credential
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase
      const userCredential = await this.auth.signInWithCredential(googleCredential);
      
      console.log('✅ Google sign-in successful');
      
      return {
        user: userCredential.user,
        token: await this.getIdToken(),
      };
    } catch (error) {
      console.error('❌ Google sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Create user with email and password
   */
  async createUserWithEmailAndPassword(email, password) {
    try {
      console.log('👤 Creating user with email and password...');
      
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      console.log('✅ User creation successful');
      
      return {
        user: userCredential.user,
        token: await this.getIdToken(),
      };
    } catch (error) {
      console.error('❌ User creation failed:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      console.log('🚪 Signing out...');
      
      // Sign out from Google if signed in with Google
      if (await GoogleSignin.isSignedIn()) {
        await GoogleSignin.signOut();
      }
      
      // Sign out from Firebase
      await this.auth.signOut();
      
      console.log('✅ Sign-out successful');
    } catch (error) {
      console.error('❌ Sign-out failed:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email) {
    try {
      console.log('📧 Sending password reset email...');
      
      await this.auth.sendPasswordResetEmail(email);
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Password reset email failed:', error);
      throw error;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback) {
    return this.auth.onAuthStateChanged(callback);
  }

  /**
   * Get user profile data
   */
  getUserProfile() {
    const user = this.getCurrentUser();
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      providerData: user.providerData,
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      await user.updateProfile(updates);
      console.log('✅ User profile updated');
    } catch (error) {
      console.error('❌ User profile update failed:', error);
      throw error;
    }
  }

  /**
   * Verify if user is authenticated
   */
  isAuthenticated() {
    return !!this.getCurrentUser();
  }

  /**
   * Get authentication method
   */
  getAuthMethod() {
    const user = this.getCurrentUser();
    if (!user) return null;

    const providerData = user.providerData;
    if (providerData.length === 0) return 'email';

    const provider = providerData[0].providerId;
    switch (provider) {
      case 'google.com':
        return 'google';
      case 'password':
        return 'email';
      default:
        return provider;
    }
  }

  /**
   * Check if running on native platform
   */
  isNativePlatform() {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }

  /**
   * Get platform-specific configuration
   */
  getPlatformConfig() {
    return {
      platform: Platform.OS,
      isNative: this.isNativePlatform(),
      version: Platform.Version,
    };
  }
}

// Create singleton instance
const firebaseNativeService = new FirebaseNativeService();

export default firebaseNativeService;
