// src/hooks/useFirebaseAuth.js
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseAuthService from '../services/firebaseAuth';
import { generateIdempotencyKey } from '../utils/idempotency';
import { clearDemoData } from '../utils/clearDemoData';

const useFirebaseAuth = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [authState, setAuthState] = useState(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = firebaseAuthService.addAuthStateListener((user) => {
      setAuthState(user);
      if (user) {
        // User is signed in
        queryClient.setQueryData(['auth'], user);
      } else {
        // User is signed out
        queryClient.setQueryData(['auth'], null);
      }
    });

    return unsubscribe;
  }, [queryClient]);

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        // Check if user is already logged in (stored in AsyncStorage)
        const storedUser = await AsyncStorage.getItem('user_data');
        const storedToken = await AsyncStorage.getItem('authToken');
        
        if (storedUser && storedToken && authState) {
          const userData = JSON.parse(storedUser);
          console.log('✅ User already logged in, restoring session');
          return userData;
        }
        
        // If Firebase user exists but no stored data, create user data
        if (authState && !storedUser) {
          const userData = await createUserDataFromFirebase(authState);
          await AsyncStorage.setItem('user_data', JSON.stringify(userData));
          await AsyncStorage.setItem('authToken', await authState.getIdToken());
          return userData;
        }
        
        // If no Firebase user, return null (user needs to login)
        console.log('❌ No Firebase user found, user needs to login');
        return null;
      } catch (error) {
        console.error('Error checking stored user:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const createUserDataFromFirebase = async (firebaseUser) => {
    return {
      id: firebaseUser.uid,
      username: firebaseUser.email?.split('@')[0] || 'user',
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      avatarUrl: firebaseUser.photoURL,
      bio: 'Welcome to Flow!',
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
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      avatar: firebaseUser.photoURL,
    };
  };

  const loginMutation = useMutation({
    mutationFn: async ({ email, password, idempotencyKey }) => {
      try {
        const result = await firebaseAuthService.signInWithEmail(email, password);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        // Create user data from Firebase user
        const userData = await createUserDataFromFirebase(result.user);
        
        // Store user data and token
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        await AsyncStorage.setItem('authToken', result.token);
        
        console.log('✅ User logged in successfully with Firebase');
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
        const result = await firebaseAuthService.signUpWithEmail(email, password);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        // Update user profile with display name
        if (name) {
          await firebaseAuthService.updateProfile({ displayName: name });
        }

        // Create user data from Firebase user
        const userData = await createUserDataFromFirebase(result.user);
        
        // Store user data and token
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        await AsyncStorage.setItem('authToken', result.token);
        
        console.log('✅ User registered successfully with Firebase');
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

  const googleSignInMutation = useMutation({
    mutationFn: async () => {
      try {
        const result = await firebaseAuthService.signInWithGoogle();
        
        if (!result.success) {
          throw new Error(result.error);
        }

        // Create user data from Firebase user
        const userData = await createUserDataFromFirebase(result.user);
        
        // Store user data and token
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        await AsyncStorage.setItem('authToken', result.token);
        
        console.log('✅ User signed in with Google successfully');
        return userData;
      } catch (error) {
        console.error('Google sign in error:', error);
        throw new Error('Google sign in failed: ' + error.message);
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
      try {
        const result = await firebaseAuthService.sendPasswordResetEmail(email);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        return { success: true };
      } catch (error) {
        console.error('Password reset error:', error);
        throw new Error('Password reset failed: ' + error.message);
      }
    },
    onError: (err) => setError(err.message),
  });

  const skipAuth = async () => {
    try {
      // For guest mode, sign in anonymously with Firebase
      const result = await firebaseAuthService.signInAnonymously();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Create user data from anonymous Firebase user
      const userData = await createUserDataFromFirebase(result.user);
      
      // Store user data and token
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      await AsyncStorage.setItem('authToken', result.token);
      
      queryClient.setQueryData(['auth'], userData);
      setError(null);
      console.log('✅ Guest mode activated with Firebase anonymous auth');
    } catch (error) {
      console.error('Error setting guest mode:', error);
      setError(error.message);
    }
  };

  const logout = async () => {
    try {
      // Sign out from Firebase
      const result = await firebaseAuthService.signOut();
      
      if (!result.success) {
        throw new Error(result.error);
      }

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
    googleSignIn: googleSignInMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    skipAuth,
    logout,
  };
};

export { useFirebaseAuth };
export default useFirebaseAuth;
