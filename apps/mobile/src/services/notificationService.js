// services/notificationService.js
import * as Notifications from 'expo-notifications';
import { Platform, Alert, PermissionsAndroid, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtApiService from './jwtApiService';

const NOTIFICATION_STORAGE_KEY = 'notification_settings';
const EXPO_TOKEN_KEY = 'expo_token';
const QUIET_HOURS_KEY = 'quiet_hours_settings';

// Configure notification behavior with dynamic settings
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const settings = await notificationService.getNotificationSettings();
    const isQuietHours = await notificationService.isQuietHours();
    
    return {
      shouldShowAlert: !isQuietHours,
      shouldPlaySound: !isQuietHours && settings?.vibration !== false,
      shouldSetBadge: false,
    };
  },
});

class NotificationService {
  constructor() {
    this.expoToken = null;
    this.unsubscribeTokenRefresh = null;
    this.unsubscribeOnMessage = null;
    this.unsubscribeOnNotificationOpenedApp = null;
    this.quietHoursSettings = null;
    this.notificationSettings = null;
    this.flowLevelRingtones = {
      level1: { sound: 'default', vibration: 'light' },
      level2: { sound: 'default', vibration: 'medium' },
      level3: { sound: 'default', vibration: 'strong' }
    };
  }

  /**
   * Initialize notification categories and actions
   */
  async initializeNotificationCategories() {
    try {
      // Define notification categories with action buttons
      await Notifications.setNotificationCategoryAsync('FLOW_REMINDER', [
        {
          identifier: 'COMPLETE_FLOW',
          buttonTitle: 'Complete',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: 'SKIP',
          buttonTitle: 'Skip',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('FLOW_ALARM', [
        {
          identifier: 'COMPLETE_FLOW',
          buttonTitle: 'Complete',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: 'SNOOZE',
          buttonTitle: 'Snooze 15min',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: 'SKIP',
          buttonTitle: 'Skip',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('FLOW_URGENT', [
        {
          identifier: 'COMPLETE_FLOW',
          buttonTitle: 'Complete Now',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: 'SNOOZE',
          buttonTitle: 'Snooze 10min',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ]);

      console.log('✅ Notification categories initialized');
    } catch (error) {
      console.error('Error initializing notification categories:', error);
    }
  }

  // Initialize Expo Notifications
  async initialize() {
    try {
      console.log('🔔 Initializing Expo Notifications...');
      console.log('Platform:', Platform.OS, 'Version:', Platform.Version);
      
      // Check if we're in Expo Go (which has limited push notification support)
      const isExpoGo = __DEV__ && !global.EXPO_PROJECT_ID;
      if (isExpoGo) {
        console.log('⚠️ Running in Expo Go - using local notifications only');
        console.log('💡 For full push notification support, use a development build');
      }
      
      // Request permissions
      const permissionsGranted = await this.requestPermissions();
      
      if (!permissionsGranted) {
        console.warn('❌ Expo notification permissions not granted');
        return false;
      }

      console.log('✅ Permissions granted');

      // Initialize notification categories
      await this.initializeNotificationCategories();

      // Get Expo push token (may fail in Expo Go)
      const token = await this.getExpoToken();
      if (!token) {
        console.warn('❌ Failed to get Expo push token');
        if (isExpoGo) {
          console.log('💡 This is expected in Expo Go - local notifications will still work');
        }
        return false;
      }

      console.log('✅ Expo push token obtained');

      // Set up message handlers
      this.setupMessageHandlers();

      // Schedule automatic notifications
      await this.scheduleAutomaticNotifications();

      console.log('✅ Expo Notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Expo Notifications:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        platform: Platform.OS,
        version: Platform.Version
      });
      return false;
    }
  }

  // Request notification permissions
  async requestPermissions() {
    try {
      console.log('🔔 Requesting notification permissions...');
      
      if (Platform.OS === 'android') {
        console.log('Android detected, checking version:', Platform.Version);
        
        // For Android 13+ (API level 33+), we need POST_NOTIFICATIONS permission
        if (Platform.Version >= 33) {
          console.log('Requesting POST_NOTIFICATIONS permission for Android 13+');
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          console.log('POST_NOTIFICATIONS permission result:', granted);
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('❌ Android notification permission not granted');
            return false;
          }
        } else {
          console.log('Android version < 13, skipping POST_NOTIFICATIONS permission');
        }
      }

      console.log('Requesting Expo notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      console.log('✅ Expo permission status:', status);
      
      return status === 'granted';
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      console.error('Permission error details:', {
        message: error.message,
        code: error.code,
        platform: Platform.OS,
        version: Platform.Version
      });
      return false;
    }
  }

  // Get Expo push token
  async getExpoToken() {
    try {
      // Check if we're in Expo Go (which has limited push notification support)
      const isExpoGo = __DEV__ && !global.EXPO_PROJECT_ID;
      if (isExpoGo) {
        console.log('⚠️ Expo Go detected - push tokens not available');
        console.log('💡 Local notifications will still work for testing');
        return null; // Return null for Expo Go
      }

      // Check if we already have a token
      const existingToken = await AsyncStorage.getItem(EXPO_TOKEN_KEY);
      if (existingToken) {
        this.expoToken = existingToken;
        console.log('Using existing Expo Token:', existingToken);
        return existingToken;
      }

      // Generate new token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '7cbf9568-a5eb-43f7-b115-6dd28a0548f4', // From app.json
      });
      
      this.expoToken = token.data;
      await AsyncStorage.setItem(EXPO_TOKEN_KEY, token.data);
      console.log('New Expo Token generated:', token.data);
      
      // Register device token with backend
      await this.registerDeviceWithBackend(token.data);
      
      return token.data;
    } catch (error) {
      console.error('Error getting Expo token:', error);
      
      // If it's a network error, try to use existing token
      if (error.message?.includes('network') || error.message?.includes('Network')) {
        const existingToken = await AsyncStorage.getItem(EXPO_TOKEN_KEY);
        if (existingToken) {
          console.log('Using cached token due to network error:', existingToken);
          this.expoToken = existingToken;
          return existingToken;
        }
      }
      
      return null;
    }
  }

  // Register device token with backend
  async registerDeviceWithBackend(token) {
    try {
      // Check authentication before making API call
      const isAuthenticated = await jwtApiService.isUserAuthenticated();
      if (!isAuthenticated) {
        console.log('User not authenticated, skipping device registration');
        return;
      }

      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await jwtApiService.registerDevice({
        deviceToken: token,
        platform: platform,
      });
      console.log('Device registered with backend successfully');
    } catch (error) {
      // Silently handle network errors - backend might not be running
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        console.log('Backend not available, device token saved locally only');
      } else {
        console.error('Error registering device with backend:', error);
      }
    }
  }

  // Set up message handlers
  setupMessageHandlers() {
    // Handle notifications received while app is foregrounded
    this.unsubscribeOnMessage = Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground notification received:', notification);
      // You can show a custom alert or update UI here
    });

    // Handle notifications that are tapped/opened
    this.unsubscribeOnNotificationOpenedApp = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification opened:', response);
      // Handle notification actions (Complete, Snooze, Skip)
      this.handleNotificationResponse(response);
    });
  }

  // Check if notifications are properly configured
  async areNotificationsEnabled() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // Get current token
  async getToken() {
    try {
      if (this.expoToken) {
        return this.expoToken;
      }
      return await this.getExpoToken();
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Send achievement notification
  async sendAchievementAlert(achievementData) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Achievement Unlocked!',
          body: `${achievementData.title}: ${achievementData.description}`,
          data: { type: 'achievement', ...achievementData },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  }

  // Send community update notification
  async sendCommunityUpdate(updateData) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Community Update',
          body: updateData.message || 'New community activity!',
          data: { type: 'community', ...updateData },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending community notification:', error);
    }
  }

  // Send custom notification
  async sendCustomNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending custom notification:', error);
    }
  }

  // Update notification settings
  async updateNotificationSettings(newSettings) {
    try {
      // Save settings locally
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(newSettings));

      // Sync with backend
      await this.syncSettingsWithBackend(newSettings);

      console.log('Notification settings updated');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  /**
   * Schedule flow reminder based on level
   */
  async scheduleFlowReminder(flowId, flowTitle, level, scheduledTime, customSound = null) {
    try {
      console.log(`🔔 Scheduling ${level} reminder for flow: ${flowTitle} at ${scheduledTime}`);
      
      const notificationId = `flow_${flowId}_${level}_${Date.now()}`;
      
      // Calculate trigger time
      const triggerTime = this.calculateTriggerTime(scheduledTime);
      if (!triggerTime) {
        console.error('Invalid trigger time for notification');
        return false;
      }

      // Create notification based on level with custom sound
      const notification = this.createLevelBasedNotification(flowId, flowTitle, level, notificationId, customSound);
      
      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: notification.content,
        trigger: {
          date: triggerTime,
          repeats: level === 3, // Level 3 repeats until completed
        },
      });

      console.log(`✅ ${level} reminder scheduled for ${flowTitle}`);
      return true;
    } catch (error) {
      console.error('Error scheduling flow reminder:', error);
      return false;
    }
  }

  /**
   * Calculate trigger time from scheduled time string
   */
  calculateTriggerTime(scheduledTime) {
    try {
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const now = new Date();
      const triggerTime = new Date();
      
      triggerTime.setHours(hours, minutes, 0, 0);
      
      // If the time has passed today, schedule for tomorrow
      if (triggerTime <= now) {
        triggerTime.setDate(triggerTime.getDate() + 1);
      }
      
      return triggerTime;
    } catch (error) {
      console.error('Error calculating trigger time:', error);
      return null;
    }
  }

  /**
   * Create notification content based on flow level with custom sounds and vibrations
   */
  createLevelBasedNotification(flowId, flowTitle, level, notificationId, customSound = null) {
    const baseContent = {
      title: `Flow Reminder: ${flowTitle}`,
      data: {
        flowId,
        level,
        notificationId,
        type: 'flow_reminder'
      }
    };

    // Get sound and vibration based on level and settings
    const sound = this.getSoundForLevel(level, customSound);
    const vibrationPattern = this.getVibrationPattern(level);

    switch (level) {
      case 1:
        return {
          content: {
            ...baseContent,
            body: `🌱 Gentle reminder: Time to complete your flow: ${flowTitle}`,
            sound: sound,
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
            categoryIdentifier: 'FLOW_GENTLE',
            vibrate: vibrationPattern,
          }
        };

      case 2:
        return {
          content: {
            ...baseContent,
            body: `🔔 Moderate push: Complete your flow: ${flowTitle}`,
            sound: sound,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: 'FLOW_MODERATE',
            vibrate: vibrationPattern,
          }
        };

      case 3:
        return {
          content: {
            ...baseContent,
            body: `🚨 URGENT ALARM: Complete your flow: ${flowTitle} (This will keep reminding you!)`,
            sound: sound,
            priority: Notifications.AndroidNotificationPriority.MAX,
            categoryIdentifier: 'FLOW_URGENT',
            vibrate: vibrationPattern,
            sticky: true, // Makes it harder to dismiss
            autoDismiss: false, // Requires user interaction
          }
        };

      default:
        return {
          content: {
            ...baseContent,
            body: `Reminder: ${flowTitle}`,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          }
        };
    }
  }

  /**
   * Cancel flow reminder
   */
  async cancelFlowReminder(flowId, level) {
    try {
      const notificationId = `flow_${flowId}_${level}`;
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`❌ Cancelled ${level} reminder for flow ${flowId}`);
    } catch (error) {
      console.error('Error cancelling flow reminder:', error);
    }
  }

  /**
   * Cancel all reminders for a flow
   */
  async cancelAllFlowReminders(flowId) {
    try {
      const levels = [1, 2, 3];
      for (const level of levels) {
        await this.cancelFlowReminder(flowId, level);
      }
      console.log(`❌ Cancelled all reminders for flow ${flowId}`);
    } catch (error) {
      console.error('Error cancelling all flow reminders:', error);
    }
  }

  // ==================== QUIET HOURS FUNCTIONALITY ====================

  /**
   * Check if current time is within quiet hours
   */
  async isQuietHours() {
    try {
      const settings = await this.getQuietHoursSettings();
      if (!settings?.enabled) {
        return false;
      }

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const startTime = this.parseTimeString(settings.start);
      const endTime = this.parseTimeString(settings.end);
      
      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime;
      } else {
        return currentTime >= startTime && currentTime <= endTime;
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    }
  }

  /**
   * Parse time string (HH:MM) to minutes since midnight
   */
  parseTimeString(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get quiet hours settings
   */
  async getQuietHoursSettings() {
    try {
      if (this.quietHoursSettings) {
        return this.quietHoursSettings;
      }
      
      const settings = await AsyncStorage.getItem(QUIET_HOURS_KEY);
      if (settings) {
        this.quietHoursSettings = JSON.parse(settings);
        return this.quietHoursSettings;
      }
      
      // Default quiet hours
      const defaultSettings = {
        enabled: false,
        start: '22:00',
        end: '08:00'
      };
      
      await this.setQuietHoursSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error getting quiet hours settings:', error);
      return { enabled: false, start: '22:00', end: '08:00' };
    }
  }

  /**
   * Set quiet hours settings
   */
  async setQuietHoursSettings(settings) {
    try {
      this.quietHoursSettings = settings;
      await AsyncStorage.setItem(QUIET_HOURS_KEY, JSON.stringify(settings));
      console.log('✅ Quiet hours settings updated:', settings);
    } catch (error) {
      console.error('Error setting quiet hours:', error);
    }
  }

  // ==================== SOUND & VIBRATION FUNCTIONALITY ====================

  /**
   * Get vibration pattern for flow level
   */
  getVibrationPattern(level) {
    const patterns = {
      level1: [0, 100, 100, 100], // Light vibration
      level2: [0, 250, 250, 250], // Medium vibration
      level3: [0, 500, 250, 500, 250, 500] // Strong vibration
    };
    return patterns[`level${level}`] || patterns.level1;
  }

  /**
   * Get sound for flow level with settings integration
   */
  getSoundForLevel(level, customSound = null) {
    // Priority: customSound from flow > settings ringtone > default
    if (customSound) return customSound;
    
    // Get ringtone from notification settings
    const settings = this.notificationSettings;
    if (settings?.flowLevels?.[`level${level}`]?.ringtone) {
      const ringtone = settings.flowLevels[`level${level}`].ringtone;
      if (ringtone === 'custom' && settings.flowLevels[`level${level}`].customRingtone) {
        return settings.flowLevels[`level${level}`].customRingtone;
      }
      return ringtone === 'default' ? 'default' : ringtone;
    }
    
    // Fallback to default sounds
    const sounds = {
      level1: 'default', // Standard notification sound
      level2: 'default', // Default ringtone
      level3: 'default'  // Default alarm sound
    };
    return sounds[`level${level}`] || 'default';
  }

  /**
   * Trigger vibration based on level
   */
  triggerVibration(level) {
    try {
      const pattern = this.getVibrationPattern(level);
      Vibration.vibrate(pattern);
      console.log(`📳 Vibration triggered for level ${level}:`, pattern);
    } catch (error) {
      console.error('Error triggering vibration:', error);
    }
  }

  // ==================== AUTOMATIC NOTIFICATION SCHEDULING ====================

  /**
   * Schedule automatic notifications (daily reminders, weekly reports)
   */
  async scheduleAutomaticNotifications() {
    try {
      console.log('📅 Scheduling automatic notifications...');
      
      // Schedule daily reminder at 9:00 AM
      await this.scheduleDailyReminder();
      
      // Schedule weekly report on Sundays at 8:00 PM
      await this.scheduleWeeklyReport();
      
      console.log('✅ Automatic notifications scheduled');
    } catch (error) {
      console.error('Error scheduling automatic notifications:', error);
    }
  }

  /**
   * Schedule daily reminder notification
   */
  async scheduleDailyReminder() {
    try {
      const settings = await this.getNotificationSettings();
      if (!settings?.dailyReminders) {
        console.log('🔇 Daily reminder scheduling skipped - disabled in settings');
        return;
      }

      // Cancel existing daily reminder
      await Notifications.cancelScheduledNotificationAsync('daily_reminder');

      // Schedule new daily reminder for 9:00 AM
      const trigger = {
        hour: 9,
        minute: 0,
        repeats: true
      };

      await Notifications.scheduleNotificationAsync({
        identifier: 'daily_reminder',
        content: {
          title: '🌅 Good Morning!',
          body: 'Time to start your flows and make today amazing!',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          categoryIdentifier: 'DAILY_REMINDER',
          vibrate: [0, 200, 200, 200],
          data: {
            type: 'daily_reminder',
            timestamp: Date.now()
          }
        },
        trigger
      });

      console.log('✅ Daily reminder scheduled for 9:00 AM');
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }

  /**
   * Schedule weekly report notification
   */
  async scheduleWeeklyReport() {
    try {
      const settings = await this.getNotificationSettings();
      if (!settings?.weeklyReports) {
        console.log('🔇 Weekly report scheduling skipped - disabled in settings');
        return;
      }

      // Cancel existing weekly report
      await Notifications.cancelScheduledNotificationAsync('weekly_report');

      // Schedule weekly report for Sundays at 8:00 PM
      const trigger = {
        weekday: 1, // Sunday
        hour: 20,
        minute: 0,
        repeats: true
      };

      await Notifications.scheduleNotificationAsync({
        identifier: 'weekly_report',
        content: {
          title: '📊 Weekly Report',
          body: 'Check out your progress and achievements this week!',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          categoryIdentifier: 'WEEKLY_REPORT',
          vibrate: [0, 300, 100, 300],
          data: {
            type: 'weekly_report',
            timestamp: Date.now()
          }
        },
        trigger
      });

      console.log('✅ Weekly report scheduled for Sundays at 8:00 PM');
    } catch (error) {
      console.error('Error scheduling weekly report:', error);
    }
  }

  // ==================== GENERAL NOTIFICATIONS ====================

  /**
   * Send daily reminder notification
   */
  async sendDailyReminder(flowsData = []) {
    try {
      const isQuiet = await this.isQuietHours();
      if (isQuiet) {
        console.log('🔇 Daily reminder skipped - quiet hours active');
        return false;
      }

      const settings = await this.getNotificationSettings();
      if (!settings?.dailyReminders) {
        console.log('🔇 Daily reminder skipped - disabled in settings');
        return false;
      }

      const activeFlows = flowsData.filter(flow => flow.status?.active !== false);
      const flowCount = activeFlows.length;

      if (flowCount === 0) {
        console.log('📝 No active flows - skipping daily reminder');
        return false;
      }

      const notification = {
        content: {
          title: '🌅 Good Morning!',
          body: `You have ${flowCount} flow${flowCount > 1 ? 's' : ''} to complete today. Let's make it a great day!`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          categoryIdentifier: 'DAILY_REMINDER',
          vibrate: [0, 200, 200, 200],
          data: {
            type: 'daily_reminder',
            flowCount,
            timestamp: Date.now()
          }
        }
      };

      await Notifications.scheduleNotificationAsync({
        identifier: `daily_reminder_${Date.now()}`,
        content: notification.content,
        trigger: null, // Send immediately
      });

      console.log('✅ Daily reminder sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending daily reminder:', error);
      return false;
    }
  }

  /**
   * Send weekly report notification
   */
  async sendWeeklyReport(statsData = {}) {
    try {
      const isQuiet = await this.isQuietHours();
      if (isQuiet) {
        console.log('🔇 Weekly report skipped - quiet hours active');
        return false;
      }

      const settings = await this.getNotificationSettings();
      if (!settings?.weeklyReports) {
        console.log('🔇 Weekly report skipped - disabled in settings');
        return false;
      }

      const { completedFlows = 0, totalFlows = 0, streak = 0 } = statsData;
      const completionRate = totalFlows > 0 ? Math.round((completedFlows / totalFlows) * 100) : 0;

      const notification = {
        content: {
          title: '📊 Weekly Report',
          body: `You completed ${completedFlows}/${totalFlows} flows (${completionRate}%) this week! ${streak > 0 ? `🔥 ${streak} day streak!` : ''}`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          categoryIdentifier: 'WEEKLY_REPORT',
          vibrate: [0, 300, 100, 300],
          data: {
            type: 'weekly_report',
            stats: statsData,
            timestamp: Date.now()
          }
        }
      };

      await Notifications.scheduleNotificationAsync({
        identifier: `weekly_report_${Date.now()}`,
        content: notification.content,
        trigger: null, // Send immediately
      });

      console.log('✅ Weekly report sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending weekly report:', error);
      return false;
    }
  }

  /**
   * Send achievement alert notification
   */
  async sendAchievementAlert(achievementData) {
    try {
      const isQuiet = await this.isQuietHours();
      if (isQuiet) {
        console.log('🔇 Achievement alert skipped - quiet hours active');
        return false;
      }

      const settings = await this.getNotificationSettings();
      if (!settings?.achievementAlerts) {
        console.log('🔇 Achievement alert skipped - disabled in settings');
        return false;
      }

      const { title, description, icon = '🏆' } = achievementData;

      const notification = {
        content: {
          title: `${icon} Achievement Unlocked!`,
          body: `${title}: ${description}`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'ACHIEVEMENT_ALERT',
          vibrate: [0, 500, 200, 500],
          data: {
            type: 'achievement_alert',
            achievement: achievementData,
            timestamp: Date.now()
          }
        }
      };

      await Notifications.scheduleNotificationAsync({
        identifier: `achievement_${achievementData.id}_${Date.now()}`,
        content: notification.content,
        trigger: null, // Send immediately
      });

      // Trigger vibration for achievement
      this.triggerVibration(2); // Medium vibration for achievements

      console.log('✅ Achievement alert sent successfully:', title);
      return true;
    } catch (error) {
      console.error('Error sending achievement alert:', error);
      return false;
    }
  }

  /**
   * Send community update notification
   */
  async sendCommunityUpdate(updateData) {
    try {
      const isQuiet = await this.isQuietHours();
      if (isQuiet) {
        console.log('🔇 Community update skipped - quiet hours active');
        return false;
      }

      const settings = await this.getNotificationSettings();
      if (!settings?.communityUpdates) {
        console.log('🔇 Community update skipped - disabled in settings');
        return false;
      }

      const { title, message, type = 'general' } = updateData;

      const notification = {
        content: {
          title: `👥 Community Update: ${title}`,
          body: message,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          categoryIdentifier: 'COMMUNITY_UPDATE',
          vibrate: [0, 200, 200, 200],
          data: {
            type: 'community_update',
            update: updateData,
            timestamp: Date.now()
          }
        }
      };

      await Notifications.scheduleNotificationAsync({
        identifier: `community_update_${Date.now()}`,
        content: notification.content,
        trigger: null, // Send immediately
      });

      console.log('✅ Community update sent successfully:', title);
      return true;
    } catch (error) {
      console.error('Error sending community update:', error);
      return false;
    }
  }

  /**
   * Test quiet hours functionality
   */
  async testQuietHours() {
    try {
      console.log('🔇 Testing quiet hours functionality...');
      
      // Get current quiet hours settings
      const currentSettings = await this.getQuietHoursSettings();
      console.log('Current quiet hours settings:', currentSettings);
      
      // Check if currently in quiet hours
      const isCurrentlyQuiet = await this.isQuietHours();
      console.log('Currently in quiet hours:', isCurrentlyQuiet);
      
      // Test with quiet hours enabled
      await this.setQuietHoursSettings({
        enabled: true,
        start: '22:00',
        end: '08:00'
      });
      
      const isQuietAfterSetting = await this.isQuietHours();
      console.log('After setting quiet hours (22:00-08:00):', isQuietAfterSetting);
      
      // Test with quiet hours disabled
      await this.setQuietHoursSettings({
        enabled: false,
        start: '22:00',
        end: '08:00'
      });
      
      const isQuietAfterDisabling = await this.isQuietHours();
      console.log('After disabling quiet hours:', isQuietAfterDisabling);
      
      // Test overnight quiet hours (22:00 to 08:00)
      await this.setQuietHoursSettings({
        enabled: true,
        start: '22:00',
        end: '08:00'
      });
      
      // Test different times
      const testTimes = [
        { time: '21:59', expected: false, description: 'Before quiet hours start' },
        { time: '22:00', expected: true, description: 'At quiet hours start' },
        { time: '23:30', expected: true, description: 'During quiet hours' },
        { time: '02:00', expected: true, description: 'Overnight during quiet hours' },
        { time: '07:59', expected: true, description: 'Before quiet hours end' },
        { time: '08:00', expected: false, description: 'At quiet hours end' },
        { time: '12:00', expected: false, description: 'Outside quiet hours' }
      ];
      
      console.log('Testing quiet hours logic with different times:');
      for (const test of testTimes) {
        // Mock current time for testing
        const originalDate = Date;
        global.Date = class extends Date {
          constructor(...args) {
            if (args.length === 0) {
              // Return current time for normal operations
              super();
            } else {
              super(...args);
            }
          }
          
          static now() {
            return originalDate.now();
          }
          
          getHours() {
            const [hours] = test.time.split(':').map(Number);
            return hours;
          }
          
          getMinutes() {
            const [, minutes] = test.time.split(':').map(Number);
            return minutes;
          }
        };
        
        const isQuietAtTime = await this.isQuietHours();
        const result = isQuietAtTime === test.expected ? '✅' : '❌';
        console.log(`${result} ${test.description} (${test.time}): Expected ${test.expected}, Got ${isQuietAtTime}`);
        
        // Restore original Date
        global.Date = originalDate;
      }
      
      // Restore original settings
      await this.setQuietHoursSettings(currentSettings);
      
      console.log('✅ Quiet hours functionality test completed');
      return true;
    } catch (error) {
      console.error('Error testing quiet hours:', error);
      return false;
    }
  }

  // ==================== REAL-TIME NOTIFICATION UPDATES ====================

  /**
   * Update notification settings in real-time
   */
  async updateNotificationSettings(settings) {
    try {
      this.notificationSettings = settings;
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(settings));
      
      // Update flow level ringtones if provided
      if (settings.flowLevels) {
        this.flowLevelRingtones = {
          level1: { sound: 'default', vibration: 'light' },
          level2: settings.flowLevels.level2 || { sound: 'default', vibration: 'medium' },
          level3: settings.flowLevels.level3 || { sound: 'default', vibration: 'strong' }
        };
      }
      
      // Update quiet hours if provided
      if (settings.quietHours) {
        await this.setQuietHoursSettings(settings.quietHours);
      }
      
      // Reschedule automatic notifications if settings changed
      await this.scheduleAutomaticNotifications();
      
      console.log('✅ Notification settings updated in real-time:', settings);
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }

  /**
   * Get current notification settings
   */
  async getNotificationSettings() {
    try {
      if (this.notificationSettings) {
        return this.notificationSettings;
      }
      
      const settings = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (settings) {
        this.notificationSettings = JSON.parse(settings);
        return this.notificationSettings;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }

  /**
   * Handle notification response (when user interacts with notification)
   */
  async handleNotificationResponse(response) {
    try {
      const { data } = response.notification.request.content;
      
      if (data.type === 'flow_reminder') {
        const { flowId, level, notificationId } = data;
        
        // Handle different actions based on level
        if (response.actionIdentifier === 'COMPLETE_FLOW') {
          await this.markFlowCompleted(flowId);
          await this.cancelFlowReminder(flowId, level);
        } else if (response.actionIdentifier === 'SNOOZE') {
          await this.snoozeFlowReminder(flowId, level, notificationId);
        } else if (response.actionIdentifier === 'SKIP') {
          await this.skipFlowReminder(flowId, level);
        }
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  }

  /**
   * Snooze flow reminder (for level 3)
   */
  async snoozeFlowReminder(flowId, level, notificationId) {
    try {
      // Cancel current notification
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      
      // Schedule new notification in 15 minutes
      const snoozeTime = new Date(Date.now() + 15 * 60 * 1000);
      
      await Notifications.scheduleNotificationAsync({
        identifier: `${notificationId}_snooze_${Date.now()}`,
        content: {
          title: `Flow Reminder (Snoozed): ${flowId}`,
          body: `Time to complete your flow! (Snoozed for 15 minutes)`,
          data: { flowId, level, type: 'flow_reminder', snoozed: true },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: snoozeTime,
          repeats: level === 3, // Keep repeating if level 3
        },
      });
      
      console.log(`⏰ Snoozed flow reminder for ${flowId}`);
    } catch (error) {
      console.error('Error snoozing flow reminder:', error);
    }
  }

  /**
   * Mark flow as completed
   */
  async markFlowCompleted(flowId) {
    try {
      // This would integrate with your flow completion logic
      console.log(`✅ Flow ${flowId} marked as completed`);
      
      // Cancel all reminders for this flow
      await this.cancelAllFlowReminders(flowId);
      
      // Send completion notification
      await this.sendCustomNotification(
        'Flow Completed! 🎉',
        'Great job completing your flow!',
        { flowId, type: 'flow_completed' }
      );
    } catch (error) {
      console.error('Error marking flow as completed:', error);
    }
  }

  /**
   * Schedule reminders for all active flows based on their levels
   */
  async scheduleAllFlowReminders(flows) {
    try {
      console.log('🔔 Scheduling reminders for all active flows...');
      
      let scheduledCount = 0;
      const now = new Date();
      
      for (const flow of flows) {
        // Skip deleted or archived flows
        if (flow.deletedAt || flow.archived) {
          continue;
        }
        
        // Get flow level (1, 2, or 3) - default to 1 if not specified
        const flowLevel = flow.level || flow.reminderLevel || 1;
        
        // Get reminder time - use flow's reminder time or default
        const reminderTime = flow.reminderTime || flow.defaultReminderTime || '09:00';
        
        // Schedule the reminder
        const success = await this.scheduleFlowReminder(
          flow.id,
          flow.title,
          flowLevel,
          reminderTime
        );
        
        if (success) {
          scheduledCount++;
          console.log(`✅ Scheduled Level ${flowLevel} reminder for: ${flow.title}`);
        }
      }
      
      console.log(`🎯 Successfully scheduled ${scheduledCount} flow reminders`);
      return scheduledCount;
    } catch (error) {
      console.error('Error scheduling all flow reminders:', error);
      return 0;
    }
  }

  /**
   * Update flow reminder when flow is modified
   */
  async updateFlowReminder(flowId, flowTitle, level, reminderTime) {
    try {
      // Cancel existing reminders for this flow
      await this.cancelAllFlowReminders(flowId);
      
      // Schedule new reminder
      const success = await this.scheduleFlowReminder(flowId, flowTitle, level, reminderTime);
      
      if (success) {
        console.log(`🔄 Updated reminder for flow: ${flowTitle} (Level ${level})`);
      }
      
      return success;
    } catch (error) {
      console.error('Error updating flow reminder:', error);
      return false;
    }
  }

  /**
   * Cancel flow reminder when flow is completed
   */
  async completeFlowReminder(flowId) {
    try {
      await this.markFlowCompleted(flowId);
      console.log(`✅ Flow ${flowId} completed - all reminders cancelled`);
    } catch (error) {
      console.error('Error completing flow reminder:', error);
    }
  }

  // Load settings from backend
  async loadSettingsFromBackend() {
    try {
      // Check authentication before making API call
      const isAuthenticated = await jwtApiService.isUserAuthenticated();
      if (!isAuthenticated) {
        console.log('User not authenticated, skipping notification settings load');
        return null;
      }

      const response = await jwtApiService.getNotificationSettings();
      if (response.data && response.data.success) {
        const backendSettings = response.data.data;
        await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(backendSettings));
        console.log('Notification settings loaded from backend');
        return backendSettings;
      }
    } catch (error) {
      // Silently handle network errors - backend might not be running
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        console.log('Backend not available, using local settings');
      } else {
        console.error('Error loading notification settings from backend:', error);
      }
    }
    return null;
  }

  // Get notification settings
  async getNotificationSettings() {
    try {
      // Try to load from backend first
      const backendSettings = await this.loadSettingsFromBackend();
      if (backendSettings) {
        return backendSettings;
      }

      const storedSettings = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (storedSettings) {
        return JSON.parse(storedSettings);
      } else {
        // Default settings if none are stored
        return {
          dailyReminders: true,
          weeklyReports: true,
          achievementAlerts: true,
          communityUpdates: false,
          reminderTime: '09:00',
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          },
          reminderSound: 'default',
          vibration: true
        };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return null;
    }
  }

  // Send test notification (works in both Expo Go and development builds)
  async sendTestNotification() {
    try {
      console.log('🧪 Sending test notification with actual flow logic...');
      
      // Check if we're in Expo Go
      const isExpoGo = __DEV__ && !global.EXPO_PROJECT_ID;
      if (isExpoGo) {
        console.log('📱 Using local notification for Expo Go');
      }
      
      // Check permissions first
      const hasPermissions = await this.areNotificationsEnabled();
      if (!hasPermissions) {
        console.warn('❌ No notification permissions, cannot send test notification');
        return false;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Flow Notification Test',
          body: 'Testing actual flow reminder system - Level 1 notification',
          data: { 
            type: 'test',
            flowId: 'test-flow',
            level: 1,
            notificationId: 'test-notification'
          },
          categoryIdentifier: 'FLOW_REMINDER',
        },
        trigger: null, // Show immediately
      });

      // Also schedule a Level 2 test alarm in 30 seconds
      const alarmTime = new Date(Date.now() + 30 * 1000);
      await Notifications.scheduleNotificationAsync({
        identifier: 'test-alarm-level2',
        content: {
          title: 'Flow Alarm Test',
          body: '🔔 ALARM: Testing Level 2 alarm notification',
          data: { 
            type: 'test',
            flowId: 'test-flow-2',
            level: 2,
            notificationId: 'test-alarm-level2'
          },
          categoryIdentifier: 'FLOW_ALARM',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
        },
        trigger: {
          date: alarmTime,
        },
      });

      // Schedule a Level 3 urgent test alarm in 60 seconds
      const urgentTime = new Date(Date.now() + 60 * 1000);
      await Notifications.scheduleNotificationAsync({
        identifier: 'test-urgent-level3',
        content: {
          title: 'Flow Urgent Test',
          body: '🚨 URGENT: Testing Level 3 urgent alarm (will repeat)',
          data: { 
            type: 'test',
            flowId: 'test-flow-3',
            level: 3,
            notificationId: 'test-urgent-level3'
          },
          categoryIdentifier: 'FLOW_URGENT',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 500, 250, 500],
          sticky: true,
        },
        trigger: {
          date: urgentTime,
          repeats: true, // This will repeat every minute for testing
        },
      });

      console.log('✅ Test notifications scheduled:');
      console.log('  - Level 1: Immediate notification');
      console.log('  - Level 2: Alarm in 30 seconds');
      console.log('  - Level 3: Urgent alarm in 60 seconds (repeating)');
      return true;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      console.error('Test notification error details:', {
        message: error.message,
        code: error.code,
        platform: Platform.OS,
        version: Platform.Version
      });
      throw error;
    }
  }

  // Send local notification (always works, even in Expo Go)
  async sendLocalNotification(title, body, data = {}) {
    try {
      console.log('🔔 Sending local notification:', title);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: { seconds: 1 },
      });
      
      console.log('✅ Local notification scheduled with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
      throw error;
    }
  }

  // Debug notification system
  async debugNotificationSystem() {
    console.log('🔍 Debugging notification system...');
    console.log('Platform:', Platform.OS, 'Version:', Platform.Version);
    
    try {
      // Check permissions
      const permissions = await Notifications.getPermissionsAsync();
      console.log('Current permissions:', permissions);
      
      // Check if we have a token
      const token = await this.getToken();
      console.log('Current token:', token ? 'Available' : 'Not available');
      
      // Try to send a test notification
      const testResult = await this.sendTestNotification();
      console.log('Test notification result:', testResult ? 'Success' : 'Failed');
      
      return {
        platform: Platform.OS,
        version: Platform.Version,
        permissions: permissions.status,
        hasToken: !!token,
        testNotification: testResult
      };
    } catch (error) {
      console.error('❌ Debug error:', error);
      return {
        platform: Platform.OS,
        version: Platform.Version,
        error: error.message
      };
    }
  }

  // Get Expo push token for sending notifications from server
  async getToken() {
    return this.expoToken || await this.getExpoToken();
  }

  // Schedule daily reminder
  async scheduleDailyReminder(time) {
    try {
      const [hour, minute] = time.split(':').map(Number);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Flow Reminder',
          body: 'Time to log your flows for today!',
          data: { type: 'daily_reminder' },
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });
      
      console.log(`Daily reminder scheduled for ${time}`);
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All scheduled notifications cancelled');
    } catch (error) {
      console.error('Error cancelling scheduled notifications:', error);
    }
  }

  // Check if notifications are enabled
  async checkNotificationPermissions() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // Send achievement alert
  async sendAchievementAlert(achievementData) {
    try {
      await this.sendLocalNotification(
        'Achievement Unlocked! 🎉',
        `You've unlocked: ${achievementData.title}`,
        { type: 'achievement', achievementId: achievementData.id }
      );
    } catch (error) {
      console.error('Error sending achievement alert:', error);
    }
  }

  // Send community update notification
  async sendCommunityUpdate(updateData) {
    try {
      await this.sendLocalNotification(
        'Community Update',
        updateData.message || 'New community activity!',
        { type: 'community', updateId: updateData.id }
      );
    } catch (error) {
      console.error('Error sending community update:', error);
    }
  }

  // Send custom notification
  async sendCustomNotification(title, body, data = {}) {
    try {
      await this.sendLocalNotification(title, body, data);
    } catch (error) {
      console.error('Error sending custom notification:', error);
    }
  }

  // Check if notifications are enabled
  async areNotificationsEnabled() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // Get token (alias for getExpoToken)
  async getToken() {
    return await this.getExpoToken();
  }

  // Cleanup
  cleanup() {
    console.log('Expo Notification service cleanup.');
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
    }
    if (this.unsubscribeOnNotificationOpenedApp) {
      this.unsubscribeOnNotificationOpenedApp();
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;