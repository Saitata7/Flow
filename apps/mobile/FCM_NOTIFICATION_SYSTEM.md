# FCM-Based Notification System

This document describes the Firebase Cloud Messaging (FCM) based notification system implementation for the Flow mobile app.

## Overview

The notification system has been migrated from Expo Notifications to Firebase Cloud Messaging (FCM) using `@react-native-firebase/messaging`. This provides:

- **Better native integration** with iOS and Android notification systems
- **Server-side push notifications** for scheduled reminders and updates
- **Topic-based subscriptions** for different notification types
- **Background and foreground** message handling
- **Enhanced reliability** and delivery rates

## Architecture

### Core Components

1. **NotificationService** (`services/notificationService.js`)
   - FCM-based service using `@react-native-firebase/messaging`
   - Handles token management, permissions, and message routing
   - Manages topic subscriptions based on user preferences

2. **Topic-Based Notifications**
   - `daily_reminders`: Daily flow completion reminders
   - `weekly_reports`: Weekly progress summaries
   - `achievement_alerts`: Achievement unlock notifications
   - `community_updates`: Community-related notifications

3. **Local Notifications**
   - Achievement alerts shown immediately when unlocked
   - Test notifications for verification
   - Community updates from real-time events

## Key Features

### ✅ **FCM Integration**
- Firebase Cloud Messaging with native platform support
- Automatic token generation and refresh handling
- Topic subscriptions for different notification types
- Background message handling

### ✅ **Permission Management**
- Platform-specific permission requests (iOS/Android)
- Graceful handling of permission denial
- Android 13+ POST_NOTIFICATIONS support

### ✅ **Message Handling**
- **Foreground**: Shows alerts while app is active
- **Background**: Handles notifications when app is backgrounded
- **Quit State**: Processes notifications that opened the app

### ✅ **Settings Integration**
- Real-time topic subscription/unsubscription
- Settings persistence and synchronization
- User-friendly permission request UI

## Implementation Details

### FCM Service Features

```javascript
// Initialize FCM
await notificationService.initialize();

// Get FCM token (for server-side notifications)
const token = await notificationService.getToken();

// Send local notification
await notificationService.sendTestNotification();

// Update settings (automatically manages topic subscriptions)
await notificationService.updateNotificationSettings({
  dailyReminders: true,
  weeklyReports: true,
  achievementAlerts: true,
  communityUpdates: false
});
```

### Topic Subscriptions

The service automatically subscribes/unsubscribes to FCM topics based on user settings:

```javascript
// When daily reminders are enabled
await messaging().subscribeToTopic('daily_reminders');

// When daily reminders are disabled
await messaging().unsubscribeFromTopic('daily_reminders');
```

### Message Types Handled

1. **Daily Reminders** (`daily_reminder`)
   - Sent from server to `daily_reminders` topic
   - Scheduled based on user's preferred reminder time

2. **Weekly Reports** (`weekly_report`)
   - Sent from server to `weekly_reports` topic
   - Contains weekly progress summaries

3. **Achievement Alerts** (`achievement`)
   - Local notifications for immediate feedback
   - Triggered when achievements are unlocked

4. **Community Updates** (`community_update`)
   - Real-time notifications for community events
   - Can be sent via server or locally

## Server-Side Integration

### Sending Notifications from Server

```javascript
// Using Firebase Admin SDK
const admin = require('firebase-admin');

// Send to specific device
const message = {
  notification: {
    title: 'Daily Flow Reminder',
    body: 'Time to complete your daily flows!'
  },
  data: {
    type: 'daily_reminder',
    timestamp: Date.now().toString()
  },
  token: userFCMToken
};

await admin.messaging().send(message);

// Send to topic
const topicMessage = {
  notification: {
    title: 'Weekly Report',
    body: 'Your weekly progress is ready!'
  },
  topic: 'weekly_reports'
};

await admin.messaging().send(topicMessage);
```

### Topic Management

Users are automatically subscribed to topics based on their notification preferences:

- **daily_reminders**: Users who enable daily reminders
- **weekly_reports**: Users who enable weekly reports
- **achievement_alerts**: Users who enable achievement notifications
- **community_updates**: Users who enable community notifications

