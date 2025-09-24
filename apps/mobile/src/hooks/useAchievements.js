// hooks/useAchievements.js
import { useState, useEffect, useCallback } from 'react';
import achievementService from '../services/achievementService';
import { useNotificationContext } from '../context/NotificationContext';

export const useAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { trackAchievement } = useNotificationContext();

  // Load achievements on mount
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setLoading(true);
        await achievementService.loadAchievements();
        const loadedAchievements = achievementService.getAchievements();
        setAchievements(loadedAchievements);
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, []);

  // Process flows and check for new achievements
  const processFlows = useCallback(async (flows) => {
    try {
      const newAchievements = await achievementService.processFlows(flows);
      
      if (newAchievements.length > 0) {
        // Reload all achievements to get the updated list
        await achievementService.loadAchievements();
        const allAchievements = achievementService.getAchievements();
        setAchievements(allAchievements);
        
        // Send notifications for each new achievement
        for (const achievement of newAchievements) {
          await trackAchievement(achievement);
        }
        
        return newAchievements;
      }
      
      return [];
    } catch (error) {
      console.error('Error processing flows for achievements:', error);
      return [];
    }
  }, [trackAchievement]);

  // Manually unlock an achievement (for testing)
  const unlockAchievement = useCallback(async (achievementId, metadata = {}) => {
    try {
      const unlocked = await achievementService.unlockAchievement(achievementId, metadata);
      
      if (unlocked) {
        // Reload all achievements to get the updated list
        await achievementService.loadAchievements();
        const allAchievements = achievementService.getAchievements();
        setAchievements(allAchievements);
        
        await trackAchievement(unlocked);
        return unlocked;
      }
      
      return null;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return null;
    }
  }, [trackAchievement]);

  // Get achievement progress
  const getProgress = useCallback((flows) => {
    const currentStreak = achievementService.calculateStreak(flows);
    const totalFlows = flows ? flows.length : 0;
    
    return {
      streak: currentStreak,
      totalFlows,
      achievements: achievementService.getAchievements(),
      streakProgress: achievementService.getStreakProgress(currentStreak),
      flowCountProgress: achievementService.getFlowCountProgress(totalFlows),
    };
  }, []);

  // Check if specific achievement is unlocked
  const hasAchievement = useCallback((achievementId) => {
    return achievementService.hasAchievement(achievementId);
  }, []);

  // Reset achievements (for testing)
  const resetAchievements = useCallback(async () => {
    try {
      await achievementService.resetAchievements();
      setAchievements([]);
    } catch (error) {
      console.error('Error resetting achievements:', error);
    }
  }, []);

  return {
    achievements,
    loading,
    processFlows,
    unlockAchievement,
    getProgress,
    hasAchievement,
    resetAchievements,
  };
};
