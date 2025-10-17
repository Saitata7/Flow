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

  // Schedule flow reminder
  const scheduleFlowReminder = useCallback(async (flowId, flowTitle, level, scheduledTime) => {
    try {
      return await notificationService.scheduleFlowReminder(flowId, flowTitle, level, scheduledTime);
    } catch (error) {
      console.error('Error scheduling flow reminder:', error);
      return false;
    }
  }, []);

  // Cancel flow reminder
  const cancelFlowReminder = useCallback(async (flowId, level) => {
    try {
      await notificationService.cancelFlowReminder(flowId, level);
    } catch (error) {
      console.error('Error cancelling flow reminder:', error);
    }
  }, []);

  // Cancel all flow reminders
  const cancelAllFlowReminders = useCallback(async (flowId) => {
    try {
      await notificationService.cancelAllFlowReminders(flowId);
    } catch (error) {
      console.error('Error cancelling all flow reminders:', error);
    }
  }, []);

  // Schedule reminders for all flows
  const scheduleAllFlowReminders = useCallback(async (flows) => {
    try {
      return await notificationService.scheduleAllFlowReminders(flows);
    } catch (error) {
      console.error('Error scheduling all flow reminders:', error);
      return 0;
    }
  }, []);

  // Update flow reminder
  const updateFlowReminder = useCallback(async (flowId, flowTitle, level, reminderTime) => {
    try {
      return await notificationService.updateFlowReminder(flowId, flowTitle, level, reminderTime);
    } catch (error) {
      console.error('Error updating flow reminder:', error);
      return false;
    }
  }, []);

  // Complete flow reminder
  const completeFlowReminder = useCallback(async (flowId) => {
    try {
      await notificationService.completeFlowReminder(flowId);
    } catch (error) {
      console.error('Error completing flow reminder:', error);
    }
  }, []);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      return await notificationService.sendTestNotification();
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }, []);

  // Mark flow as completed
  const markFlowCompleted = useCallback(async (flowId) => {
    try {
      await notificationService.markFlowCompleted(flowId);
    } catch (error) {
      console.error('Error marking flow as completed:', error);
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
    scheduleFlowReminder,
    cancelFlowReminder,
    cancelAllFlowReminders,
    markFlowCompleted,
    scheduleAllFlowReminders,
    updateFlowReminder,
    completeFlowReminder,
  };
};
