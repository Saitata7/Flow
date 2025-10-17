# Flow API Service

Backend API service for Flow - A modern habit tracking and personal development application.

## 🚀 Features

- **JWT Authentication**: Secure token-based authentication system
- **Flow Management**: Create, track, and manage daily habits and flows
- **Statistics & Analytics**: Comprehensive stats with real-time calculations
- **Profile Management**: User profiles with validation and completeness checks
- **Settings & Preferences**: Customizable user settings and preferences
- **Offline Sync**: Queue-based sync for offline-first functionality
- **Redis Caching**: High-performance caching for stats and leaderboards
- **Rate Limiting**: Built-in protection against abuse
- **Health Monitoring**: Comprehensive health checks and monitoring

## 🛠 Tech Stack

- **Node.js** 18+ with Fastify framework
- **JWT** for authentication (Firebase disabled for local development)
- **Redis** for caching and session management
- **PostgreSQL** for data persistence (when implemented)
- **AJV** for request/response validation
- **Swagger/OpenAPI** for API documentation

## 📱 API Endpoints

### Authentication
- `POST /v1/auth/login-simple` - Simple login with email
- `POST /v1/auth/verify-simple` - Verify JWT token
- `GET /v1/auth/check-username/:username` - Check username availability

### Flows
- `GET /v1/flows` - Get user's flows
- `POST /v1/flows` - Create new flow
- `GET /v1/flows/:id` - Get flow by ID
- `PUT /v1/flows/:id` - Update flow
- `DELETE /v1/flows/:id` - Delete flow

### Flow Entries
- `GET /v1/flow-entries` - Get flow entries
- `POST /v1/flow-entries` - Create flow entry
- `PUT /v1/flow-entries/:id` - Update flow entry
- `DELETE /v1/flow-entries/:id` - Delete flow entry

### Statistics
- `GET /v1/stats/users/:userId` - Get user statistics
- `GET /v1/stats/flows/:flowId/scoreboard` - Get flow scoreboard
- `GET /v1/stats/flows/:flowId/activity` - Get flow activity stats
- `GET /v1/stats/flows/:flowId/emotional` - Get emotional activity

### Profile & Settings
- `GET /v1/profile` - Get user profile
- `PUT /v1/profile` - Update user profile
- `GET /v1/profile/completeness` - Check profile completeness
- `GET /v1/settings` - Get user settings
- `PUT /v1/settings` - Update user settings

### Health & Monitoring
- `GET /health` - Service health check
- `GET /health/redis` - Redis connection status

## 🏗 Project Structure

```
services/api/
├── src/
│   ├── controllers/          # Route handlers
│   │   ├── flows.controller.js
│   │   ├── flowEntries.controller.js
│   │   ├── stats.controller.js
│   │   ├── profile.controller.js
│   │   └── settings.controller.js
│   ├── routes/               # Route definitions
│   │   ├── auth.js
│   │   ├── flows.js
│   │   ├── flowEntries.js
│   │   ├── stats.js
│   │   ├── profile.js
│   │   └── settings.js
│   ├── middleware/           # Middleware functions
│   │   ├── auth.js          # JWT authentication
│   │   ├── errorHandler.js  # Error handling
│   │   └── requestLogger.js # Request logging
│   ├── services/            # Business logic
│   │   ├── notificationService.js
│   │   ├── schedulerService.js
│   │   └── syncQueueService.js
│   ├── redis/               # Redis client
│   │   ├── client.js
│   │   └── enhanced-client.js
│   ├── utils/               # Utility functions
│   │   └── profileValidation.js
│   └── index.js             # Main server file
├── complete-server.js       # Standalone server with all endpoints
├── migrations/              # Database migrations
├── scripts/                 # Utility scripts
├── tests/                   # Test files
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Redis server (optional, falls back to in-memory storage)
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment:**
```bash
cp env.template.secure .env.local
# Edit .env.local with your configuration
```

3. **Start Redis (optional):**
```bash
redis-server
```

4. **Start the server:**
```bash
# Development mode
npm run dev

# Production mode
npm start

# Standalone server (includes all endpoints)
node complete-server.js
```

The API will be available at `http://localhost:4003`

