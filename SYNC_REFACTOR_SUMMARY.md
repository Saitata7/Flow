# Sync and Authentication Refactor Summary

## Overview
This document summarizes the refactoring of the Flow habit tracker project to implement reliable end-to-end sync and authentication with DB-backed sessions.

## Changes Implemented

### 1. Database Schema Updates

#### Sessions Table (Updated)
**File**: `services/api/migrations/20250127000000_create_sessions_table.js`

**Changes**:
- Added `device_id` column for optional device binding
- Extended `session_token` length from 64 to 128 characters
- Added proper index naming (`idx_sessions_user_id`, `idx_sessions_token`, `idx_sessions_expires`)

**Purpose**: Support device-specific sessions and sliding TTL

#### Sync Log Table (New)
**File**: `services/api/migrations/20250127000001_create_sync_log_table.js`

**Purpose**: Track idempotency for sync operations

**Schema**:
```sql
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idempotency_key TEXT UNIQUE NOT NULL,
  operation_type TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `user_id` index
- `idempotency_key` unique index (idx_sync_log_idempotency)
- `operation_type` index
- `created_at` index

### 2. Backend Middleware Updates

#### Session Authentication (Updated)
**File**: `services/api/src/middleware/sessionAuth.js`

**Key Changes**:

1. **Sliding TTL Extension**: Added `extendSessionExpiration()` function that extends session expiration on each valid request
   ```javascript
   const extendSessionExpiration = async (sessionToken) => {
     const newExpiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
     await query(
       `UPDATE sessions SET expires_at = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE session_token = $2 AND revoked = false`,
       [newExpiresAt, sessionToken]
     );
   };
   ```

2. **Device Binding**: Updated `createSession()` to accept optional `deviceId` parameter
   ```javascript
   const createSession = async (redis, userId, userData, deviceId = null) => {
     // ... stores deviceId in database
   };
   ```

3. **Redis Optional Fallback**: Session lookup always tries database first, falls back to Redis cache only if available

### 3. API Endpoints

#### New Batch Sync Endpoint
**File**: `services/api/src/routes/syncQueue.js`

**Endpoint**: `POST /v1/sync/batch`

**Purpose**: Process multiple queued sync operations atomically with idempotency support

**Request Schema**:
```json
{
  "operations": [
    {
      "idempotencyKey": "unique_key_here",
      "opType": "CREATE_FLOW",
      "payload": { /* flow data */ },
      "tempId": "temp_123",
      "storagePreference": "cloud"
    }
  ]
}
```

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "tempId": "temp_123",
        "serverId": "uuid_here",
        "status": "success"
      }
    ]
  },
  "message": "Processed 1 operations"
}
```

**Features**:
- Database transaction ensures atomicity
- Idempotency checking via `sync_log` table
- Supports `CREATE_FLOW`, `UPDATE_FLOW`, `DELETE_FLOW` operations
- Respects `storagePreference` (local vs cloud)

### 4. Mobile App Updates

#### Already Implemented

The mobile app already has the necessary infrastructure:

1. **AddFlow.js**:
   - Has `storagePreference` state ('local' | 'cloud')
   - Properly passes `storagePreference` to context
   - Handles cloud sync with proper error handling
   - Shows authentication warnings for cloud storage

2. **FlowContext.js**:
   - Implements `createFlowOfflineFirst()` function
   - Queues operations for background sync
   - Has sync queue processing with exponential backoff
   - Preserves temp flows until synced

3. **JWTAuthContext.js**:
   - Uses session tokens instead of JWT
   - Properly stores session tokens in AsyncStorage
   - Handles session expiration

## Key Features

### Session Management
- **DB-First**: Sessions stored in PostgreSQL as primary source
- **Redis Cache**: Optional caching for performance (falls back gracefully if unavailable)
- **Sliding TTL**: Session expiration extended on each request (30-day rolling window)
- **Device Binding**: Optional device ID for multi-device tracking

### Sync Strategy
- **Offline-First**: All operations saved locally first
- **Immediate Sync**: Cloud operations attempted immediately if online
- **Queue-Based**: Failed operations queued for retry
- **Idempotent**: Uses idempotency keys to prevent duplicates
- **Transactional**: Batch operations processed atomically

### Storage Preference
- **Local Flows**: Stored only on device, never synced to cloud
- **Cloud Flows**: Synced to database immediately when online
- **Temp IDs**: Local flows get temp IDs until synced
- **Migration**: Local flows can be upgraded to cloud when user logs in

## Migration Instructions

1. **Run Migrations**:
   ```bash
   cd services/api
   npm run migrate
   ```

2. **Verify Tables**:
   ```sql
   -- Check sessions table has device_id column
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'sessions' AND column_name = 'device_id';
   
   -- Check sync_log table exists
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'sync_log'
   );
   ```

3. **Test Session Auth**:
   - Login as user
   - Check `sessions` table for new session
   - Make API request - verify session expiration extends
   - Check Redis cache (if available)

4. **Test Batch Sync**:
   ```bash
   curl -X POST http://localhost:3000/v1/sync/batch \
     -H "Authorization: Bearer <session_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "operations": [{
         "idempotencyKey": "test_123",
         "opType": "CREATE_FLOW",
         "payload": {"title": "Test Flow"},
         "tempId": "temp_123"
       }]
     }'
   ```

## Testing Checklist

- [ ] Sessions persist in database (not just Redis)
- [ ] Session expiration extends on each request
- [ ] Redis down doesn't cause 401 errors
- [ ] Local flows stay local
- [ ] Cloud flows sync immediately when online
- [ ] Failed syncs queue for retry
- [ ] Batch sync endpoint works with transactions
- [ ] Idempotency prevents duplicate operations
- [ ] Device binding works (optional)
- [ ] 30-day session sliding window works

## Notes

- **No Breaking Changes**: All changes are backward compatible
- **Redis Optional**: App works fully if Redis is down
- **Transaction Safety**: Batch sync uses database transactions
- **Session Duration**: 30 days with sliding window (extends on each request)
- **Offline Support**: Full offline capability with background sync
- **Multi-Device Ready**: Device ID support for future multi-device sync

## Future Enhancements

- Add background sync worker for periodic sync
- Implement conflict resolution UI
- Add sync status indicators in mobile app
- Implement device-specific session revocation
- Add push notifications for sync completion
- Add admin dashboard for sync monitoring

