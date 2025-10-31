# 🌊 Flow - Habit Tracking & Personal Development Platform

**Flow** is a modern, mobile-first habit tracking application built with React Native, designed to help users build better habits through visual stats, smart reminders, and motivational insights. This monorepo contains the complete Flow ecosystem.

## 🎯 Overview

Flow helps users:
- **Track Daily Habits** - Binary, quantitative, and time-based flow tracking
- **Monitor Progress** - Real-time analytics with charts and trends
- **Stay Motivated** - Smart notifications and achievement system
- **Work Offline** - Full offline support with automatic sync
- **Customize Experience** - Personalized settings and preferences

## 📂 Monorepo Structure

This is a **Turborepo** monorepo containing multiple applications and packages:

```
Flow/
├── apps/
│   ├── mobile/          # React Native mobile app (main product)
│   └── web/             # Static website and landing pages
├── packages/
│   ├── api-sdk/         # Shared API client library
│   └── data-models/     # JSON schemas & data validation
├── services/
│   └── api/             # Node.js/Fastify REST API backend
├── infra/               # Infrastructure as Code (Terraform, Cloud Build)
├── docs/                # Project documentation
├── prompt/              # Development guidelines and architecture docs
└── turbo.json           # Turborepo configuration
```

## 🚀 Tech Stack

### Frontend (Mobile App)
- **React Native** 0.81.4 with Expo SDK 54
- **React** 19.1.0 with Context API
- **React Navigation** 7 for navigation
- **AsyncStorage** for local persistence
- **Expo Notifications** for push notifications

### Backend (API Service)
- **Node.js** 20+ with Fastify framework
- **PostgreSQL** (Cloud SQL) for data persistence
- **Redis** (MemoryStore) for caching and sessions
- **JWT** for authentication
- **Swagger/OpenAPI** for API documentation

### Infrastructure
- **Google Cloud Platform** (GCP)
  - Cloud Run for API hosting
  - Cloud SQL (PostgreSQL) for database
  - MemoryStore (Redis) for caching
  - Secret Manager for credentials
- **Docker** for containerization
- **Terraform** for infrastructure as code

## 🛠️ Prerequisites

- **Node.js** 18+ (20+ recommended)
- **Yarn** package manager (v1.22+)
- **PostgreSQL** (for local development)
- **Redis** (optional, for local development)
- **Docker** (for containerized development)
- **Expo CLI** (for mobile app development)

## 📦 Installation

### Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd Flow

# Install all dependencies (monorepo)
yarn install

# This installs dependencies for:
# - apps/mobile
# - apps/web
# - packages/api-sdk
# - packages/data-models
# - services/api
```

### Environment Setup

1. **API Service** - Copy and configure environment:
   ```bash
   cd services/api
   cp env.template.secure .env.local
   # Edit .env.local with your database and Redis credentials
   ```

2. **Mobile App** - Copy Firebase config:
   ```bash
   cd apps/mobile
   cp firebase-config-template.json firebase-config.json
   # Edit firebase-config.json with your Firebase credentials
   ```

## 🚀 Quick Start

### Development Mode

```bash
# Start all services in development mode
yarn dev

# Or start individual services:
yarn workspace @flow/mobile start      # Mobile app
yarn workspace @flow/api dev           # API server
yarn workspace @flow/web start        # Web app (if implemented)
```

### Mobile App Development

```bash
# Start Expo development server
cd apps/mobile
yarn start

# Run on specific platform
yarn android          # Android
yarn ios              # iOS
yarn web              # Web browser
```

### API Server Development

```bash
# Start API server
cd services/api
yarn dev              # Development with hot reload
yarn start            # Production mode
```

## 📝 Development Commands

### Monorepo Commands (from root)

```bash
# Development
yarn dev              # Start all services in dev mode
yarn build            # Build all packages and apps
yarn start            # Start mobile app

# Testing
yarn test             # Run all tests
yarn test:unit        # Run unit tests
yarn test:integration # Run integration tests
yarn test:e2e         # Run end-to-end tests
yarn test:coverage    # Generate coverage reports

# Linting & Formatting
yarn lint             # Lint all packages
yarn lint:fix         # Fix linting issues
yarn format           # Format all code
yarn format:check      # Check formatting

# Cleanup
yarn clean            # Clean build artifacts
yarn clean:all        # Clean everything including node_modules
```

### Workspace-Specific Commands

```bash
# Mobile App
yarn workspace @flow/mobile android     # Run on Android
yarn workspace @flow/mobile ios         # Run on iOS
yarn workspace @flow/mobile test        # Run mobile app tests

