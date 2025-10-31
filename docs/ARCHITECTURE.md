# Flow System Architecture

Complete technical architecture documentation for the Flow platform.

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────────┐          ┌──────────────┐           │
│  │ Mobile App   │          │  Web App     │           │
│  │ (React       │          │  (React)     │           │
│  │  Native)     │          │              │           │
│  └──────┬───────┘          └──────┬───────┘           │
│         │                          │                    │
│    AsyncStorage               Browser Storage          │
│    React Context             Local State               │
└─────────┼──────────────────────────┼───────────────────┘
          │                          │
          │       HTTPS/REST API      │
          │    JWT Session Auth       │
          │                          │
┌─────────▼──────────────────────────▼───────────────────┐
│                   API Gateway Layer                    │
│  ┌────────────────────────────────────────────┐       │
│  │         Flow API Service                    │       │
│  │  Node.js + Fastify                         │       │
│  │  - REST API endpoints                       │       │
│  │  - Authentication middleware               │       │
│  │  - Rate limiting                            │       │
│  │  - Request validation                       │       │
│  │  - Error handling                           │       │
│  └──────────────┬─────────────────────────────┘       │
└─────────────────┼─────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐   ┌───▼────┐   ┌───▼────┐
│Cloud  │   │Redis   │   │Secret  │
│SQL    │   │Memory  │   │Manager │
│(Postgres)│ │Store   │   │        │
└───────┘   └────────┘   └────────┘
```

## 🏗️ System Components

### 1. Mobile Application (`apps/mobile/`)

**Technology Stack:**
- React Native 0.81.4
- Expo SDK 54
- React 19.1.0
- React Navigation 7

**Architecture Layers:**

#### UI Layer
```
apps/mobile/src/
├── components/        # Reusable UI components
│   ├── common/       # Buttons, Cards, Inputs
│   ├── flow/         # Flow-specific components
│   └── FlowStats/    # Statistics components
└── screens/          # Screen components
    ├── auth/         # Authentication screens
    ├── home/         # Home and flow management
    ├── stats/        # Statistics screens
    └── settings/      # Settings screens
```

**Key Features:**
- Pure presentation components
- Data via React hooks and Context
- Responsive design with mobile-first approach

#### State Management Layer
```
apps/mobile/src/
├── context/           # React Context providers
│   ├── FlowContext.js        # Flow state and sync
│   ├── ActivityContext.js    # Stats and analytics
│   ├── SettingsContext.js    # User preferences
│   └── JWTAuthContext.js     # Authentication
└── hooks/             # Custom React hooks
    ├── useAuth.js
    ├── useNotifications.js
    └── useSettings.js
```

**State Management Strategy:**
- **Local State**: React Context for app-wide state
- **Persistent Storage**: AsyncStorage for offline data
- **Cache**: In-memory cache with AsyncStorage backup
- **Sync**: Background sync queue system

#### Service Layer
```
apps/mobile/src/services/
├── jwtApiService.js          # API client
├── syncService.js            # Offline sync
├── notificationService.js     # Push notifications
├── cacheService.js           # Local caching
└── backgroundSyncService.js   # Background sync
```

**Service Responsibilities:**
- API communication
- Offline data management
- Sync queue processing
- Local caching strategies

### 2. API Service (`services/api/`)

**Technology Stack:**
- Node.js 20+
- Fastify framework
- PostgreSQL (Cloud SQL)
- Redis (MemoryStore)
- JWT authentication

**Architecture Layers:**

#### Route Layer
```
services/api/src/routes/
├── flows.js           # Flow management
├── flowEntries.js     # Entry management
├── profile.js         # User profiles
├── settings.js        # User settings
├── stats.js           # Statistics
├── activities.js      # Activity tracking
├── syncQueue.js       # Sync operations
└── jwtAuth.js         # Authentication
```

**Request Flow:**
```
Client Request
    ↓
Rate Limiting Middleware
    ↓
Authentication Middleware
    ↓
Request Validation (AJV)
    ↓
Controller (Business Logic)
    ↓
Database/Redis Access
    ↓
Response Formatting
    ↓
Client Response
```

#### Controller Layer
```
services/api/src/controllers/
├── flows.controller.js
├── flowEntries.controller.js
├── profile.controller.js
├── settings.controller.js
└── stats.controller.js
```

#### Data Access Layer
```
services/api/src/db/
├── config.js          # Database connection
├── models/            # Data models
│   ├── FlowModel.js
│   ├── UserModel.js
│   └── EntryModel.js
└── migrations/        # Schema migrations
```

### 3. Database Architecture

**Primary Database: PostgreSQL (Cloud SQL)**

**Schema Design:**
- Fully normalized to 3NF
- UUID primary keys
- Foreign key constraints
- Soft deletes with `deleted_at`
- Audit trails (created_at, updated_at)

**Core Tables:**
```
users ──→ flows ──→ flow_entries
  │         │
  │         └──→ notification_schedules
  │
  ├──→ user_profiles
  ├──→ user_settings
  ├──→ sync_queue
  └──→ user_notifications
