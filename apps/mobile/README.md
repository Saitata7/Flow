# Flow Mobile App

The main React Native application for Flow - a habit tracking and flow state management app.

## Features

- **Flow Tracking**: Track daily flow states and habits
- **Plans Management**: Create and manage personal development plans
- **Statistics**: View detailed analytics and trends
- **Profile**: Manage user profile and social features
- **Settings**: Customize app behavior and preferences

## Tech Stack

- React Native 0.81.4
- React 19.1.0
- Expo SDK 54
- React Navigation 7
- Firebase (Authentication, Firestore)
- React Query for data fetching
- Victory Native for charts

## Development

```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Run on Android
yarn android

# Run on iOS
yarn ios

# Run on web
yarn web
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── navigation/     # Navigation configuration
├── services/       # API clients and external services
├── context/        # React Context providers
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── assets/         # Images, icons, fonts
└── App.js          # Main app component
```

## Configuration

- `app.json` - Expo configuration
- `metro.config.js` - Metro bundler configuration
- `babel.config.js` - Babel configuration
