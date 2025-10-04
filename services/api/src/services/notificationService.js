// services/notificationService.js
const admin = require('firebase-admin');
const { db } = require('../db/config');

class NotificationService {
  constructor() {
    this.firebaseApp = null;
    this.initializeFirebase();
  }

  async initializeFirebase() {
    try {
      if (!admin.apps.length) {
        // Initialize Firebase Admin SDK
        const serviceAccount = require('../../keys/firebase-adminsdk-config.json');
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
      } else {
        this.firebaseApp = admin.app();
      }
      console.log('Firebase Admin SDK initialized for notifications');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  /**
   * Send push notification to a specific user
   * @param {string} userId - User ID
   * @param {Object} payload - Notification payload
   * @param {string} payload.title - Notification title
   * @param {string} payload.body - Notification body
   * @param {string} payload.category - Notification category (reminder, achievement, etc.)
   * @param {Object} payload.data - Additional data payload
   * @param {Object} payload.sound - Sound settings
   * @param {boolean} payload.vibration - Vibration enabled
   */
  async sendPush(userId, payload) {
    try {
      // Get user's device tokens
      const userTokens = await this.getUserDeviceTokens(userId);

      if (!userTokens || userTokens.length === 0) {
        console.log(`No device tokens found for user ${userId}`);
        return { success: false, message: 'No device tokens found' };
      }

      // Get user's notification settings
      const userSettings = await this.getUserNotificationSettings(userId);

      // Check if notification type is enabled
      if (!this.isNotificationTypeEnabled(payload.category, userSettings)) {
        console.log(`Notification type ${payload.category} is disabled for user ${userId}`);
        return { success: false, message: 'Notification type disabled' };
      }

      // Check quiet hours
      if (this.isInQuietHours(userSettings)) {
        console.log(`User ${userId} is in quiet hours, skipping notification`);
        return { success: false, message: 'User in quiet hours' };
      }

      // Prepare notification message
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          category: payload.category,
          userId: userId,
          timestamp: new Date().toISOString(),
          ...payload.data,
        },
        android: {
          notification: {
            sound: userSettings.reminderSound || 'default',
            vibrateTimingsMillis: userSettings.vibration ? [0, 250, 250, 250] : undefined,
            priority: 'high',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: userSettings.reminderSound || 'default',
              badge: 1,
            },
          },
        },
        tokens: userTokens,
      };

      // Send notification
      const response = await admin.messaging().sendMulticast(message);

      // Log notification
      await this.logNotification(userId, payload, response);

      return {
        success: true,
        message: 'Notification sent successfully',
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Schedule daily reminder for a user
   * @param {string} userId - User ID
   * @param {string} time - Time in HH:MM format
   */
  async scheduleDailyReminder(userId, time) {
    try {
      const userSettings = await this.getUserNotificationSettings(userId);

      if (!userSettings.dailyReminders) {
        console.log(`Daily reminders disabled for user ${userId}`);
        return { success: false, message: 'Daily reminders disabled' };
      }

      // Parse time
      const [hours, minutes] = time.split(':').map(Number);

      // Create reminder payload
      const payload = {
        title: 'Daily Flow Reminder',
        body: "Don't forget to complete your daily flows!",
        category: 'reminder',
        data: {
          type: 'daily_reminder',
          reminderTime: time,
        },
      };

      // For now, we'll use a simple approach
      // In production, you'd use a job queue like Bull or Agenda
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);

      // If reminder time has passed today, schedule for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      // Schedule the reminder (simplified - in production use proper job scheduling)
      console.log(`Scheduled daily reminder for user ${userId} at ${reminderTime.toISOString()}`);

      return {
        success: true,
        message: 'Daily reminder scheduled',
        scheduledTime: reminderTime.toISOString(),
      };
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      throw error;
    }
  }

  /**
   * Send weekly report notification
   * @param {string} userId - User ID
   */
  async sendWeeklyReport(userId) {
    try {
      const userSettings = await this.getUserNotificationSettings(userId);

      if (!userSettings.weeklyReports) {
        console.log(`Weekly reports disabled for user ${userId}`);
        return { success: false, message: 'Weekly reports disabled' };
      }

      // Get user's weekly stats (you'd implement this based on your stats service)
      const weeklyStats = await this.getWeeklyStats(userId);

      const payload = {
        title: 'Weekly Flow Report',
        body: `You completed ${weeklyStats.completedFlows} flows this week!`,
        category: 'report',
        data: {
          type: 'weekly_report',
          stats: weeklyStats,
        },
      };

      return await this.sendPush(userId, payload);
    } catch (error) {
      console.error('Error sending weekly report:', error);
      throw error;
    }
  }

  /**
   * Send achievement notification
   * @param {string} userId - User ID
   * @param {Object} achievement - Achievement data
   */
  async sendAchievementNotification(userId, achievement) {
    try {
      const userSettings = await this.getUserNotificationSettings(userId);

      if (!userSettings.achievementAlerts) {
        console.log(`Achievement alerts disabled for user ${userId}`);
        return { success: false, message: 'Achievement alerts disabled' };
      }

      const payload = {
        title: 'Achievement Unlocked! 🎉',
        body: achievement.description || `You've earned: ${achievement.name}`,
        category: 'achievement',
        data: {
          type: 'achievement',
          achievementId: achievement.id,
          achievementName: achievement.name,
        },
      };

      return await this.sendPush(userId, payload);
    } catch (error) {
      console.error('Error sending achievement notification:', error);
      throw error;
    }
  }

  /**
   * Register device token for a user
   * @param {string} userId - User ID
   * @param {string} deviceToken - FCM device token
   * @param {string} platform - Platform (ios, android)
   */
  async registerDeviceToken(userId, deviceToken, platform = 'unknown') {
    try {
      const deviceData = {
        userId,
        deviceToken,
        platform,
        registeredAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        isActive: true,
      };

      // Store in database (you'd implement this based on your DB structure)
      await this.storeDeviceToken(deviceData);

      console.log(`Device token registered for user ${userId}`);
      return { success: true, message: 'Device token registered successfully' };
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  }

  /**
   * Get notification logs for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of logs to return
   * @param {number} offset - Offset for pagination
   */
  async getNotificationLogs(userId, limit = 50, offset = 0) {
    try {
      // This would query your notification logs table
      const logs = await this.queryNotificationLogs(userId, limit, offset);
      return {
        success: true,
        data: logs,
        pagination: {
          limit,
          offset,
          hasMore: logs.length === limit,
        },
      };
    } catch (error) {
      console.error('Error getting notification logs:', error);
      throw error;
    }
  }

  // Helper methods

  async getUserDeviceTokens(userId) {
    // Query database for user's active device tokens
    // This is a placeholder - implement based on your DB structure
    try {
      const query = `
        SELECT device_token 
        FROM user_devices 
        WHERE user_id = ? AND is_active = true
      `;
      const result = await db.query(query, [userId]);
      return result.rows.map(row => row.device_token);
    } catch (error) {
      console.error('Error getting user device tokens:', error);
      return [];
    }
  }

  async getUserNotificationSettings(userId) {
    try {
      const query = `
        SELECT settings 
        FROM user_settings 
        WHERE user_id = ? AND deleted_at IS NULL
      `;
      const result = await db.query(query, [userId]);

      if (result.rows.length === 0) {
        // Return default settings
        return {
          dailyReminders: true,
          weeklyReports: true,
          achievementAlerts: true,
          communityUpdates: false,
          reminderTime: '09:00',
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
          },
          reminderSound: 'default',
          vibration: true,
        };
      }

      const settings = result.rows[0].settings;
      return settings.reminders || {};
    } catch (error) {
      console.error('Error getting user notification settings:', error);
      return {};
    }
  }

  isNotificationTypeEnabled(category, userSettings) {
    switch (category) {
      case 'reminder':
        return userSettings.dailyReminders;
      case 'report':
        return userSettings.weeklyReports;
      case 'achievement':
        return userSettings.achievementAlerts;
      case 'community':
        return userSettings.communityUpdates;
      default:
        return true;
    }
  }

  isInQuietHours(userSettings) {
    if (!userSettings.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] = userSettings.quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = userSettings.quietHours.end.split(':').map(Number);

    const quietStart = startHour * 60 + startMinute;
    const quietEnd = endHour * 60 + endMinute;

    // Handle quiet hours that span midnight
    if (quietStart < quietEnd) {
      return currentTime >= quietStart && currentTime < quietEnd;
    } else {
      return currentTime >= quietStart || currentTime < quietEnd;
    }
  }

  async logNotification(userId, payload, response) {
    try {
      const logData = {
        userId,
        title: payload.title,
        body: payload.body,
        category: payload.category,
        sentAt: new Date().toISOString(),
        successCount: response.successCount,
        failureCount: response.failureCount,
        data: payload.data,
      };

      // Store in notification logs table
      await this.storeNotificationLog(logData);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  async storeDeviceToken(deviceData) {
    // Implement based on your database structure
    const query = `
      INSERT INTO user_devices (user_id, device_token, platform, registered_at, last_used_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (device_token) 
      DO UPDATE SET 
        user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        last_used_at = EXCLUDED.last_used_at,
        is_active = EXCLUDED.is_active
    `;

    await db.query(query, [
      deviceData.userId,
      deviceData.deviceToken,
      deviceData.platform,
      deviceData.registeredAt,
      deviceData.lastUsedAt,
      deviceData.isActive,
    ]);
  }

  async storeNotificationLog(logData) {
    // Implement based on your database structure
    const query = `
      INSERT INTO notification_logs (user_id, title, body, category, sent_at, success_count, failure_count, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      logData.userId,
      logData.title,
      logData.body,
      logData.category,
      logData.sentAt,
      logData.successCount,
      logData.failureCount,
      JSON.stringify(logData.data),
    ]);
  }

  async queryNotificationLogs(userId, limit, offset) {
    // Implement based on your database structure
    const query = `
      SELECT id, title, body, category, sent_at, success_count, failure_count, data
      FROM notification_logs 
      WHERE user_id = ?
      ORDER BY sent_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await db.query(query, [userId, limit, offset]);
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      body: row.body,
      category: row.category,
      sentAt: row.sent_at,
      successCount: row.success_count,
      failureCount: row.failure_count,
      data: row.data ? JSON.parse(row.data) : {},
    }));
  }

  async getWeeklyStats(userId) {
    // Placeholder - implement based on your stats service
    return {
      completedFlows: 5,
      streak: 3,
      totalTime: 120,
    };
  }
}

module.exports = new NotificationService();
