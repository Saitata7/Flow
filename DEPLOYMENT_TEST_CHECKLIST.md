# Deployment Test Checklist for Sync & Auth Refactor

## Quick Test Guide

### 🎯 Pre-Deployment Checks

#### 1. Session Extension Logic
**Test**: Verify session expiration extends on each request

**Steps**:
```bash
# 1. Login as user
# 2. Check initial expires_at
SELECT expires_at FROM sessions WHERE user_id = '<userId>' ORDER BY created_at DESC LIMIT 1;

# 3. Make any API call (e.g., GET /v1/flows)
# 4. Check expires_at again - should be 30 days from now
SELECT expires_at FROM sessions WHERE user_id = '<userId>' ORDER BY updated_at DESC LIMIT 1;
```

**Expected**: `expires_at` increases on each request (sliding window)

**Fix if needed**:
```javascript
// Already implemented in sessionAuth.js
await extendSessionExpiration(sessionToken);
```

#### 2. Redis Disabled Test
**Test**: Verify no 401s when Redis is down

**Steps**:
```bash
# Stop Redis
docker stop redis

# Test login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test API call with session token
curl -X GET http://localhost:3000/v1/flows \
  -H "Authorization: Bearer <session_token>"

# Create flow (cloud mode)
curl -X POST http://localhost:3000/v1/flows \
  -H "Authorization: Bearer <session_token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Flow","trackingType":"Binary","frequency":"Daily","storagePreference":"cloud"}'
```

**Expected**: All operations work (DB fallback)
**✅ No 401s should occur**

#### 3. Idempotency Test
**Test**: Ensure repeated syncs don't duplicate rows

**Steps**:
```bash
# Run batch sync twice with same idempotency key
curl -X POST http://localhost:3000/v1/sync/batch \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [{
      "idempotencyKey": "test_123",
      "opType": "CREATE_FLOW",
      "payload": {"title":"Test Flow","trackingType":"Binary","frequency":"Daily"},
      "tempId": "temp_123"
    }]
  }'

# Run again with same key
curl -X POST http://localhost:3000/v1/sync/batch \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [{
      "idempotencyKey": "test_123",
      "opType": "CREATE_FLOW",
      "payload": {"title":"Test Flow","trackingType":"Binary","frequency":"Daily"},
      "tempId": "temp_123"
    }]
  }'

# Check database
SELECT COUNT(*) FROM flows WHERE title = 'Test Flow';
SELECT * FROM sync_log WHERE idempotency_key = 'test_123';
```

**Expected**:
- Only 1 row in `flows` table
- First response: `status: 'success'`
- Second response: `status: 'duplicate'`
- Only 1 row in `sync_log` table

#### 4. Mobile Session Recovery
**Test**: Simulate logout/login

**Steps**:
```bash
# 1. Check current session
SELECT * FROM sessions WHERE user_id = '<userId>' ORDER BY created_at DESC LIMIT 1;

# 2. Delete token manually (simulate logout)
# In mobile app: await clearSessionToken()

# 3. Login again
# In mobile app: login(email, password)

# 4. Check new session created
SELECT * FROM sessions WHERE user_id = '<userId>' ORDER BY created_at DESC LIMIT 1;
```

**Expected**: New session with new token and updated `device_id`

#### 5. Offline Queue Resilience
**Test**: Create flows offline, verify sync on reconnect

**Mobile App Steps**:
1. Turn off Wi-Fi
2. Create 2-3 cloud flows in mobile app
3. Check AsyncStorage: `const queue = await AsyncStorage.getItem('sync_queue');`
4. Turn Wi-Fi back on
5. Check logs for automatic sync

**Expected**: All flows sync automatically when online

**Debug**:
```javascript
// In mobile app console
const queue = await AsyncStorage.getItem('sync_queue');
console.log('Sync queue:', JSON.parse(queue));

// After reconnect, check if queue is empty
const queueAfter = await AsyncStorage.getItem('sync_queue');
console.log('Sync queue after:', JSON.parse(queueAfter || '[]'));
```

## Advanced Testing

### Session Cleanup Test
**Background Worker** (Optional, add later)

```sql
-- Run manually or via cron
DELETE FROM sessions WHERE expires_at < NOW();

-- Check cleanup
SELECT COUNT(*) as total_sessions FROM sessions;
SELECT COUNT(*) as expired_sessions FROM sessions WHERE expires_at < NOW();
```

### Cloud Flow Logging
**Test**: Verify storage_preference is tracked

```sql
-- Check cloud vs local flows
SELECT storage_preference, COUNT(*) 
FROM flows 
GROUP BY storage_preference;

-- Filter cloud flows only
SELECT * FROM flows WHERE storage_preference = 'cloud';
```

### Device Binding Test (Optional)
**Test**: Verify device_id is stored and can be used for security