```

See [DATABASE_ARCHITECTURE_SUMMARY.md](DATABASE_ARCHITECTURE_SUMMARY.md) for complete schema.

**Caching Layer: Redis (MemoryStore)**

**Cache Strategy:**
- **TTL-based expiration**
  - Flow cache: 3600s (1 hour)
  - User cache: 1800s (30 minutes)
  - Stats cache: 86400s (24 hours)
- **Cache invalidation**: On write operations
- **Fallback**: In-memory cache if Redis unavailable

## 🔄 Data Flow

### Write Operation Flow
```
1. User Action (Mobile App)
   ↓
2. Update AsyncStorage (immediate)
   ↓
3. Queue in sync_queue (if offline)
   OR
3. API Request (if online)
   ↓
4. API validates & processes
   ↓
5. Write to PostgreSQL
   ↓
6. Invalidate Redis cache
   ↓
7. Return success to client
```

### Read Operation Flow
```
1. User Request (Mobile App)
   ↓
2. Check AsyncStorage cache
   ↓
3. If cache hit → return immediately
   ↓
4. If cache miss → API request
   ↓
5. API checks Redis cache
   ↓
6. If Redis hit → return cached data
   ↓
7. If Redis miss → query PostgreSQL
   ↓
8. Cache result in Redis
   ↓
9. Return to client & cache in AsyncStorage
```

### Sync Operation Flow
```
Offline Operations:
1. User actions → AsyncStorage
2. Queue in sync_queue table (via API)
3. Background sync service processes queue
4. Retry on failure (exponential backoff)

Online Operations:
1. User actions → AsyncStorage + API
2. API validates & persists
3. Cache invalidation
4. Success response
```

## 🔐 Security Architecture

### Authentication Flow
```
1. User Login
   ↓
2. API validates credentials
   ↓
3. Generate JWT session token
   ↓
4. Store session in Redis (with TTL)
   ↓
5. Return token to client
   ↓
6. Client stores token securely
   ↓
7. Subsequent requests include token
   ↓
8. API validates token via Redis lookup
```

### Security Layers
1. **Transport Security**: HTTPS/TLS
2. **Authentication**: JWT tokens
3. **Authorization**: User-scoped data access
4. **Input Validation**: AJV schema validation
5. **SQL Injection Prevention**: Parameterized queries
6. **Rate Limiting**: Per-IP and per-user limits
7. **Secrets Management**: GCP Secret Manager

## 📊 Performance Architecture

### Caching Strategy
- **L1 Cache**: AsyncStorage (mobile app)
- **L2 Cache**: Redis (API service)
- **L3 Store**: PostgreSQL (persistent storage)

### Optimization Techniques
- Database indexing on frequently queried columns
- Connection pooling for database connections
- Batch operations for sync queue processing
- Lazy loading for large datasets
- Pagination for list endpoints

## 🚀 Deployment Architecture

### Infrastructure (GCP)
```
┌─────────────────────────────────────┐
│        Google Cloud Platform        │
│                                     │
│  ┌─────────────┐  ┌──────────────┐ │
│  │  Cloud Run  │  │  Cloud SQL   │ │
│  │  (API)      │  │  (Postgres) │ │
│  └──────┬──────┘  └──────┬───────┘ │
│         │                 │         │
│  ┌──────▼─────────────────▼───────┐ │
│  │    MemoryStore (Redis)          │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │    Secret Manager             │ │
│  │    (Credentials)              │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Deployment Flow
```
1. Code Push (GitHub)
   ↓
2. Cloud Build Trigger
   ↓
3. Docker Image Build
   ↓
4. Push to Artifact Registry
   ↓
5. Deploy to Cloud Run
   ↓
6. Run Database Migrations
   ↓
7. Health Check Validation
   ↓
8. Traffic Routing
```

## 🔄 Monorepo Architecture

### Turborepo Structure
```
Flow/
├── apps/              # Applications
│   ├── mobile/       # React Native app
│   └── web/          # Static website
├── packages/          # Shared packages
│   ├── api-sdk/      # API client
│   └── data-models/  # Schemas
├── services/          # Backend services
│   └── api/          # REST API
└── infra/            # Infrastructure
    └── terraform/    # IaC
```

### Build & Test Pipeline
```
1. Install Dependencies
   ↓
2. Lint (parallel)
   ↓
3. Type Check (parallel)
   ↓
4. Unit Tests (parallel)
   ↓
5. Integration Tests
   ↓
6. Build (with dependencies)
   ↓
7. E2E Tests
   ↓
8. Deploy
```

## 📚 Related Documentation

- **Database Schema**: [DATABASE_ARCHITECTURE_SUMMARY.md](DATABASE_ARCHITECTURE_SUMMARY.md)
- **API Usage**: [API_USAGE.md](API_USAGE.md)
- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Sync Strategy**: [../prompt/SYNC_RULES.md](../prompt/SYNC_RULES.md)
- **Coding Guidelines**: [../prompt/CODING_GUIDELINES.md](../prompt/CODING_GUIDELINES.md)

## 🔮 Future Architecture Considerations

### Scalability
- Horizontal scaling via Cloud Run
- Read replicas for PostgreSQL
- CDN for static assets
- Message queues for async processing

### Performance
- GraphQL API for flexible queries
- Real-time updates via WebSockets
- Edge caching via Cloud CDN
- Database sharding for large datasets

### Observability
- Distributed tracing
- Advanced metrics and alerting
- Log aggregation and analysis
- Performance monitoring

