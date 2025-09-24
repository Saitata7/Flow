# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to set up Firebase Cloud Messaging for push notifications in the Flow mobile app.

## Prerequisites

1. Firebase project already created and configured
2. `@react-native-firebase/app` installed and configured
3. `@react-native-firebase/messaging` dependency added to package.json

## Installation

The FCM messaging package has been added to your dependencies:

```json
"@react-native-firebase/messaging": "^23.3.1"
```

To install it, run:

```bash
npm install @react-native-firebase/messaging
# or
yarn add @react-native-firebase/messaging
```

## iOS Setup

### 1. Enable Push Notifications Capability

1. Open your iOS project in Xcode: `ios/YourApp.xcworkspace`
2. Select your project in the navigator
3. Go to "Signing & Capabilities" tab
4. Click "+ Capability" and add "Push Notifications"
5. Also add "Background Modes" capability and check "Background processing" and "Remote notifications"

### 2. APNs Key Configuration

1. Go to [Apple Developer Console](https://developer.apple.com)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Go to "Keys" section
4. Create a new key with "Apple Push Notifications service (APNs)" enabled
5. Download the .p8 key file
6. In Firebase Console:
   - Go to Project Settings → Cloud Messaging
   - Under iOS app configuration, upload the APNs key
   - Enter your Key ID and Team ID

### 3. Update Info.plist (if needed)

Add these entries to `ios/YourApp/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

## Android Setup

### 1. Update AndroidManifest.xml

Add these permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />

<!-- For Android 13+ -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### 2. Add FCM Service

Create `android/app/src/main/java/com/yourapp/FCMService.java`:

```java
package com.yourapp;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class FCMService extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        // Handle FCM messages here
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // Send token to your server
    }
}
```

### 3. Register Service in AndroidManifest.xml

Add this inside the `<application>` tag:

```xml
<service
    android:name=".FCMService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

## Firebase Console Configuration

### 1. Upload google-services.json (Android)

1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/google-services.json`

### 2. Upload GoogleService-Info.plist (iOS)

1. Download `GoogleService-Info.plist` from Firebase Console
2. Place it in `ios/GoogleService-Info.plist`
3. Add it to Xcode project (drag and drop, make sure to add to target)

## Code Implementation

The notification service has been updated to use FCM:

### Key Features

1. **Token Management**: Automatically gets and refreshes FCM tokens
2. **Permission Handling**: Requests notification permissions on both platforms
3. **Message Handling**: Handles foreground, background, and quit state messages
4. **Topic Subscriptions**: Subscribes to topics based on user settings
5. **Local Notifications**: Shows alerts for immediate notifications

### Usage Example

```javascript
import notificationService from '../services/notificationService';

// Initialize FCM
await notificationService.initialize();

// Send test notification
await notificationService.sendTestNotification();

// Get FCM token for server
const token = await notificationService.getToken();

// Update notification settings
await notificationService.updateNotificationSettings({
  dailyReminders: true,
  weeklyReports: true,
  achievementAlerts: true,
  communityUpdates: false
});
```

## Server-Side Integration

To send notifications from your server, you'll need to:

1. **Collect FCM Tokens**: Store user FCM tokens in your database
2. **Use Firebase Admin SDK**: Set up server-side Firebase Admin SDK
3. **Send Notifications**: Use FCM HTTP v1 API or Admin SDK

### Example Server Code (Node.js)

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// Send notification
const message = {
  notification: {
    title: 'Daily Reminder',
    body: 'Time to complete your flows!'
  },
  data: {
    type: 'daily_reminder'
  },
  token: userFCMToken
};

admin.messaging().send(message)
  .then((response) => {
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });
```

## Topic-Based Notifications

The app automatically subscribes to topics based on user settings:

- `daily_reminders`: For daily reminder notifications
- `weekly_reports`: For weekly progress reports
- `achievement_alerts`: For achievement notifications
- `community_updates`: For community-related updates

### Send to Topic (Server)

```javascript
const message = {
  notification: {
    title: 'Weekly Report',
    body: 'Your weekly progress is ready!'
  },
  topic: 'weekly_reports'
};

admin.messaging().send(message);
```

## Testing

### 1. Test FCM Token Generation

```javascript
// Check if FCM is working
const token = await notificationService.getToken();
console.log('FCM Token:', token);
```

### 2. Test Local Notifications

```javascript
// Send test notification
await notificationService.sendTestNotification();
```

### 3. Test from Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification details
4. Target your app using the FCM token

## Troubleshooting

### Common Issues

1. **No FCM Token**
   - Check if permissions are granted
   - Verify Firebase configuration files are correctly placed
   - Check console logs for initialization errors

2. **Notifications Not Received**
   - Verify app is properly configured in Firebase Console
   - Check device notification settings
   - Test with Firebase Console first

3. **iOS Notifications Not Working**
   - Ensure APNs key is correctly uploaded to Firebase
   - Check if Push Notifications capability is enabled
   - Verify app is signed with correct provisioning profile

4. **Android Notifications Not Working**
   - Check if google-services.json is in correct location
   - Verify FCM service is registered in AndroidManifest.xml
   - For Android 13+, ensure POST_NOTIFICATIONS permission is granted

### Debug Commands

```bash
# iOS: Check if Firebase is configured
npx react-native run-ios --verbose

# Android: Check if google-services.json is found
npx react-native run-android --verbose

# Check FCM token in logs
# Look for "FCM Token:" in console logs
```

## Security Considerations

1. **Token Security**: Never expose FCM tokens in client-side code
2. **Server Validation**: Always validate tokens on your server
3. **Topic Security**: Use Firebase Security Rules to control topic access
4. **Data Encryption**: Encrypt sensitive data in notification payloads

## Production Deployment

1. **iOS**: Ensure production APNs certificates are configured
2. **Android**: Use signed APK/AAB for FCM to work properly
3. **Testing**: Test notifications thoroughly on physical devices
4. **Monitoring**: Set up FCM analytics and monitoring

## Migration from Expo Notifications

The notification service interface remains the same, so existing code should continue to work. Key differences:

1. **Background Handling**: FCM provides better background notification handling
2. **Server Integration**: Easier integration with custom backend servers
3. **Platform Native**: Uses native iOS and Android notification systems
4. **Topic Support**: Built-in support for topic-based notifications
5. **Better Reliability**: More reliable delivery and handling
