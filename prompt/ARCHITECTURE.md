## 🏛️ Flow Architecture Overview

Flow is a **mobile-first, offline-first habit tracking application** built with React Native and a Node.js backend.

### System Architecture

```
┌─────────────────┐
│  Mobile App     │  React Native + Expo
│  (React Native) │  - AsyncStorage (local cache)
│                 │  - React Context (state)
└────────┬────────┘
         │ HTTPS/REST API
         │ JWT/Firebase Auth
┌────────▼────────┐
│  API Service    │  Node.js + Fastify
│  (Cloud Run)    │  - Session-based auth
│                 │  - RESTful endpoints
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ Cloud │ │Redis  │
│ SQL   │ │Memory │
│(Postgres)│ │Store │
└───────┘ └───────┘
```

### Application Layers

1. **UI Layer** – `apps/mobile/src/components/`, `apps/mobile/src/screens/`
   - Pure presentation components
   - Data via React hooks and Context

2. **State Management** – `apps/mobile/src/context/`, `apps/mobile/src/hooks/`
   - FlowContext - Flow state and sync
   - ActivityContext - Stats and analytics
   - SettingsContext - User preferences
   - JWTAuthContext - Authentication

3. **Business Logic** – `apps/mobile/src/services/`
   - syncService - Offline sync with queue
   - jwtApiService - API client
   - notificationService - Push notifications
   - cacheService - Local caching

4. **Backend API** – `services/api/src/`
   - Fastify REST API
   - PostgreSQL database (Cloud SQL)
   - Redis caching (MemoryStore)
   - Session-based authentication

---

## 📊 Data Models

### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firebase_uid": "firebase-user-id",
  "display_name": "User Name",
  "username": "username",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Flow
```json
{
  "id": "uuid",
  "owner_id": "user-uuid",
  "title": "Morning Meditation",
  "description": "Daily mindfulness practice",
  "tracking_type": "Binary",
  "frequency": "Daily",
  "reminder_level": 1,
  "storage_preference": "cloud",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Flow Entry
```json
{
  "id": "uuid",
  "flow_id": "flow-uuid",
  "user_id": "user-uuid",
  "date": "2025-01-17",
  "symbol": "+",
  "mood_score": 5,
  "note": "Felt great today",
  "created_at": "2025-01-17T08:00:00Z"
}
```

---

## 🔐 Authentication

- **Primary**: JWT-based session authentication
- **Optional**: Firebase Auth token validation
- **Session Management**: Redis-backed sessions with TTL
- **Security**: Bearer token in Authorization header

---

## 🔁 Offline & Sync Strategy

1. **Local First**: All writes go to AsyncStorage immediately
2. **Sync Queue**: Changes queued in `sync_queue` table when offline
3. **Background Sync**: Automatic sync when network available
4. **Conflict Resolution**: Server-authoritative with merge strategy
5. **Idempotency**: Operations use idempotency keys to prevent duplicates

### Sync Flow
```
User Action → AsyncStorage → sync_queue → API → PostgreSQL
                ↓ (if offline)
            Queue for later
                ↓ (when online)
            Batch sync to API
```

---

## 📈 Analytics & Stats

- **Real-time Stats**: Calculated on-demand via API
- **Caching**: Redis caches computed stats (TTL: 1 hour)
- **Aggregations**: Weekly/monthly stats computed server-side
- **Leaderboards**: Cached in Redis with daily refresh

---

## 🗄️ Database Architecture

- **Primary Database**: PostgreSQL (Cloud SQL)
- **Cache**: Redis (MemoryStore)
- **Schema**: Fully normalized 3NF with proper relationships
- **Tables**: users, flows, flow_entries, plans, user_profiles, user_settings, sync_queue, notifications

See `docs/DATABASE_ARCHITECTURE_SUMMARY.md` for complete schema documentation.

---

## 🔐 Security & Privacy

- **Authentication**: JWT sessions with Redis storage
- **Authorization**: User-scoped data access
- **Data Validation**: Input sanitization and SQL injection prevention
- **Audit Trails**: created_at, updated_at, edited_by fields
- **Soft Deletes**: deleted_at timestamps

---

## 🚀 Deployment

- **API**: Google Cloud Run (containerized Node.js)
- **Database**: Cloud SQL PostgreSQL
- **Cache**: MemoryStore Redis
- **CI/CD**: GitHub Actions (if configured)
- **Secrets**: Google Secret Manager

---

## 📱 Mobile App Features

- **Offline Support**: Full functionality offline
- **Push Notifications**: Expo Notifications
- **Local Caching**: AsyncStorage for flows and entries
- **Background Sync**: Automatic when network available
- **Real-time Updates**: Context-based state management
