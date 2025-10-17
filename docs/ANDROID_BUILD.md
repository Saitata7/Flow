# Android Build & Testing Guide for Flow App

This guide covers building and testing the Flow mobile app for Android, including both debug and release builds.

## 🏗️ Build Configuration

### Debug Build
- **Purpose**: Development and testing
- **Signing**: Debug keystore (automatic)
- **Optimization**: Minimal (faster builds)
- **Bundle**: Metro bundler (live reload)

### Release Build
- **Purpose**: Production deployment
- **Signing**: Release keystore (configurable)
- **Optimization**: ProGuard + resource shrinking
- **Bundle**: Pre-bundled JS assets

## 📱 Available Build Commands

### Development Commands
```bash
# Run debug build on emulator/device
npm run android:dev

# Build debug APK only
npm run android:debug

# Clean build artifacts
npm run android:clean
```

### Release Commands
```bash
# Build release APK
npm run android:release

# Build release AAB (for Play Store)
npm run android:bundleRelease

# Install release APK on connected device
npm run android:installRelease
```

### Utility Commands
```bash
# Check connected devices
npm run adb:devices

# View logs
npm run adb:logcat

# Access device shell
npm run adb:shell
```

## 🔧 Build Process

### Debug Build Process
1. **Metro Bundler**: Starts automatically
2. **Gradle Build**: `assembleDebug`
3. **Installation**: Automatic on connected device
4. **Hot Reload**: Enabled for development

### Release Build Process
1. **JS Bundle**: Pre-bundled with Metro
2. **Gradle Build**: `assembleRelease` with optimizations
3. **Signing**: Release keystore (if configured)
4. **Output**: APK/AAB in `android/app/build/outputs/`

## 🔐 Signing Configuration

### Debug Signing
- **Keystore**: `android/app/debug.keystore` (auto-generated)
- **Password**: `android`
- **Alias**: `androiddebugkey`

### Release Signing
Create `android/gradle.properties` with your keystore details:
```properties
MYAPP_UPLOAD_STORE_FILE=my-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****
```

### Generate Release Keystore
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

## 📦 Build Outputs

### Debug Build
- **APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Size**: ~50-100MB (unoptimized)
- **Installation**: `adb install -r app-debug.apk`

### Release Build
- **APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`
- **Size**: ~20-40MB (optimized)
- **Installation**: `adb install -r app-release.apk`

## 🧪 Testing Workflow

### 1. Debug Build Testing
```bash
# Start emulator
npm run emulator:start

# Run debug build
npm run android:dev

# Check logs
npm run adb:logcat
```

### 2. Release Build Testing
```bash
# Build release APK
npm run android:release

# Install on device
npm run android:installRelease

# Test functionality
# - Firebase Auth login
# - API calls
# - Push notifications
# - Offline sync
```

### 3. Firebase Integration Testing
```bash
# Test Firebase Auth
npm run firebase:test

# Test API connectivity
npm run api:test

# Check authentication flow
# 1. Login with email/password
# 2. Login with Google Sign-In
# 3. Verify JWT token generation
# 4. Test API calls with auth headers
```

## 🔍 Debugging & Logs

### View Logs
```bash
# All logs
adb logcat

# Filtered logs (Flow app only)
npm run adb:logcat

# Firebase logs only
adb logcat | grep -E "(Firebase|Flow)"

# React Native logs only
adb logcat | grep -E "(ReactNative|Metro)"
```

### Common Log Patterns
- **Firebase Auth**: `Firebase Auth`, `GoogleSignIn`
- **API Calls**: `ApiService`, `axios`
- **Sync Operations**: `SyncService`, `ActivityCache`
- **Navigation**: `ReactNavigation`

## 🚀 Performance Optimization

### Release Build Optimizations
- **ProGuard**: Code obfuscation and optimization
- **Resource Shrinking**: Remove unused resources
- **PNG Crunching**: Compress images
- **Zip Alignment**: Optimize APK structure
- **Hermes**: JavaScript engine optimization

### Build Size Analysis
```bash
# Analyze APK size
cd android
./gradlew assembleRelease
# Check: android/app/build/outputs/apk/release/app-release.apk

# Analyze AAB size
./gradlew bundleRelease
# Check: android/app/build/outputs/bundle/release/app-release.aab
```

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clean and rebuild
npm run android:clean
npm run android:debug

# Check Gradle version
cd android && ./gradlew --version

# Check Android SDK
echo $ANDROID_HOME
```

#### Firebase Issues
- Verify `google-services.json` is in `android/app/`
- Check Firebase project configuration
- Ensure Google Sign-In web client ID is correct

#### Permission Issues
- Check `AndroidManifest.xml` permissions
- Verify runtime permissions for Android 13+
- Test on different Android versions

#### Signing Issues
- Verify keystore file exists
- Check keystore passwords in `gradle.properties`
- Ensure keystore alias is correct

### Debug Commands
```bash
# Check device connection
adb devices

# Check app installation
adb shell pm list packages | grep flow

# Clear app data
adb shell pm clear com.anonymous.Flow

# Uninstall app
adb uninstall com.anonymous.Flow
```

## 📋 Pre-Release Checklist

### Debug Build
- [ ] App launches successfully
- [ ] Firebase Auth works (email + Google)
- [ ] API calls return data
- [ ] Offline sync functions
- [ ] Push notifications work
- [ ] No critical errors in logs

### Release Build
- [ ] APK builds without errors
- [ ] App installs on test device
- [ ] All features work in release mode
- [ ] Performance is acceptable
- [ ] APK size is optimized
- [ ] Signing is configured correctly

### Firebase Integration
- [ ] Authentication flows work
- [ ] JWT tokens are generated
- [ ] API calls include auth headers
- [ ] Push notifications are received
- [ ] Offline sync works with backend

## 🎯 Production Deployment

### Play Store Preparation
1. **Build AAB**: `npm run android:bundleRelease`
2. **Test AAB**: Install and verify functionality
3. **Upload**: Use Play Console to upload AAB
4. **Release**: Configure release settings

### APK Distribution
1. **Build APK**: `npm run android:release`
2. **Test APK**: Install on various devices
3. **Distribute**: Share APK for testing
4. **Monitor**: Track crashes and performance

---

**Note**: This setup provides full Android native support with Firebase integration, optimized builds, and comprehensive testing workflows.
