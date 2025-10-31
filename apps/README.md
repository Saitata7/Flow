# Applications

This directory contains all client applications in the Flow monorepo.

## 📂 Structure

```
apps/
├── mobile/          # React Native mobile application (main product)
└── web/             # React static website and landing pages
```

## 📱 Mobile App

The main Flow mobile application built with React Native and Expo.

### Features
- **Habit Tracking** - Binary, quantitative, and time-based flows
- **Statistics & Analytics** - Real-time progress tracking
- **Offline Support** - Full functionality without internet
- **Push Notifications** - Smart reminders and updates
- **Profile Management** - User profiles and settings
- **Authentication** - JWT and Firebase auth support

### Technology Stack
- React Native 0.81.4
- Expo SDK 54
- React Navigation 7
- AsyncStorage for local persistence
- React Context for state management

### Quick Start
```bash
cd mobile

# Install dependencies
yarn install

# Start Expo development server
yarn start

# Run on specific platform
yarn android          # Android
yarn ios              # iOS
yarn web              # Web browser
```

### Documentation
- Complete guide: [apps/mobile/README.md](mobile/README.md)
- Testing: [apps/mobile/tests/README.md](mobile/tests/README.md)

## 🌐 Web App

Static React website for Flow landing pages, marketing, and terms.

### Features
- **Landing Pages** - App introduction and features
- **Terms & Conditions** - Legal documentation
- **SEO Optimized** - Meta tags and Open Graph
- **Responsive Design** - Mobile-first approach
- **Static Deployment** - Deployable to Vercel/Netlify

### Technology Stack
- React 18
- React Router
- Static site generation
- CSS-in-JS styling

### Quick Start
```bash
cd web

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Documentation
- Complete guide: [apps/web/README.md](web/README.md)

## 🚀 Development

### Start All Apps
```bash
# From monorepo root
yarn dev              # Start all apps in development mode
```

### Start Individual App
```bash
# Mobile app
yarn workspace @flow/mobile start

# Web app
yarn workspace @flow/web start
```

## 🧪 Testing

### Mobile App Tests
```bash
cd mobile
yarn test            # Run all tests
yarn test:unit       # Unit tests only
yarn test:e2e        # End-to-end tests
```

### Web App Tests
```bash
cd web
npm test             # Run tests
```

## 📦 Building

### Mobile App
```bash
cd mobile

# Build Android APK
yarn android:release

# Build iOS IPA
yarn ios:release
```

### Web App
```bash
cd web

# Build for production
npm run build        # Output in build/
```

## 🔗 Shared Resources

Apps can share code through:

- **Packages** (`../packages/`) - Shared libraries and utilities
- **API SDK** (`../packages/api-sdk/`) - Common API client
- **Data Models** (`../packages/data-models/`) - Shared schemas

## 🔐 Environment Setup

### Mobile App
1. Copy `firebase-config-template.json` to `firebase-config.json`
2. Add your Firebase credentials
3. Configure API endpoint in `.env` or `src/config/environment.js`

### Web App
- No environment variables required (static site)
- Configuration in `public/index.html` and component files

## 📱 Platform-Specific

### Android
- Native modules via Expo
- Gradle build configuration
- Android Studio for native development

### iOS
- CocoaPods for dependencies
- Xcode for native development
- Apple Developer account for distribution

### Web
- Browser-compatible React
- Responsive design
- SEO optimization

## 🚀 Deployment

### Mobile App
- **Android**: Build APK/AAB and distribute via Play Store or direct download
- **iOS**: Build IPA and distribute via App Store or TestFlight

### Web App
- **Vercel**: Automatic deployment from GitHub
- **Netlify**: Static site hosting
- **Cloud Storage**: Manual upload of `build/` folder

## 📚 Documentation

- **Mobile App**: [mobile/README.md](mobile/README.md)
- **Web App**: [web/README.md](web/README.md)
- **Architecture**: [../prompt/ARCHITECTURE.md](../prompt/ARCHITECTURE.md)
- **Coding Guidelines**: [../prompt/CODING_GUIDELINES.md](../prompt/CODING_GUIDELINES.md)

## 🤝 Contributing

When adding new apps:

1. Create app directory
2. Set up React Native (Expo) or React project
3. Add `package.json` with app name (`@flow/app-name`)
4. Update root `package.json` workspaces
5. Add app-specific README
6. Configure build and deployment

## 📄 License

Part of the Flow ecosystem. See main project README for license information.
