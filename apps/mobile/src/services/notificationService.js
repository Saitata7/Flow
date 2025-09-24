// services/notificationService.js
import * as Notifications from 'expo-notifications';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../config/api';

const NOTIFICATION_STORAGE_KEY = 'notification_settings';
const EXPO_TOKEN_KEY = 'expo_token';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.expoToken = null;
    this.unsubscribeTokenRefresh = null;
    this.unsubscribeOnMessage = null;
    this.unsubscribeOnNotificationOpenedApp = null;
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
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await apiClient.post('/notifications/registerDevice', {
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
      // Handle navigation or deep linking here
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

  // Sync settings with backend
  async syncSettingsWithBackend(settings) {
    try {
      await apiClient.patch('/notifications/settings', settings);
      console.log('Notification settings synced with backend');
    } catch (error) {
      // Silently handle network errors - backend might not be running
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        console.log('Backend not available, settings saved locally only');
      } else {
        console.error('Error syncing notification settings with backend:', error);
      }
    }
  }

  // Load settings from backend
  async loadSettingsFromBackend() {
    try {
      const response = await apiClient.get('/notifications/settings');
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
      console.log('🧪 Sending test notification...');
      
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
          title: 'Test Notification',
          body: 'This is a test notification to verify Expo Notifications is working!',
          data: { type: 'test' },
        },
        trigger: null, // Show immediately
      });
      console.log('✅ Test notification sent successfully');
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