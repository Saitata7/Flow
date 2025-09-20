// hooks/useFTUE.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FTUE_STORAGE_KEY = 'hasSeenHomeFTUE';

export const useFTUE = () => {
  const [showFTUE, setShowFTUE] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFTUEStatus();
  }, []);

  const checkFTUEStatus = async () => {
    try {
      // Don't automatically show FTUE - only show when manually triggered
      setShowFTUE(false);
    } catch (error) {
      console.error('Error checking FTUE status:', error);
      setShowFTUE(false); // Don't show FTUE automatically
    } finally {
      setIsLoading(false);
    }
  };

  const completeFTUE = async () => {
    try {
      await AsyncStorage.setItem(FTUE_STORAGE_KEY, 'true');
      setShowFTUE(false);
    } catch (error) {
      console.error('Error completing FTUE:', error);
    }
  };

  const startFTUE = async () => {
    try {
      // Manually start the FTUE tour
      setShowFTUE(true);
    } catch (error) {
      console.error('Error starting FTUE:', error);
    }
  };

  return {
    showFTUE,
    isLoading,
    completeFTUE,
    startFTUE,
  };
};
