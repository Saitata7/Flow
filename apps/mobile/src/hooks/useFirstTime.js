// hooks/useFirstTime.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reusable hook for managing first-time user logic
// Checks if it's the first launch and provides methods to mark it complete
// Usage: import useFirstTime from '../hooks/useFirstTime';

const FIRST_LAUNCH_KEY = 'isFirstLaunch';

// Create context for first time state
const FirstTimeContext = createContext(null);

// Provider component
export const FirstTimeProvider = ({ children }) => {
  console.log('🔍 FirstTimeProvider: Component rendering');
  
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 FirstTimeProvider: useEffect running');
    const checkFirstLaunch = async () => {
      try {
        console.log('🔍 FirstTimeProvider: Checking AsyncStorage');
        const value = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        console.log('🔍 FirstTimeProvider: AsyncStorage value:', value);
        setIsFirstLaunch(value === null);
      } catch (err) {
        console.error('❌ FirstTimeProvider: Error checking first launch:', err);
      } finally {
        console.log('🔍 FirstTimeProvider: Setting isLoading to false');
        setIsLoading(false);
      }
    };

    checkFirstLaunch();
  }, []);

  const markFirstLaunchComplete = async () => {
    try {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
      setIsFirstLaunch(false);
    } catch (err) {
      console.error('Error marking first launch complete:', err);
    }
  };

  const value = {
    isFirstLaunch,
    isLoading,
    markFirstLaunchComplete,
  };

  console.log('🔍 FirstTimeProvider: Rendering with value:', value);

  return (
    <FirstTimeContext.Provider value={value}>
      {children}
    </FirstTimeContext.Provider>
  );
};

// Hook to use the context
const useFirstTime = () => {
  console.log('🔍 useFirstTime: Hook called');
  const context = useContext(FirstTimeContext);
  console.log('🔍 useFirstTime: Context value:', context);
  
  if (!context) {
    console.error('❌ useFirstTime: No context found - not wrapped by FirstTimeProvider');
    throw new Error('useFirstTime must be used within a FirstTimeProvider');
  }
  
  console.log('✅ useFirstTime: Context found, returning:', context);
  return context;
};

export { useFirstTime };
export default useFirstTime;