```sql
-- Check sessions have device_id
SELECT id, device_id, expires_at, created_at 
FROM sessions 
WHERE user_id = '<userId>';

-- Count sessions per device
SELECT device_id, COUNT(*) as session_count
FROM sessions 
WHERE user_id = '<userId>' AND revoked = false
GROUP BY device_id;
```

## New Endpoints Testing

### 1. Sync Status Endpoint
```bash
curl -X GET http://localhost:3000/v1/sync/status \
  -H "Authorization: Bearer <token>"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "pendingOperations": 0,
    "recentSyncs": [],
    "activeSessions": {
      "count": 1,
      "latestExpiry": "2025-02-26T10:00:00.000Z"
    },
    "redis": {
      "available": true,
      "status": "connected"
    }
  },
  "message": "Sync status retrieved"
}
```

### 2. Batch Sync Endpoint
```bash
curl -X POST http://localhost:3000/v1/sync/batch \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "idempotencyKey": "unique_key_1",
        "opType": "CREATE_FLOW",
        "payload": {
          "title": "Morning Meditation",
          "trackingType": "Binary",
          "frequency": "Daily"
        },
        "tempId": "temp_001",
        "storagePreference": "cloud"
      }
    ]
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "tempId": "temp_001",
        "serverId": "uuid-of-created-flow",
        "status": "success"
      }
    ]
  },
  "message": "Processed 1 operations"
}
```

## Performance Tests

### Session Lookup Performance
```bash
# Time a session lookup with Redis vs without
time curl -X GET http://localhost:3000/v1/flows \
  -H "Authorization: Bearer <token>"

# Should be <100ms with Redis, <500ms without
```

### Batch Sync Performance
```bash
# Create 10 flows in batch
time curl -X POST http://localhost:3000/v1/sync/batch \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [ /* 10 operations */ ]
  }'

# Should complete in <2 seconds
```

## Database Health Checks

### Check Migrations Ran
```sql
-- Verify new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('sessions', 'sync_log');

-- Check sessions table has device_id
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'sessions' AND column_name = 'device_id';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('sessions', 'sync_log');
```

### Check Constraint Integrity
```sql
-- Verify foreign key works
SELECT COUNT(*) FROM sessions WHERE user_id NOT IN (SELECT id FROM users);

-- Should be 0

-- Verify sync_log foreign key
SELECT COUNT(*) FROM sync_log WHERE user_id NOT IN (SELECT id FROM users);

-- Should be 0
```

## Production Deployment Steps

### 1. Run Migrations
```bash
cd services/api
npm run migrate
```

### 2. Verify Backend Health
```bash
curl http://localhost:3000/v1/health
```

### 3. Test Authentication
```bash
# Register
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","firstName":"Test","lastName":"User","username":"testuser"}'

# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

### 4. Test Mobile App
- Open mobile app
- Login with credentials
- Create cloud flow
- Turn off network
- Create local flow
- Turn on network
- Verify cloud flow syncs

### 5. Monitor Logs
```bash
# Watch backend logs
tail -f logs/app.log

# Look for:
# ✅ Session expiration extended
# ✅ Session stored in database
# ✅ Batch sync completed
# ⚠️ Redis unavailable (if Redis down) - should not cause 401s
```

## Rollback Plan

If issues occur:

### 1. Rollback Migrations
```bash
cd services/api
npm run migrate:rollback
```

### 2. Revert Code Changes
```bash
git revert HEAD
```

### 3. Restart Services
```bash
# Backend
cd services/api && npm restart

# Mobile app
# Restart app, clear cache
```

## Success Criteria

✅ Sessions persist in database (not just Redis)
✅ Session expiration extends on each request  
✅ Redis down doesn't cause 401 errors
✅ Local flows stay local only
✅ Cloud flows sync immediately when online
✅ Failed syncs queue for retry
✅ Batch sync works with transactions
✅ Idempotency prevents duplicate operations
✅ Device binding works (optional)
✅ 30-day session sliding window works
✅ Offline queue persists across app restarts
✅ `/v1/sync/status` endpoint provides diagnostics

## Known Limitations

- Session cleanup is manual (add background worker later)
- Device binding is optional (can be enforced later)
- Batch sync limited to 100 operations per request
- Local flows cannot be converted to cloud after creation
- Sync queue relies on AsyncStorage (SQLite available as upgrade)

## Next Steps After Deployment

1. **Add Background Worker**: Schedule hourly cleanup job
2. **Implement Conflict Resolution**: Handle conflicts in sync queue
3. **Add Device Revocation**: Allow revoking specific device sessions
4. **Add Push Notifications**: Notify on sync completion
5. **Add Admin Dashboard**: View sync status and metrics

## Support

If issues arise:
1. Check logs in `logs/app.log`
2. Verify database connection
3. Check Redis connection (optional)
4. Test with `/v1/sync/status` endpoint
5. Review `SYNC_REFACTOR_SUMMARY.md` for implementation details