## Setup Requirements

### Dependencies Added

```json
{
  "@react-native-firebase/messaging": "^23.3.1"
}
```

### Removed Dependencies

```json
{
  "expo-notifications": "^0.32.11" // Removed
}
```

### Platform Configuration

#### iOS Setup Required:
1. Enable Push Notifications capability in Xcode
2. Upload APNs key to Firebase Console
3. Add Background Modes capability

#### Android Setup Required:
1. Add FCM service to AndroidManifest.xml
2. Add POST_NOTIFICATIONS permission for Android 13+
3. Ensure google-services.json is properly configured

## Testing

### Built-in Test Utilities

```javascript
import { runAllFCMTests } from '../utils/fcmTestUtils';

// Run comprehensive FCM tests
const results = await runAllFCMTests();

// Test specific functionality
import { testFCMSetup, testAchievementNotification } from '../utils/fcmTestUtils';

await testFCMSetup();
await testAchievementNotification();
```

### Manual Testing

1. **Test Button in HomePage**: Quick FCM test notification
2. **Settings Screen**: Permission requests and test notifications
3. **Console Logs**: Monitor FCM token generation and message handling

### FCM Token for Server Testing

```javascript
import { logFCMTokenForServerTesting } from '../utils/fcmTestUtils';

// Get FCM token for testing server notifications
const token = await logFCMTokenForServerTesting();
```

## Migration from Expo Notifications

### What Changed

1. **Service Implementation**: Complete rewrite using FCM
2. **Dependencies**: Replaced expo-notifications with @react-native-firebase/messaging
3. **Topic Support**: Added topic-based subscriptions
4. **Server Integration**: Better server-side notification support

### What Stayed the Same

1. **Interface**: Notification service API remains consistent
2. **Settings**: User settings and preferences unchanged
3. **Achievement System**: Achievement tracking and notifications work the same
4. **UI Components**: No changes to notification settings screens

## Advantages of FCM

### Over Expo Notifications

1. **Native Integration**: Uses platform-native notification systems
2. **Better Reliability**: Higher delivery rates and better background handling
3. **Server-Side Control**: Easy integration with custom backend servers
4. **Topic Support**: Built-in support for topic-based notifications
5. **Advanced Features**: Support for notification actions, rich media, etc.

### Platform Benefits

- **iOS**: Direct APNs integration with proper certificate handling
- **Android**: Native FCM integration with better battery optimization
- **Cross-Platform**: Consistent behavior across platforms

## Production Considerations

### Security
- FCM tokens should be securely stored on your server
- Implement proper token validation and refresh handling
- Use Firebase Security Rules for topic access control

### Performance
- Batch notifications when possible
- Use topic subscriptions to reduce individual token management
- Monitor FCM quota limits and usage

### Monitoring
- Set up FCM analytics and delivery reports
- Monitor notification open rates and user engagement
- Track token refresh patterns and failures

## Troubleshooting

### Common Issues

1. **No FCM Token Generated**
   - Check Firebase configuration files (google-services.json, GoogleService-Info.plist)
   - Verify app bundle ID matches Firebase project
   - Ensure proper platform setup (APNs keys, etc.)

2. **Notifications Not Received**
   - Check device notification permissions
   - Verify topic subscriptions are working
   - Test with Firebase Console first

3. **Background Notifications Not Working**
   - Ensure background message handler is registered
   - Check if app has background refresh enabled
   - Verify platform-specific background notification setup

### Debug Steps

1. Check console logs for FCM initialization
2. Verify FCM token is generated and stored
3. Test local notifications first
4. Use Firebase Console to send test notifications
5. Check topic subscription logs

## Future Enhancements

1. **Rich Notifications**: Images, actions, and interactive notifications
2. **Notification Analytics**: Track open rates and user engagement
3. **Smart Scheduling**: AI-powered optimal notification timing
4. **A/B Testing**: Test different notification strategies
5. **Advanced Targeting**: Location and behavior-based notifications

This FCM-based implementation provides a robust, scalable notification system that integrates seamlessly with your existing Flow app architecture while providing better native platform support and server-side integration capabilities.
