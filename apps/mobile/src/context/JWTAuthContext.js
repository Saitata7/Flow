// src/context/JWTAuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import apiService from '../services/apiService';
import sessionManager from '../utils/sessionManager';
import { generateJWTToken, verifyJWTToken, storeJWTToken, clearJWTToken, getJWTTokenInfo } from '../utils/jwtAuth';
import authService from '../services/authService';

const AuthContext = createContext({});

// JWT error code mapping to user-friendly messages
const getErrorMessage = (errorCode) => {
  const errorMessages = {
    'AUTH_ERROR': 'Your session has expired. Please log in again.',
    'JWT_TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
    'TOKEN_REFRESH_FAILED': 'Your session has expired. Please log in again.',
    'INVALID_CREDENTIALS': 'Invalid email or password. Please check your credentials.',
    'USER_NOT_FOUND': 'No account found with this email address. Please check your email or create a new account.',
    'NETWORK_ERROR': 'Network error. Please check your internet connection and try again.',
    'SERVER_ERROR': 'Server error. Please try again later.',
    'VALIDATION_ERROR': 'Please check your input and try again.',
  };
  
  return errorMessages[errorCode] || 'Authentication failed. Please try again.';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on app start
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        console.log('🔍 JWTAuthContext: Checking existing session...');
        
        // Check if we have a stored JWT token
        const tokenInfo = await getJWTTokenInfo();
        if (tokenInfo && tokenInfo.valid) {
          console.log('✅ JWTAuthContext: Valid JWT token found');
          
          // Verify token with backend
          const verifyResult = await authService.verifyToken();
          if (verifyResult.success) {
            console.log('✅ JWTAuthContext: Token verified with backend');
            setUser(verifyResult.user); // Use user data from backend verification
          } else {
            console.log('❌ JWTAuthContext: Token verification failed, clearing session');
            await clearSession();
          }
        } else {
          console.log('ℹ️ JWTAuthContext: No valid token found');
          await clearSession();
        }
      } catch (error) {
        console.error('❌ JWTAuthContext: Error checking session:', error);
        await clearSession();
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

  // Clear session data
  const clearSession = async () => {
    try {
      await Promise.all([
        clearJWTToken(),
        sessionManager.clearSession(),
        SecureStore.deleteItemAsync('user_data'),
        AsyncStorage.removeItem('user_session'),
      ]);
      setUser(null);
      setError(null);
      console.log('✅ JWTAuthContext: Session cleared');
    } catch (error) {
      console.error('❌ JWTAuthContext: Error clearing session:', error);
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔐 JWTAuthContext: Starting JWT login...');
      
      // Use authService for login
      const result = await authService.login(email, password);
      
      if (result.success) {
        console.log('✅ JWTAuthContext: Login successful');
        
        // Store user data and token
        const userData = {
          id: result.user.id,
          uid: result.user.id,
          email: result.user.email,
          name: result.user.name,
          displayName: result.user.name,
          emailVerified: result.user.emailVerified || true,
          picture: result.user.picture,
          isGuest: false,
        };
        
        setUser(userData);
        
        // Store session
        await sessionManager.storeSession(userData, result.token);
        
        return { success: true, user: userData };
      } else {
        console.log('❌ JWTAuthContext: Login failed:', result.error);
        const errorMessage = getErrorMessage(result.error?.code) || result.error?.message || 'Login failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('❌ JWTAuthContext: Login error:', error);
      const errorMessage = getErrorMessage(error.code) || error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Register with email and password
  const register = async (registrationData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔐 JWTAuthContext: Starting JWT registration...');
      
      // Use authService for registration
      const result = await authService.register(registrationData);
      
      if (result.success) {
        console.log('✅ JWTAuthContext: Registration successful');
        
        // Store user data and token
        const userData = {
          id: result.user.id,
          uid: result.user.id,
          email: result.user.email,
          name: result.user.name || registrationData.name,
          displayName: result.user.name || registrationData.name,
          firstName: result.user.firstName || registrationData.firstName,
          lastName: result.user.lastName || registrationData.lastName,
          username: result.user.username || registrationData.username,
          dateOfBirth: result.user.dateOfBirth || registrationData.dateOfBirth,
          gender: result.user.gender || registrationData.gender,
          emailVerified: result.user.emailVerified || true,
          picture: result.user.picture,
          isGuest: false,
        };
        
        setUser(userData);
        
        // Store session
        await sessionManager.storeSession(userData, result.token);
        
        return { success: true, user: userData };
      } else {
        console.log('❌ JWTAuthContext: Registration failed:', result.error);
        const errorMessage = getErrorMessage(result.error?.code) || result.error?.message || 'Registration failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('❌ JWTAuthContext: Registration error:', error);
      const errorMessage = getErrorMessage(error.code) || error.message || 'Registration failed. Please try again.';
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
      
      console.log('🔐 JWTAuthContext: Starting logout...');
      
      // Use authService for logout
      await authService.logout();
      
      // Clear local session
      await clearSession();
      
      console.log('✅ JWTAuthContext: Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ JWTAuthContext: Logout error:', error);
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
      
      console.log('🔐 JWTAuthContext: Starting password reset...');
      
      // Use authService for password reset
      const result = await authService.resetPassword(email);
      
      if (result.success) {
        console.log('✅ JWTAuthContext: Password reset email sent');
        return { success: true };
      } else {
        console.log('❌ JWTAuthContext: Password reset failed:', result.error);
        const errorMessage = getErrorMessage(result.error?.code) || result.error?.message || 'Password reset failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('❌ JWTAuthContext: Password reset error:', error);
      const errorMessage = getErrorMessage(error.code) || error.message || 'Password reset failed. Please try again.';
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
      
      console.log('🔐 JWTAuthContext: Updating profile...');
      
      // Update local state
      const updatedUserData = {
        ...user,
        ...updates,
      };
      setUser(updatedUserData);
      
      // Store updated session
      await sessionManager.storeSession(updatedUserData);
      
      console.log('✅ JWTAuthContext: Profile updated');
      return { success: true };
    } catch (error) {
      console.error('❌ JWTAuthContext: Profile update error:', error);
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
      
      console.log('🔐 JWTAuthContext: Sending email verification...');
      
      // For JWT auth, we assume email is verified
      console.log('✅ JWTAuthContext: Email verification not needed for JWT auth');
      return { success: true };
    } catch (error) {
      console.error('❌ JWTAuthContext: Email verification error:', error);
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
      
      console.log('🔐 JWTAuthContext: Deleting account...');
      
      // Use authService for account deletion
      const result = await authService.deleteAccount();
      
      if (result.success) {
        await clearSession();
        console.log('✅ JWTAuthContext: Account deleted');
        return { success: true };
      } else {
        console.log('❌ JWTAuthContext: Account deletion failed:', result.error);
        const errorMessage = getErrorMessage(result.error?.code) || result.error?.message || 'Account deletion failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('❌ JWTAuthContext: Account deletion error:', error);
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
