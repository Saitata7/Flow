// hooks/useFirstTime.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reusable hook for managing first-time user logic
// Checks if it's the first launch and provides methods to mark it complete
// Usage: import useFirstTime from '../hooks/useFirstTime';

const FIRST_LAUNCH_KEY = 'isFirstLaunch';

const useFirstTime = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        setIsFirstLaunch(value === null);
      } catch (err) {
        console.error('Error checking first launch:', err);
      } finally {
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

  return { isFirstLaunch, isLoading, markFirstLaunchComplete };
};

export default useFirstTime;