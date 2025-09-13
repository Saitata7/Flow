// hooks/useWelcomePopup.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reusable hook for managing welcome popup or info screen
// Shows popup if not seen before, provides method to mark as seen
// Usage: import useWelcomePopup from '../hooks/useWelcomePopup';

const WELCOME_POPUP_SEEN_KEY = 'welcomePopupSeen';

const useWelcomePopup = () => {
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkWelcomePopup = async () => {
      try {
        const value = await AsyncStorage.getItem(WELCOME_POPUP_SEEN_KEY);
        setShowWelcomePopup(value === null);
      } catch (err) {
        console.error('Error checking welcome popup:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkWelcomePopup();
  }, []);

  const markWelcomePopupSeen = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_POPUP_SEEN_KEY, 'true');
      setShowWelcomePopup(false);
    } catch (err) {
      console.error('Error marking welcome popup seen:', err);
    }
  };

  return { showWelcomePopup, isLoading, markWelcomePopupSeen };
};

export default useWelcomePopup;
