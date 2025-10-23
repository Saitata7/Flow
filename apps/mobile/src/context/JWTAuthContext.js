// context/JWTAuthContext.js
// Professional JWT Authentication Context
// Implements industry-standard authentication patterns for mobile apps

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Buffer } from '@craftzdog/react-native-buffer';
import jwtApiService from '../services/jwtApiService';

// JWT Token Management
const TOKEN_KEY = 'jwt_access_token';
const REFRESH_TOKEN_KEY = 'jwt_refresh_token';
const USER_KEY = 'jwt_user_data';

// Professional Authentication Context
const JWTAuthContext = createContext();

export const useAuth = () => {
  const context = useContext(JWTAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a JWTAuthProvider');
  }
  return context;
};

export const JWTAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Token management functions
  const storeTokens = async (accessToken, refreshToken) => {
    try {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, accessToken],
        [REFRESH_TOKEN_KEY, refreshToken]
      ]);
      console.log('✅ Tokens stored successfully');
    } catch (error) {
      console.error('❌ Error storing tokens:', error);
      throw error;
    }
  };

  const getStoredTokens = async () => {
    try {
      const [accessToken, refreshToken] = await AsyncStorage.multiGet([TOKEN_KEY, REFRESH_TOKEN_KEY]);
      return {
        accessToken: accessToken[1],
        refreshToken: refreshToken[1]
      };
    } catch (error) {
      console.error('❌ Error getting stored tokens:', error);
      return { accessToken: null, refreshToken: null };
    }
  };

  const clearTokens = async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
      console.log('✅ Tokens cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  };

  const storeUserData = async (userData) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      console.log('✅ User data stored successfully');
    } catch (error) {
      console.error('❌ Error storing user data:', error);
    }
  };

  const getStoredUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Error getting stored user data:', error);
      return null;
    }
  };

  // Token validation
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      // Use Buffer instead of atob for React Native
      const base64 = token.split('.')[1];
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.error('❌ Error validating token:', error);
      return false;
    }
  };

  // Refresh token
  const refreshAccessToken = async () => {
    try {
      const { refreshToken } = await getStoredTokens();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 Refreshing access token...');
      const response = await jwtApiService.refreshToken(refreshToken);
      
      if (response.success) {
        await storeTokens(response.data.accessToken, refreshToken);
        console.log('✅ Access token refreshed successfully');
        return response.data.accessToken;
      } else {
        throw new Error(response.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      await logout();
      throw error;
    }
  };

  // Authentication functions
  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login for:', email);

      const response = await jwtApiService.login(email, password);
      
      if (response.success) {
        const { user: userData, tokens } = response.data;
        
        // Store tokens and user data
        await storeTokens(tokens.accessToken, tokens.refreshToken);
        await storeUserData(userData);
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('✅ Login successful:', userData.email);
        return { success: true, user: userData };
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      await clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (registrationData) => {
    try {
      setLoading(true);
      console.log('📝 Attempting registration for:', registrationData.email);

      const response = await jwtApiService.register(registrationData);
      
      if (response.success) {
        const { user: userData, tokens } = response.data;
        
        // Store tokens and user data
        await storeTokens(tokens.accessToken, tokens.refreshToken);
        await storeUserData(userData);
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('✅ Registration successful:', userData.email);
        return { success: true, user: userData };
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      await clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out user');
      
      // Call logout API if user is authenticated
      if (isAuthenticated) {
        try {
          await jwtApiService.logout();
        } catch (error) {
          console.warn('⚠️ Logout API call failed:', error);
        }
      }
      
      // Clear local data
      await clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force clear local data even if API call fails
      await clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      console.log('👤 Updating profile for user:', user?.email);
      
      const response = await jwtApiService.updateProfile(profileData);
      
      if (response.success) {
        const updatedUser = { ...user, ...response.data };
        await storeUserData(updatedUser);
        setUser(updatedUser);
        
        console.log('✅ Profile updated successfully');
        return { success: true, user: updatedUser };
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      throw error;
    }
  };

  const loadProfileData = async () => {
    try {
      if (!isAuthenticated) return;
      
      console.log('📋 Loading profile data for user:', user?.email);
      
      const response = await jwtApiService.getProfile();
      
      if (response.success) {
        const updatedUser = { ...user, ...response.data };
        await storeUserData(updatedUser);
        setUser(updatedUser);
        
        console.log('✅ Profile data loaded successfully');
        return updatedUser;
      } else {
        throw new Error(response.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('❌ Profile data load error:', error);
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      console.log('🔑 Requesting password reset for:', email);
      
      const response = await jwtApiService.forgotPassword(email);
      
      if (response.success) {
        console.log('✅ Password reset email sent');
        return { success: true, message: response.message };
      } else {
        throw new Error(response.error || 'Password reset request failed');
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      throw error;
    }
  };

  const resetPassword = async (token, password) => {
    try {
      console.log('🔑 Resetting password with token');
      
      const response = await jwtApiService.resetPassword(token, password);
      
      if (response.success) {
        console.log('✅ Password reset successfully');
        return { success: true, message: response.message };
      } else {
        throw new Error(response.error || 'Password reset failed');
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      throw error;
    }
  };

  const verifyEmail = async (token) => {
    try {
      console.log('📧 Verifying email with token');
      
      const response = await jwtApiService.verifyEmail(token);
      
      if (response.success) {
        // Update user verification status
        const updatedUser = { ...user, emailVerified: true };
        await storeUserData(updatedUser);
        setUser(updatedUser);
        
        console.log('✅ Email verified successfully');
        return { success: true, user: updatedUser };
      } else {
        throw new Error(response.error || 'Email verification failed');
      }
    } catch (error) {
      console.error('❌ Email verification error:', error);
      throw error;
    }
  };

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Initializing authentication state...');
      
      const { accessToken, refreshToken } = await getStoredTokens();
      const storedUserData = await getStoredUserData();
      
      if (accessToken && refreshToken && storedUserData) {
        // Check if access token is still valid
        if (isTokenValid(accessToken)) {
          console.log('✅ Valid access token found, user authenticated');
          setUser(storedUserData);
          setIsAuthenticated(true);
        } else {
          console.log('⚠️ Access token expired, attempting refresh...');
          try {
            await refreshAccessToken();
            setUser(storedUserData);
            setIsAuthenticated(true);
            console.log('✅ Token refreshed successfully');
          } catch (refreshError) {
            console.log('❌ Token refresh failed, user needs to login again');
            await clearTokens();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        console.log('ℹ️ No stored authentication data found');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Error initializing authentication:', error);
      await clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!isAuthenticated) return;

    const { accessToken } = getStoredTokens();
    if (!accessToken) return;

    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      // Refresh token 5 minutes before expiration
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60000); // At least 1 minute
      
      console.log(`🔄 Token will refresh in ${Math.round(refreshTime / 1000 / 60)} minutes`);
      
      const refreshTimer = setTimeout(async () => {
        try {
          await refreshAccessToken();
        } catch (error) {
          console.error('❌ Auto-refresh failed:', error);
        }
      }, refreshTime);

      return () => clearTimeout(refreshTimer);
    } catch (error) {
      console.error('❌ Error setting up token refresh:', error);
    }
  }, [isAuthenticated]);

  const value = {
    // State
    user,
    loading,
    isAuthenticated,
    
    // Authentication functions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    
    // Profile functions
    updateProfile,
    loadProfileData,
    
    // Token management
    refreshAccessToken,
    
    // Utility functions
    initializeAuth
  };

  return (
    <JWTAuthContext.Provider value={value}>
      {children}
    </JWTAuthContext.Provider>
  );
};

export default JWTAuthContext;