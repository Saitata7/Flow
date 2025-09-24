// context/NotificationContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const notificationHook = useNotifications();
  const [achievements, setAchievements] = useState([]);

  // Track achievements and send notifications
  const trackAchievement = async (achievementData) => {
    try {
      // Check if this achievement was already unlocked
      const existingAchievement = achievements.find(
        a => a.id === achievementData.id
      );
      
      if (!existingAchievement) {
        // Add to local state
        setAchievements(prev => [...prev, achievementData]);
        
        // Send notification
        await notificationHook.sendAchievementNotification(achievementData);
        
        console.log('Achievement tracked and notification sent:', achievementData);
      }
    } catch (error) {
      console.error('Error tracking achievement:', error);
    }
  };

  // Send community update notification
  const sendCommunityUpdate = async (updateData) => {
    try {
      await notificationHook.sendCommunityNotification(updateData);
    } catch (error) {
      console.error('Error sending community update:', error);
    }
  };

  // Send custom notification
  const sendNotification = async (title, body, data = {}) => {
    try {
      await notificationHook.sendCustomNotification(title, body, data);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Update notification settings
  const updateSettings = async (settings) => {
    try {
      await notificationHook.updateNotificationSettings(settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  };

  const value = {
    ...notificationHook,
    achievements,
    trackAchievement,
    sendCommunityUpdate,
    sendNotification,
    updateSettings,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
