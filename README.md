# 🌊 Flow – Habit Tracking & Flow State Management

Flow is a modern mobile application designed to help people track daily habits and build positive flow states. The app focuses on habit formation, mood tracking, and personal development with a clean, intuitive interface.

## ✨ Core Features

- **Flow Tracking**: Track daily habits and flow states with binary, quantitative, and time-based tracking
- **Statistics & Analytics**: Comprehensive stats with real-time calculations and visualizations
- **Profile Management**: User profiles with validation and completeness checks
- **Settings & Preferences**: Customizable user settings and notification preferences
- **Offline Sync**: Queue-based sync for offline-first functionality
- **Notifications**: Smart notifications with flow levels, custom sounds, and quiet hours

## 🚀 Tech Stack

- **Frontend**: React Native, React Navigation, Expo SDK
- **Backend**: Node.js, Fastify, JWT Authentication
- **Database**: File-based storage (development), PostgreSQL (production)
- **Caching**: Redis (optional, with in-memory fallback)
- **Infrastructure**: Docker, Cloud Run (production)
- **Testing**: Jest, React Testing Library

## 📂 Project Structure

This is a **monorepo** containing the Flow application ecosystem:

```
flow/
├── apps/
│   └── mobile/                 # React Native mobile app (main product)
├── packages/
│   ├── api-sdk/                # Shared API client
│   └── data-models/            # JSON schemas & validation
├── services/
│   └── api/                    # REST API endpoints
├── infra/                      # Infrastructure as Code
├── docs/                       # Documentation
└── turbo.json                  # Turborepo configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Yarn package manager
- React Native development environment
- Expo CLI (optional)

### Installation
```bash
# Clone and install dependencies
git clone <repository-url>
cd Flow
yarn install

# Start the mobile app
yarn start
# or
yarn workspace @flow/mobile start
```

### Development Commands
```bash
# Mobile App
yarn android          # Run on Android
yarn ios              # Run on iOS
yarn web              # Run on web

# API Server
yarn workspace @flow/api dev    # Start API server
yarn workspace @flow/api server # Start complete server

# Database
yarn workspace @flow/api migrate:up    # Run migrations

# Testing
yarn test             # Run all tests
yarn test:coverage    # Run tests with coverage

# Linting
yarn lint             # Lint all packages
yarn lint:fix         # Fix linting issues

# Cleanup
yarn clean            # Clean build artifacts
yarn clean:all        # Clean everything including node_modules
```

## 📱 Mobile App

The mobile app is built with React Native and Expo, featuring:

- **Flow Management**: Create, track, and manage daily habits
- **Statistics**: Real-time analytics and progress tracking
- **Profile System**: User profiles with validation
- **Settings**: Customizable preferences and notifications
- **Offline Support**: Works offline with background sync

### Key Features
- JWT-based authentication
- Offline-first data management
- Real-time statistics and analytics
- Smart notifications with custom sounds
- Profile completeness validation
- Comprehensive settings management

## 🔧 API Server

The API server provides:

- **Authentication**: JWT-based auth system
- **Flow Management**: CRUD operations for flows and entries
- **Statistics**: Real-time stats and analytics
- **Profile Management**: User profile and settings
- **Health Monitoring**: Health checks and monitoring

### Available Endpoints
- `POST /v1/auth/login-simple` - Simple login
- `GET /v1/flows` - Get user flows
- `POST /v1/flows` - Create new flow
- `GET /v1/stats/users/:userId` - Get user statistics
- `GET /health` - Health check

## 🗄️ Database

- **Development**: File-based storage (`data.json`)
- **Production**: PostgreSQL with migrations
- **Caching**: Redis (optional, with in-memory fallback)

### Migrations
```bash
yarn workspace @flow/api migrate:up      # Run migrations
yarn workspace @flow/api migrate:rollback # Rollback migrations
yarn workspace @flow/api migrate:reset   # Reset migrations
```

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run specific test suites
yarn test:unit          # Unit tests
yarn test:integration   # Integration tests
yarn test:e2e           # End-to-end tests

# Coverage
yarn test:coverage       # Generate coverage report
```

## 📖 Documentation

- `apps/mobile/README.md` - Mobile app documentation
- `services/api/README.md` - API server documentation
- `docs/` - Additional documentation and guides

## 🤝 Contributing

1. Follow the coding guidelines in `prompt/CODING_GUIDELINES.md`
2. Write tests for new features
3. Update documentation
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is part of the Flow ecosystem. See the main project documentation for license information.