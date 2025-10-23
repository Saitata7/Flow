// Notification service - JWT only mode (Firebase removed)
const { RedisClient } = require('../redis/client');

class NotificationService {
  constructor() {
    this.redis = new RedisClient();
    console.log('📱 NotificationService: JWT-only mode - Firebase notifications disabled');
  }

  async initializeFirebase() {
    // Firebase initialization disabled in JWT-only mode
    console.log('🔐 JWT-only mode: NotificationService Firebase initialization disabled');
    this.firebaseApp = null;
  }

  async sendNotification(userId, notification) {
    console.log('📱 NotificationService: JWT-only mode - notifications disabled');
    console.log('📱 Would send notification to user:', userId, 'message:', notification.message);
    return { success: false, message: 'Notifications disabled in JWT-only mode' };
  }

  async sendPushNotification(userId, title, body, data = {}) {
    console.log('📱 NotificationService: JWT-only mode - push notifications disabled');
    console.log('📱 Would send push notification to user:', userId, 'title:', title);
    return { success: false, message: 'Push notifications disabled in JWT-only mode' };
  }

  async scheduleNotification(userId, notification, scheduledTime) {
    console.log('📱 NotificationService: JWT-only mode - scheduled notifications disabled');
    console.log('📱 Would schedule notification for user:', userId, 'at:', scheduledTime);
    return { success: false, message: 'Scheduled notifications disabled in JWT-only mode' };
  }

  async getNotificationHistory(userId) {
    console.log('📱 NotificationService: JWT-only mode - notification history disabled');
    return [];
  }

  async markNotificationAsRead(userId, notificationId) {
    console.log('📱 NotificationService: JWT-only mode - notification marking disabled');
    return { success: false, message: 'Notification marking disabled in JWT-only mode' };
  }
}

module.exports = NotificationService;