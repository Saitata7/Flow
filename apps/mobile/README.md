# 🪄 Flow: The AI Habit Tracker App

**Flow** is a personal habit tracking mobile app built with **React Native**, designed to help users build better habits through visual stats, smart reminders, and motivational insights powered by AI.  
This project is open for learning, contribution, and exploration — the APK is available for direct installation (no Play Store required).

---

## ⚙️ About the Project

This repository contains the complete source code of the Flow mobile app.  
You can explore:
- 📊 **Habit tracking and progress analytics** - Track daily habits with binary, quantitative, and time-based flows
- 🕒 **Custom reminders and weekly summaries** - Smart notifications with flow-level ringtones and quiet hours
- 💬 **AI-generated feedback** (optional) - Motivational insights and progress analysis
- 🎨 **Modern UI and smooth animations** - Built with React Native and Expo for a seamless experience

---

## ✨ Core Features

- **Flow Tracking**: Track daily habits with binary, quantitative, and time-based flows
- **Statistics & Analytics**: Comprehensive stats with charts, trends, and achievements
- **Profile Management**: User profiles with username validation and completeness checks
- **Notifications**: Smart notifications with flow-level ringtones and quiet hours
- **Offline Support**: Full offline functionality with automatic sync
- **Settings**: Customizable themes, notifications, and privacy settings
- **Achievement System**: Progress tracking and milestones

---

## 🔐 Security & Environment Setup

All **API keys, credentials, and private configurations** (e.g., GCP, Firebase, or OpenAI keys) have been **removed** from the repository for security reasons.  
If you want to run this app locally:

1. Create a `.env` file in the project root (`apps/mobile/.env`).
2. Add your own keys like:
   ```bash
   EXPO_PUBLIC_API_URL=http://your-api-url:4003
   EXPO_PUBLIC_JWT_SECRET=your-jwt-secret
   GOOGLE_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   ```
3. Copy the Firebase config template:
   ```bash
   cp firebase-config-template.json firebase-config.json
   ```
   Then edit `firebase-config.json` with your Firebase credentials.

4. **Never commit your `.env` file or any secret keys.**

---

## 📲 Try the App (APK)

You can download and install the latest version of the app directly:
👉 [Download Flow App (APK)](./releases/latest)

> **Note**: This APK is for personal and educational use only.  
> Always enable "Install from Unknown Sources" on your Android device before installing.

---

## 🛠 Tech Stack

- **React Native** 0.81.4 with Expo SDK 54
- **React** 19.1.0 with modern hooks and context
- **Firebase** Authentication and Firestore
- **React Navigation** 7 for navigation
- **React Query** for data fetching and caching
- **React Native Chart Kit** for data visualization
- **AsyncStorage** for local data persistence
- **Expo Notifications** for push notifications

---

## 📱 Development Setup

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios

# Run on web
npx expo start --web
```

### Environment Configuration

The app uses environment variables for configuration:

```bash
# Copy template and configure
cp firebase-config-template.json firebase-config.json

# Edit firebase-config.json with your Firebase credentials
# Create .env file with:
EXPO_PUBLIC_API_URL=http://your-api-url:4003
EXPO_PUBLIC_JWT_SECRET=your-jwt-secret
```

---

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (Button, Card, Icon, etc.)
│   ├── flow/           # Flow-specific components
│   ├── FlowStats/      # Statistics components
│   └── home/           # Home screen components
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── home/            # Home and flow management
│   ├── settings/        # Settings and profile
│   └── stats/           # Statistics and analytics
├── navigation/         # Navigation configuration
├── services/           # API clients and external services
├── context/            # React Context providers
│   ├── ActivityContext.js    # Centralized stats management
│   ├── FlowContext.js        # Flow state management
│   ├── JWTAuthContext.js     # Authentication
│   └── NotificationContext.js # Notifications
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── config/             # Configuration files
└── styles/             # Styling system
```

---

## 🔧 Key Features Explained

### Flow Management
- **Binary Flows**: Simple yes/no habit tracking
- **Quantitative Flows**: Numeric value tracking with goals
- **Time-based Flows**: Duration tracking with targets
- **Status Symbols**: `+` (completed), `-` (missed), `/` (skipped)

### Statistics System
- **Real-time Analytics**: Live stats with automatic updates
- **Multiple Timeframes**: Daily, weekly, monthly views
- **Achievement System**: Progress tracking and milestones
- **Performance Metrics**: Success rates, streaks, trends

### Authentication
- **JWT-based Auth**: Secure token-based authentication
- **Profile Validation**: Username uniqueness and completeness checks
- **Firebase Integration**: Secure user authentication

### Notifications
- **Flow-level Ringtones**: Custom sounds for different flow levels
- **Quiet Hours**: Configurable do-not-disturb periods
- **Smart Scheduling**: Context-aware notification timing

---

## 📊 API Integration

The app connects to a Node.js backend API with the following endpoints:

- `GET /v1/flows` - Get user flows
- `POST /v1/flows` - Create new flow
- `PUT /v1/flows/:id` - Update flow
- `DELETE /v1/flows/:id` - Delete flow
- `GET /v1/flow-entries` - Get flow entries
- `POST /v1/flow-entries` - Create flow entry
- `GET /v1/stats/*` - Statistics endpoints
- `GET /v1/profile/*` - Profile management

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

---

## 📦 Build & Deployment

### Development Build
```bash
# Build debug APK
npx expo run:android --variant debug

# Build debug IPA
npx expo run:ios --configuration Debug
```

### Production Build
```bash
# Build release APK
npx expo run:android --variant release

# Build release IPA
npx expo run:ios --configuration Release
```

The release APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔍 Debugging

### Useful Scripts
- `scripts/setup-android-emulator.sh` - Set up Android emulator
- `scripts/verify-setup.sh` - Verify development setup

### Common Issues
1. **Metro bundler issues**: Clear cache with `npx expo start --clear`
2. **Android build issues**: Clean with `cd android && ./gradlew clean`
3. **iOS build issues**: Clean with `cd ios && xcodebuild clean`

---

## 🚀 Recent Updates

- ✅ Consolidated ActivityContext for better performance
- ✅ Implemented comprehensive notification system
- ✅ Added profile validation and username management
- ✅ Optimized statistics calculations and caching
- ✅ Enhanced offline support with sync queue
- ✅ Improved error handling and user feedback

---

## 🤝 Contributing

Contributions, feature suggestions, and feedback are welcome!

1. Follow the existing code structure and patterns
2. Use TypeScript for new components when possible
3. Add tests for new features
4. Update documentation for API changes
5. Follow the established naming conventions
6. Ensure all tests pass before submitting

Please open a pull request or create an issue if you'd like to help improve the app.

---

## 📄 License

This project is released under the [MIT License](../../LICENSE).

---

**Built with ❤️ by Sai Kumar**

---

## 📖 Additional Documentation

- [Main Project README](../../README.md) - Overall project documentation
- [API Documentation](../../services/api/README.md) - API server documentation
- [Database Architecture](../../docs/DATABASE_ARCHITECTURE_SUMMARY.md) - Database schema
- [Deployment Guide](../../docs/DEPLOYMENT.md) - Production deployment instructions
