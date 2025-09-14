// hooks/useAuthSimple.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthSimple = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize with mock user for demo
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if there's a stored user
        const storedUser = await AsyncStorage.getItem('demo_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Create a default demo user
          const demoUser = {
            id: 'demo-user-123',
            email: 'demo@flow.app',
            name: 'Demo User',
            avatar: null,
            createdAt: '2024-01-01T00:00:00Z',
          };
          setUser(demoUser);
          await AsyncStorage.setItem('demo_user', JSON.stringify(demoUser));
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async ({ email, password }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock login - in real app this would call your API
      const userData = {
        id: 'demo-user-123',
        email: email,
        name: email.split('@')[0],
        avatar: null,
        createdAt: new Date().toISOString(),
      };
      
      setUser(userData);
      await AsyncStorage.setItem('demo_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ name, email, password }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock registration - in real app this would call your API
      const userData = {
        id: `user-${Date.now()}`,
        email: email,
        name: name,
        avatar: null,
        createdAt: new Date().toISOString(),
      };
      
      setUser(userData);
      await AsyncStorage.setItem('demo_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async ({ email }) => {
    try {
      setError(null);
      
      // Mock password reset - in real app this would call your API
      console.log('Password reset requested for:', email);
      return { success: true, message: 'Password reset email sent' };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const skipAuth = () => {
    const demoUser = {
      id: 'demo-user-123',
      email: 'demo@flow.app',
      name: 'Demo User',
      avatar: null,
      createdAt: '2024-01-01T00:00:00Z',
    };
    setUser(demoUser);
    setError(null);
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('demo_user');
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    user,
    isLoading,
    error,
    login,
    register,
    resetPassword,
    skipAuth,
    logout,
  };
};

export { useAuthSimple };
export default useAuthSimple;
