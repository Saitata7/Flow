// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import apiService from '../services/apiService';
import sessionManager from '../utils/sessionManager';
import { clearJWTToken, storeJWTToken } from '../utils/jwtAuth';

const AuthContext = createContext({});

// Firebase error code mapping to user-friendly messages
const getErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/user-not-found': 'No account found with this email address. Please check your email or create a new account.',
    'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
    'auth/requires-recent-login': 'Please sign in again to complete this action.',
    'auth/invalid-verification-code': 'Invalid verification code.',
    'auth/invalid-verification-id': 'Invalid verification ID.',
    'auth/missing-email': 'Please enter your email address.',
    'auth/missing-password': 'Please enter your password.',
    'auth/quota-exceeded': 'Service temporarily unavailable. Please try again later.',
    'auth/timeout': 'Request timed out. Please try again.',
    'auth/unverified-email': 'Please verify your email address before signing in.',
  };
  
  return errorMessages[errorCode] || 'Login failed. Please check your credentials and try again.';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on app start
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Initialize session manager with strict validation
        const sessionResult = await sessionManager.initialize();
        
        if (sessionResult.type === 'user' && sessionResult.data && sessionResult.data.userData) {
          const { userData } = sessionResult.data;
          // STRICT VALIDATION - Only restore if we have real user data
          if (userData.uid && userData.email && !userData.isGuest) {
            setUser(userData);
          } else {
            await sessionManager.clearSession();
          }
        } else {
          // Ensure clean state
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking stored session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
    
    // Safety timeout - force loading to false after 5 seconds
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            isAnonymous: firebaseUser.isAnonymous,
            metadata: {
              creationTime: firebaseUser.metadata.creationTime,
              lastSignInTime: firebaseUser.metadata.lastSignInTime,
            },
            providerData: firebaseUser.providerData,
          };
          
          setUser(userData);
          
          // Get Firebase token for API calls (API will verify it directly)
          try {
            const firebaseToken = await firebaseUser.getIdToken();
            console.log('🔥 Got Firebase token:', firebaseToken.substring(0, 20) + '...');
            console.log('✅ Firebase token will be used directly for API authentication');
            
            // Store the Firebase token for API calls
            await storeJWTToken(firebaseToken);
            await sessionManager.storeSession(userData, firebaseToken);
          } catch (tokenError) {
            console.error('Error getting Firebase token:', tokenError);
            // Still store session without token
            await sessionManager.storeSession(userData, null);
          }
        } else {
          // User is signed out
          await sessionManager.clearSession();
          setUser(null);
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        setError('Authentication error occurred');
        Alert.alert('Authentication Error', 'An error occurred with authentication. Please try again.');
      }
    });

    return () => unsubscribe();
  }, []);

  // Login with email and password
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      
      // Auth state change listener will handle the rest
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = getErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Register with email and password
  const register = async (email, password, displayName = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      // Update display name if provided
      if (displayName) {
        await userCredential.user.updateProfile({ displayName });
      }
      
      // Auth state change listener will handle the rest
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = getErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      await auth().signOut();
      await sessionManager.clearSession();
      await clearJWTToken(); // Clear JWT token as well
      setUser(null);
      setError(null);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Sign out failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await auth().sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = getErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      await currentUser.updateProfile(updates);
      
      // Update local state
      const updatedUserData = {
        ...user,
        ...updates,
      };
      setUser(updatedUserData);
      await sessionManager.storeSession(updatedUserData);
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Profile update failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Send email verification
  const sendEmailVerification = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      await currentUser.sendEmailVerification();
      return { success: true };
    } catch (error) {
      console.error('Email verification error:', error);
      setError('Failed to send verification email. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user account
  const deleteAccount = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      await currentUser.delete();
      await sessionManager.clearSession();
      setUser(null);
      
      return { success: true };
    } catch (error) {
      console.error('Account deletion error:', error);
      setError('Account deletion failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Test authentication system
  const testAuthSystem = async () => {
    try {
      const testEmail = 'test@example.com';
      const testPassword = 'testpassword123';
      
      // Test registration
      const registerResult = await register(testEmail, testPassword, 'Test User');
      if (!registerResult.success) {
        return { success: false, error: 'Registration test failed' };
      }
      
      // Test login
      const loginResult = await login(testEmail, testPassword);
      if (!loginResult.success) {
        return { success: false, error: 'Login test failed' };
      }
      
      // Test sign out
      const signOutResult = await signOut();
      if (!signOutResult.success) {
        return { success: false, error: 'Sign out test failed' };
      }
      
      return { success: true, message: 'All authentication tests passed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Test password reset
  const testPasswordReset = async (email) => {
    try {
      const result = await resetPassword(email);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    signOut,
    resetPassword,
    updateProfile,
    sendEmailVerification,
    deleteAccount,
    clearError,
    testAuthSystem,
    testPasswordReset,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};