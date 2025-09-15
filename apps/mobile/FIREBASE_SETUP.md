# 🔥 Firebase Authentication Setup for Flow Mobile App

This guide covers setting up Firebase Authentication for the Flow mobile app on both Android and iOS platforms.

## 📋 Prerequisites

1. **Firebase Project**: Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. **React Native Firebase**: Already installed (`@react-native-firebase/app`, `@react-native-firebase/auth`)
3. **Google Sign-In**: Already installed (`@react-native-google-signin/google-signin`)

## 🚀 Quick Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `flow-app-production`
4. Enable Google Analytics (optional)
5. Choose Analytics account (optional)
6. Click "Create project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable the following providers:
   - **Email/Password**: Enable
   - **Google**: Enable and configure
   - **Anonymous**: Enable (for guest users)

### Step 3: Add Android App

1. In Firebase Console, click **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** > **Android**
4. Enter package name: `com.flow.app`
5. Enter app nickname: `Flow Android`
6. Click **Register app**
7. Download `google-services.json`
8. Replace the placeholder file: `android/app/google-services.json`

### Step 4: Add iOS App

1. In Firebase Console, click **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** > **iOS**
4. Enter bundle ID: `com.flow.app`
5. Enter app nickname: `Flow iOS`
6. Click **Register app**
7. Download `GoogleService-Info.plist`
8. Replace the placeholder file: `ios/GoogleService-Info.plist`

### Step 5: Configure Google Sign-In

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click **Google** provider
3. Enable it and configure:
   - **Project support email**: Your email
   - **Web SDK configuration**: Copy the Web client ID
4. Update `src/services/firebaseAuth.js` with the real Web client ID

## 🔧 Configuration Files

### Android Configuration (`android/app/google-services.json`)

```json
{
  "project_info": {
    "project_number": "YOUR_PROJECT_NUMBER",
    "project_id": "your-firebase-project-id",
    "storage_bucket": "your-firebase-project-id.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "YOUR_MOBILE_SDK_APP_ID",
        "android_client_info": {
          "package_name": "com.flow.app"
        }
      },
      "oauth_client": [
        {
          "client_id": "YOUR_OAUTH_CLIENT_ID",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "YOUR_API_KEY"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": [
            {
              "client_id": "YOUR_OAUTH_CLIENT_ID",
              "client_type": 3
            }
          ]
        }
      }
    }
  ],
  "configuration_version": "1"
}
```

### iOS Configuration (`ios/GoogleService-Info.plist`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>API_KEY</key>
	<string>YOUR_API_KEY</string>
	<key>GCM_SENDER_ID</key>
	<string>YOUR_PROJECT_NUMBER</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>com.flow.app</string>
	<key>PROJECT_ID</key>
	<string>your-firebase-project-id</string>
	<key>STORAGE_BUCKET</key>
	<string>your-firebase-project-id.appspot.com</string>
	<key>IS_ADS_ENABLED</key>
	<false></false>
	<key>IS_ANALYTICS_ENABLED</key>
	<false></false>
	<key>IS_APPINVITE_ENABLED</key>
	<true></true>
	<key>IS_GCM_ENABLED</key>
	<true></true>
	<key>IS_SIGNIN_ENABLED</key>
	<true></true>
	<key>GOOGLE_APP_ID</key>
	<string>YOUR_GOOGLE_APP_ID</string>
	<key>DATABASE_URL</key>
	<string>https://your-firebase-project-id-default-rtdb.firebaseio.com</string>
	<key>GOOGLE_SIGN_IN_SERVER_CLIENT_ID</key>
	<string>YOUR_OAUTH_CLIENT_ID</string>
</dict>
</plist>
```

## 📱 Usage in React Native

### Import Firebase Auth Service

```javascript
import firebaseAuthService from './src/services/firebaseAuth';
```

### Sign In with Email/Password

```javascript
const handleEmailSignIn = async () => {
  const result = await firebaseAuthService.signInWithEmail(email, password);
  if (result.success) {
    console.log('User signed in:', result.user);
    // Navigate to main app
  } else {
    console.error('Sign in failed:', result.error);
  }
};
```

### Sign Up with Email/Password

```javascript
const handleEmailSignUp = async () => {
  const result = await firebaseAuthService.signUpWithEmail(email, password);
  if (result.success) {
    console.log('User created:', result.user);
    // Navigate to main app
  } else {
    console.error('Sign up failed:', result.error);
  }
};
```

### Sign In with Google

```javascript
const handleGoogleSignIn = async () => {
  const result = await firebaseAuthService.signInWithGoogle();
  if (result.success) {
    console.log('User signed in with Google:', result.user);
    // Navigate to main app
  } else {
    console.error('Google sign in failed:', result.error);
  }
};
```

### Listen to Auth State Changes

```javascript
import { useEffect, useState } from 'react';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseAuthService.addAuthStateListener((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? <MainApp /> : <AuthScreen />;
};
```

### Get ID Token for API Calls

```javascript
const makeApiCall = async () => {
  try {
    const token = await firebaseAuthService.getIdToken();
    const response = await fetch('https://your-api.com/protected-endpoint', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    // Handle response
  } catch (error) {
    console.error('API call failed:', error);
  }
};
```

## 🔐 Security Notes

### ⚠️ Important Security Considerations

1. **Never commit real Firebase config files to git**
   - The placeholder files contain fake values
   - Real config files are in `.gitignore`
   - Use environment variables for production

2. **Validate tokens on your backend**
   - Always verify Firebase ID tokens on your API
   - Use Firebase Admin SDK for token verification
   - Implement proper error handling

3. **Use HTTPS in production**
   - Firebase requires HTTPS for production
   - Configure proper CORS settings
   - Enable security rules

## 🛠️ Development vs Production

### Development Configuration

- Use placeholder Firebase config files
- Enable debug logging
- Use development Firebase project
- Test with development API endpoints

### Production Configuration

- Use real Firebase config files
- Disable debug logging
- Use production Firebase project
- Use production API endpoints
- Enable security rules

## 🚨 Troubleshooting

### Common Issues

1. **"Firebase not initialized"**
   - Check if config files are properly placed
   - Verify package names match Firebase console
   - Ensure React Native Firebase is properly linked

2. **"Google Sign-In not working"**
   - Verify SHA-1 fingerprints are added to Firebase
   - Check if Google Play Services are available
   - Ensure proper OAuth client configuration

3. **"Authentication failed"**
   - Check Firebase console for error logs
   - Verify authentication methods are enabled
   - Check network connectivity

### Debug Commands

```bash
# Check Firebase config
npx react-native info

# Clear Metro cache
npx react-native start --reset-cache

# Check Firebase project status
firebase projects:list
```

## 📚 Additional Resources

- [React Native Firebase Documentation](https://rnfirebase.io/)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Firebase Console](https://console.firebase.google.com)

## 🔄 Next Steps

1. **Replace placeholder config files** with real Firebase configuration
2. **Test authentication flows** on both Android and iOS
3. **Integrate with your API** using Firebase ID tokens
4. **Set up production Firebase project** for release
5. **Configure security rules** and validation
6. **Test with real users** before production release

---

**Remember**: The placeholder configuration files contain fake values and should be replaced with real Firebase project configuration before production deployment!