## 🔧 Environment Configuration

### Local Development (.env.local)
```bash
# Server Configuration
NODE_ENV=development
HOST=0.0.0.0
PORT=4003
LOG_LEVEL=debug

# Database Configuration (Local PostgreSQL)
DB_NAME=flow_dev
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false
PGSSLMODE=disable

# Redis Configuration (Local Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Authentication - JWT is the primary method
AUTH_PROVIDER=jwt-only
JWT_SECRET=Flow-dev-secret-key-2024
JWT_EXPIRES_IN=7d
PRIORITIZE_JWT=true

# Firebase Configuration (Disabled for local development)
# FIREBASE_PROJECT_ID=your_project_id_here
# FIREBASE_CLIENT_EMAIL=your_service_account_email_here
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Firebase Private Key\n-----END PRIVATE KEY-----\n"

# API Configuration
VALID_API_KEYS=dev-api-key-123
API_RATE_LIMIT_MAX=1000
API_RATE_LIMIT_WINDOW=60000

# CORS Configuration (Allow localhost for development)
CORS_ORIGIN=http://localhost:3000,http://localhost:8081,exp://localhost:8081

# Cache Configuration
CACHE_TTL_FLOW=3600
CACHE_TTL_USER=1800
CACHE_TTL_LEADERBOARD=86400

# Logging
LOG_FORMAT=json
```

## 🔐 Authentication

### JWT Authentication
The API uses JWT tokens for authentication. Include the token in the Authorization header:

```bash
curl -H "Authorization: Bearer your-jwt-token" \
     http://localhost:4003/v1/flows
```

### Simple Login Flow
1. User provides email (password ignored in simple login)
2. Server generates JWT token with user ID
3. Client stores token and includes in subsequent requests
4. Server validates token on each request

### User ID Generation
User IDs are generated using MD5 hash of email for consistency:
```javascript
const userId = crypto.createHash('md5').update(email).digest('hex');
```

## 📊 Data Storage

### Current Implementation
- **File-based storage**: `data.json` for development
- **In-memory storage**: Fallback when Redis unavailable
- **Redis caching**: For performance optimization

### Future Implementation
- **PostgreSQL**: For production data persistence
- **Redis**: For caching and session management
- **Cloud SQL**: For production deployment

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Configuration tests
npm run test:config
```

### Test Structure
- `tests/unit/` - Unit tests for individual functions
- `tests/integration/` - Integration tests for API endpoints
- `tests/config/` - Configuration and environment tests

## 📈 Monitoring & Health Checks

### Health Endpoints
- `GET /health` - Basic service health
- `GET /health/redis` - Redis connection status
- `GET /health/db` - Database connection status (when implemented)

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking and monitoring

## 🚀 Deployment

### Development
```bash
# Start with file-based storage
node complete-server.js

# Start with Redis
REDIS_HOST=localhost node complete-server.js
```

### Production
```bash
# Build and start
npm run build
npm start

# With environment variables
NODE_ENV=production npm start
```

### Docker
```bash
# Build image
docker build -t flow-api .

# Run container
docker run -p 4003:4003 flow-api
```

## 🔧 Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run clean` - Clean build artifacts
- `npm run openapi:generate` - Generate OpenAPI documentation

## 📝 API Documentation

### Swagger UI
Visit `http://localhost:4003/docs` for interactive API documentation.

### OpenAPI Specification
- JSON: `http://localhost:4003/docs/json`
- YAML: `http://localhost:4003/docs/yaml`

## 🔍 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `CONFLICT` - Resource conflict
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## 🚀 Recent Updates

- ✅ **JWT-only authentication** - Firebase disabled for local development
- ✅ **Consistent user IDs** - MD5-based user identification
- ✅ **Profile validation** - Username uniqueness and completeness checks
- ✅ **Comprehensive stats** - Real-time statistics and analytics
- ✅ **Offline sync** - Queue-based sync for offline functionality
- ✅ **Redis caching** - Performance optimization with fallback
- ✅ **Health monitoring** - Comprehensive health checks
- ✅ **Code cleanup** - Removed outdated documentation and scripts

## 📄 License

This project is part of the Flow ecosystem. See the main project README for license information.