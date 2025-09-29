// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '../config/firebaseInit'; // Use our defensive Firebase import
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const AuthContext = createContext({});

// Firebase error code mapping to user-friendly messages
const getErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/user-not-found': 'No account exists for this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Invalid email format.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/requires-recent-login': 'Please sign in again to complete this action.',
  };
  
  return errorMessages[errorCode] || 'An error occurred. Please try again.';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on app start
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Check if user data exists in SecureStore
        const storedUser = await SecureStore.getItemAsync('user_data');
        const storedToken = await SecureStore.getItemAsync('auth_token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('✅ User session restored from SecureStore');
        }
      } catch (error) {
        console.error('Error checking stored session:', error);
        Alert.alert('Storage Error', 'Failed to restore user session. Please login again.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();

          // Listen for Firebase auth state changes
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

          // Get fresh token
          const token = await firebaseUser.getIdToken();
          
          // Store user data and token securely
          await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
          await SecureStore.setItemAsync('auth_token', token);
          
          setUser(userData);
          setError(null);
          console.log('✅ User signed in:', userData.email);
        } else {
          // User is signed out
          await SecureStore.deleteItemAsync('user_data');
          await SecureStore.deleteItemAsync('auth_token');
          setUser(null);
          setError(null);
          console.log('✅ User signed out');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
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
      const errorMessage = getErrorMessage(error.code);
      setError(errorMessage);
      console.error('Login error:', error);
      
      // Show error popup
      Alert.alert('Login Failed', errorMessage, [
        { text: 'OK', style: 'default' }
      ]);
      
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
            
            // Update profile with display name if provided
            if (displayName) {
              await userCredential.user.updateProfile({ displayName });
            }
            
            // Auth state change listener will handle the rest
            return { success: true, user: userCredential.user };
          } catch (error) {
      const errorMessage = getErrorMessage(error.code);
      setError(errorMessage);
      console.error('Registration error:', error);
      
      // Show error popup
      Alert.alert('Registration Failed', errorMessage, [
        { text: 'OK', style: 'default' }
      ]);
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
        const logout = async () => {
          try {
            setIsLoading(true);
            setError(null);
            
            await auth().signOut();
            
            // Auth state change listener will handle clearing stored data
            return { success: true };
          } catch (error) {
      const errorMessage = getErrorMessage(error.code) || 'Logout failed. Please try again.';
      setError(errorMessage);
      console.error('Logout error:', error);
      
      // Show error popup
      Alert.alert('Logout Failed', errorMessage, [
        { text: 'OK', style: 'default' }
      ]);
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Send password reset email
        const resetPassword = async (email) => {
          try {
            setIsLoading(true);
            setError(null);
            
            await auth().sendPasswordResetEmail(email);
            
            // Show success popup
            Alert.alert('Password Reset', 'Password reset email sent! Check your inbox.', [
              { text: 'OK', style: 'default' }
            ]);
            
            return { success: true };
          } catch (error) {
      const errorMessage = getErrorMessage(error.code);
      setError(errorMessage);
      console.error('Password reset error:', error);
      
      // Show error popup
      Alert.alert('Password Reset Failed', errorMessage, [
        { text: 'OK', style: 'default' }
      ]);
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return user !== null;
  };

  // Get current user token
  const getToken = async () => {
    try {
      if (user && auth().currentUser) {
        return await auth().currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      Alert.alert('Token Error', 'Failed to get authentication token. Please login again.');
      return null;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    resetPassword,
    isAuthenticated,
    getToken,
    clearError,
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

export default AuthContext;