# API Service
yarn workspace @flow/api dev            # Start API dev server
yarn workspace @flow/api test          # Run API tests
yarn workspace @flow/api migrate:up    # Run database migrations
```

## 📱 Applications

### Mobile App (`apps/mobile/`)
- **Technology**: React Native + Expo
- **Features**: Habit tracking, statistics, offline sync, notifications
- **Documentation**: [apps/mobile/README.md](apps/mobile/README.md)

### Web App (`apps/web/`)
- **Technology**: React (static site)
- **Features**: Landing pages, terms & conditions, marketing pages
- **Documentation**: [apps/web/README.md](apps/web/README.md)

## 🔧 Services

### API Service (`services/api/`)
- **Technology**: Node.js + Fastify
- **Features**: REST API, authentication, data persistence, caching
- **Documentation**: [services/api/README.md](services/api/README.md)

## 📦 Packages

### API SDK (`packages/api-sdk/`)
- Shared API client for use across applications
- Type-safe API calls with error handling

### Data Models (`packages/data-models/`)
- JSON schemas for validation
- TypeScript types (if implemented)
- Data validation utilities

## 🧪 Testing

### Run All Tests
```bash
yarn test
```

### Test Categories
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and service interactions
- **E2E Tests**: Test complete user workflows
- **Security Tests**: Test security measures and vulnerabilities

### Coverage Reports
```bash
yarn test:coverage
```

## 🗄️ Database

### Setup
```bash
# Run migrations
yarn workspace @flow/api migrate:up

# Rollback migrations
yarn workspace @flow/api migrate:rollback

# Reset database
yarn workspace @flow/api migrate:reset
```

### Schema Documentation
- See [docs/DATABASE_ARCHITECTURE_SUMMARY.md](docs/DATABASE_ARCHITECTURE_SUMMARY.md)
- See [docs/NORMALIZED_SCHEMA_DOCUMENTATION.md](docs/NORMALIZED_SCHEMA_DOCUMENTATION.md)

## 🚀 Deployment

### API Service (Cloud Run)

```bash
# Using Cloud Build (from root)
gcloud builds submit --config=cloudbuild.yaml

# Or using deployment script
cd services/api
./scripts/deployGCP.sh
```

### Mobile App

```bash
# Build Android APK
cd apps/mobile
yarn android:release

# Build iOS IPA
yarn ios:release
```

### Infrastructure

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment guide.

## 🏛️ Architecture

Flow follows a **mobile-first, offline-first** architecture with clear separation of concerns:

### System Architecture

```
Mobile App (React Native) 
    ↓ HTTPS/REST API + JWT Auth
API Service (Node.js + Fastify)
    ↓
    ├── PostgreSQL (Cloud SQL) - Data persistence
    ├── Redis (MemoryStore) - Caching & sessions
    └── Secret Manager - Credentials
```

### Key Architectural Principles

- **Offline-First**: All writes to AsyncStorage immediately, sync when online
- **Caching Layers**: AsyncStorage → Redis → PostgreSQL
- **Server-Authoritative**: API validates all writes, resolves conflicts
- **Microservices Ready**: Modular structure for future scaling

### Detailed Architecture

For complete architecture documentation, see:
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Complete system architecture
- **[prompt/ARCHITECTURE.md](prompt/ARCHITECTURE.md)** - High-level overview

## 📚 Documentation

- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | [prompt/ARCHITECTURE.md](prompt/ARCHITECTURE.md)
- **API Usage**: [docs/API_USAGE.md](docs/API_USAGE.md)
- **Database Schema**: [docs/DATABASE_ARCHITECTURE_SUMMARY.md](docs/DATABASE_ARCHITECTURE_SUMMARY.md)
- **Deployment**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Coding Guidelines**: [prompt/CODING_GUIDELINES.md](prompt/CODING_GUIDELINES.md)

## 🔐 Security

**All API keys, credentials, and private configurations have been removed from this repository.**

Environment-specific files (`.env`, `env.gcp`, `env.production`) are excluded via `.gitignore`.

To run services locally:
1. Copy template files (e.g., `env.template.secure`)
2. Fill in your own credentials
3. Never commit sensitive files

## 🤝 Contributing

1. Follow coding guidelines in `prompt/CODING_GUIDELINES.md`
2. Write tests for new features
3. Update documentation
4. Ensure all tests pass: `yarn test`
5. Run linter: `yarn lint`
6. Submit pull request

## 📄 License

This project is released under the [MIT License](LICENSE).

---

**Built with ❤️ by Sai Kumar**

For questions or support, please open an issue or contact the maintainers.
