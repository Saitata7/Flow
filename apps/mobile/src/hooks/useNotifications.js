// hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';

export const useNotifications = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize notifications
  const initializeNotifications = useCallback(async () => {
    try {
      setLoading(true);
      if (!notificationService || typeof notificationService.initialize !== 'function') {
        console.error('Notification service not properly initialized');
        setInitialized(true);
        return false;
      }
      const granted = await notificationService.initialize();
      setPermissionsGranted(granted);
      setInitialized(true);
      return granted;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      setInitialized(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    try {
      if (!notificationService || typeof notificationService.requestPermissions !== 'function') {
        console.error('Notification service not properly initialized');
        return false;
      }
      const granted = await notificationService.requestPermissions();
      setPermissionsGranted(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, []);

  // Send achievement notification
  const sendAchievementNotification = useCallback(async (achievementData) => {
    try {
      await notificationService.sendAchievementAlert(achievementData);
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  }, []);

  // Send community update notification
  const sendCommunityNotification = useCallback(async (updateData) => {
    try {
      await notificationService.sendCommunityUpdate(updateData);
    } catch (error) {
      console.error('Error sending community notification:', error);
    }
  }, []);

  // Send custom notification
  const sendCustomNotification = useCallback(async (title, body, data = {}) => {
    try {
      await notificationService.sendCustomNotification(title, body, data);
    } catch (error) {
      console.error('Error sending custom notification:', error);
    }
  }, []);

  // Update notification settings
  const updateNotificationSettings = useCallback(async (settings) => {
    try {
      await notificationService.updateNotificationSettings(settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }, []);

  // Get notification settings
  const getNotificationSettings = useCallback(async () => {
    try {
      return await notificationService.getNotificationSettings();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }, []);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      await notificationService.sendTestNotification();
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  return {
    permissionsGranted,
    initialized,
    loading,
    initializeNotifications,
    requestPermissions,
    sendAchievementNotification,
    sendCommunityNotification,
    sendCustomNotification,
    updateNotificationSettings,
    getNotificationSettings,
    sendTestNotification,
  };
};
