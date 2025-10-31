# 🚀 Flow API - Quick Reference Card

## 🔐 Authentication Methods

### **JWT Authentication (Local Development)**
```
Authorization: Bearer {{jwt_token}}
```

### **Simple Login Flow**
1. POST `/v1/auth/login-simple` with email
2. Get JWT token from response
3. Use token in Authorization header

## 📊 Essential Endpoints

### **Authentication**
- `POST /v1/auth/login-simple` - Login with email
- `POST /v1/auth/verify-simple` - Verify JWT token
- `GET /v1/auth/check-username/:username` - Check username availability

### **Flows**
- `GET /v1/flows` - Get user's flows
- `POST /v1/flows` - Create new flow
- `GET /v1/flows/:id` - Get flow by ID
- `PUT /v1/flows/:id` - Update flow
- `DELETE /v1/flows/:id` - Delete flow

### **Flow Entries**
- `GET /v1/flow-entries` - Get flow entries
- `POST /v1/flow-entries` - Create flow entry
- `PUT /v1/flow-entries/:id` - Update flow entry
- `DELETE /v1/flow-entries/:id` - Delete flow entry

### **Statistics**
- `GET /v1/stats/users/:userId` - Get user statistics
- `GET /v1/stats/flows/:flowId/scoreboard` - Get flow scoreboard
- `GET /v1/stats/flows/:flowId/activity` - Get flow activity stats
- `GET /v1/stats/flows/:flowId/emotional` - Get emotional activity

### **Profile & Settings**
- `GET /v1/profile` - Get user profile
- `PUT /v1/profile` - Update user profile
- `GET /v1/profile/completeness` - Check profile completeness
- `GET /v1/settings` - Get user settings
- `PUT /v1/settings` - Update user settings

### **Health & Monitoring**
- `GET /health` - Service health check
- `GET /health/redis` - Redis connection status

## 🔧 Environment Variables

### **Local Development**
- `base_url`: `http://localhost:4003`
- `auth_provider`: `jwt-only`
- `jwt_secret`: `Flow-dev-secret-key-2024`

### **Production**
- `base_url`: `{{cloud_run_url}}` (set in environment)
- `auth_provider`: `firebase`
- `jwt_secret`: `{{jwt_secret}}` (set in environment)

## 📝 Common Request Examples

### **Login**
```bash
POST {{base_url}}/v1/auth/login-simple
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password"
}
```

### **Create Flow**
```bash
POST {{base_url}}/v1/flows
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "title": "{{test_flow_title}}",
  "description": "{{test_flow_description}}",
  "trackingType": "Binary",
  "reminderLevel": "1"
}
```

### **Create Flow Entry**
```bash
POST {{base_url}}/v1/flow-entries
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "flowId": "{{flow_id}}",
  "date": "2025-01-17",
  "status": "completed",
  "value": 1
}
```

## 🚨 Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `CONFLICT` - Resource conflict
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## 🔍 Testing Tips

1. **Start with login** - Always authenticate first
2. **Use variables** - Set `{{flow_id}}`, `{{user_id}}` etc.
3. **Check responses** - Look for `success: true`
4. **Handle errors** - Check error codes and messages
5. **Test edge cases** - Invalid data, missing fields

## 📱 Mobile App Integration

- **Base URL**: `http://10.0.10.133:4003` (for mobile app)
- **CORS**: Configured for localhost and mobile app
- **Authentication**: JWT tokens with 7-day expiration
- **Rate Limiting**: 1000 requests per minute

## 🚀 Quick Start

1. Import `Flow_API_Local_Environment.json`
2. Set `user_email` variable
3. Run login request
4. Copy JWT token to `jwt_token` variable
5. Test other endpoints

## 📊 Response Format

### **Success Response**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### **Error Response**
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```