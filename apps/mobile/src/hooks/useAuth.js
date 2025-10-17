// src/hooks/useAuth.js
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sessionManager from '../utils/sessionManager';
import { generateIdempotencyKey } from '../utils/idempotency';
import { clearDemoData } from '../utils/clearDemoData';

const API_URL = 'https://your-api-endpoint.com'; // Replace with your API

const useAuth = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        // Check if user is already logged in (stored in SecureStore via SessionManager)
        const sessionResult = await sessionManager.getStoredSession();
        
        if (sessionResult && sessionResult.type === 'user' && sessionResult.data) {
          const userData = sessionResult.data.userData;
          // Don't auto-login demo users - require explicit login
          if (userData.email === 'demo@flow.app' && userData.displayName === 'Demo User') {
            console.log('❌ Demo user detected, clearing and requiring login');
            await clearDemoData();
            return null;
          }
          // Also check for other demo user patterns
          if (userData.id === 'user123' || userData.username === 'demo_user') {
            console.log('❌ Demo user pattern detected, clearing and requiring login');
            await clearDemoData();
            return null;
          }
          console.log('✅ User already logged in, restoring session from SecureStore');
          return userData;
        }
        
        // If no stored user, return null (user needs to login)
        console.log('❌ No stored user found, user needs to login');
        return null;
      } catch (error) {
        console.error('Error checking stored user:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password, idempotencyKey }) => {
      try {
        // For demo purposes, simulate a successful login
        // In production, this would call your actual API
        const userData = {
          id: 'user123',
          username: email.split('@')[0],
          displayName: email.split('@')[0],
          avatarUrl: null,
          bio: 'Welcome to Flow! This is a demo profile.',
          joinedAt: new Date().toISOString(),
          stats: {
            personalPlans: 0,
            publicPlans: 0,
            followers: 0,
            following: 0,
            badges: []
          },
          social: {
            twitter: null,
            linkedin: null,
            github: null,
            instagram: null
          },
          links: [],
          achievements: [],
          profileTheme: {
            primaryColor: '#007AFF',
            secondaryColor: '#5856D6',
            bannerUrl: null,
            accentColor: '#FF9500'
          },
          visibility: {
            bio: true,
            stats: true,
            plans: true
          },
          schemaVersion: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          
          // Legacy fields for backward compatibility
          email: email,
          name: email.split('@')[0],
          avatar: null,
        };
        
        const token = 'demo_token_' + Date.now();
        
        // Store user data and token
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        await AsyncStorage.setItem('authToken', token);
        
        console.log('✅ User logged in successfully and data stored');
        return userData;
      } catch (error) {
        console.error('Login error:', error);
        throw new Error('Login failed: ' + error.message);
      }
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth'], user);
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password, idempotencyKey, acceptTerms, marketingOptIn }) => {
      try {
        // For demo purposes, simulate a successful registration
        // In production, this would call your actual API
        const userData = {
          id: 'user123',
          username: email.split('@')[0],
          displayName: name || email.split('@')[0],
          avatarUrl: null,
          bio: 'Welcome to Flow! This is a demo profile.',
          joinedAt: new Date().toISOString(),
          stats: {
            personalPlans: 0,
            publicPlans: 0,
            followers: 0,
            following: 0,
            badges: []
          },
          social: {
            twitter: null,
            linkedin: null,
            github: null,
            instagram: null
          },
          links: [],
          achievements: [],
          profileTheme: {
            primaryColor: '#007AFF',
            secondaryColor: '#5856D6',
            bannerUrl: null,
            accentColor: '#FF9500'
          },
          visibility: {
            bio: true,
            stats: true,
            plans: true
          },
          schemaVersion: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          
          // Legacy fields for backward compatibility
          email: email,
          name: name || email.split('@')[0],
          avatar: null,
        };
        
        const token = 'demo_token_' + Date.now();
        
        // Store user data and token
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        await AsyncStorage.setItem('authToken', token);
        
        console.log('✅ User registered successfully and data stored');
        return userData;
      } catch (error) {
        console.error('Registration error:', error);
        throw new Error('Registration failed: ' + error.message);
      }
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth'], user);
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email }) => {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('Password reset failed');
      return response.json();
    },
    onError: (err) => setError(err.message),
  });

  const skipAuth = async () => {
    try {
      // For guest mode, don't create any user data
      // Just clear any existing auth data and set user to null
      await clearDemoData();
      
      queryClient.setQueryData(['auth'], null);
      setError(null);
      console.log('✅ Guest mode activated - no user data stored');
    } catch (error) {
      console.error('Error setting guest mode:', error);
      setError(error.message);
    }
  };

  const logout = async () => {
    try {
      // Clear stored user data and token
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('authToken');
      
      // Clear query cache
      queryClient.setQueryData(['auth'], null);
      setError(null);
      
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      setError(error.message);
    }
  };

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    skipAuth,
    logout,
  };
};

export { useAuth };
export default useAuth;