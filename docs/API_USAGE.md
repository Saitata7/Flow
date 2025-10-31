# Flow API Usage Guide

Complete guide for using the Flow REST API.

## Base URL

- **Production**: `https://flow-api-{region}.run.app`
- **Local Development**: `http://localhost:4000`

## Authentication

All protected endpoints require Bearer token authentication:

```http
Authorization: Bearer {session_token}
```

### Getting a Session Token

1. Register or login via `/v1/auth/login-simple`
2. Extract `sessionToken` from response
3. Use in Authorization header for subsequent requests

## API Endpoints

### Authentication (`/v1/auth`)

- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login-simple` - Login with email/password
- `POST /v1/auth/verify-simple` - Verify JWT token
- `GET /v1/auth/check-username/:username` - Check username availability

### Flows (`/v1/flows`)

- `GET /v1/flows` - Get user's flows (with pagination, sorting)
- `POST /v1/flows` - Create new flow
- `GET /v1/flows/:id` - Get flow by ID
- `PUT /v1/flows/:id` - Update flow
- `DELETE /v1/flows/:id` - Delete flow
- `GET /v1/flows/search` - Search flows
- `GET /v1/flows/:id/stats` - Get flow statistics

### Flow Entries (`/v1/flow-entries`)

- `GET /v1/flow-entries` - Get user's flow entries
- `POST /v1/flow-entries` - Create flow entry
- `GET /v1/flow-entries/:id` - Get entry by ID
- `PUT /v1/flow-entries/:id` - Update entry
- `DELETE /v1/flow-entries/:id` - Delete entry
- `GET /v1/flow-entries/today` - Get today's entries
- `POST /v1/flow-entries/bulk` - Bulk create entries

### Profile (`/v1/profile`)

- `GET /v1/profile` - Get user profile
- `PUT /v1/profile` - Update profile
- `GET /v1/profile/completeness` - Check profile completeness

### Settings (`/v1/user/settings`)

- `GET /v1/user/settings` - Get user settings
- `PUT /v1/user/settings` - Update settings

### Statistics (`/v1/stats`)

- `GET /v1/stats/users/:userId` - Get user statistics
- `GET /v1/stats/flows/:flowId/scoreboard` - Get flow scoreboard
- `GET /v1/stats/flows/:flowId/activity` - Get flow activity stats

### Activities (`/v1/activities`)

- `GET /v1/activities` - Get activity statistics
- `GET /v1/activities/flows/:flowId` - Get flow-specific activities

### Sync Queue (`/v1/sync`)

- `POST /v1/sync/queue` - Queue sync operation
- `GET /v1/sync/status` - Get sync status
- `GET /v1/sync/pending` - Get pending operations
- `POST /v1/sync/batch` - Batch sync operations

### Health & Monitoring

- `GET /health` - Health check endpoint
- `GET /debug/env` - Debug environment (development only)
- `GET /docs` - API documentation (Swagger UI)

## Request/Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Header**: `X-RateLimit-Remaining` shows remaining requests

## Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Examples

### Create Flow
```bash
curl -X POST https://api.flow.app/v1/flows \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Morning Meditation",
    "trackingType": "Binary",
    "frequency": "Daily"
  }'
```

### Create Flow Entry
```bash
curl -X POST https://api.flow.app/v1/flow-entries \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "flowId": "flow-uuid",
    "date": "2025-01-17",
    "symbol": "+",
    "moodScore": 5
  }'
```

## Postman Collection

See `services/api/postman/Flow_API_Postman_Collection.json` for a complete Postman collection with all endpoints.

