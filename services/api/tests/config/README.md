# 🔧 Configuration Tests

This directory contains comprehensive tests for the Flow API configuration, including Firebase, database, Redis, and environment variable validation.

## 📁 Test Structure

```
tests/config/
├── README.md                    # This file
├── index.test.js                # Main test suite runner
├── environment.test.js          # Environment variable tests
├── firebase.test.js             # Firebase configuration tests
├── connections.test.js          # Connection validation tests
└── test-all-configs.js          # Standalone test script
```

## 🚀 Running Tests

### Using Jest (Recommended)

```bash
# Run all configuration tests
npm run test:config

# Run specific test file
npm test tests/config/firebase.test.js
npm test tests/config/environment.test.js
npm test tests/config/connections.test.js
```

### Using Standalone Script

```bash
# Run comprehensive configuration test
npm run test:config:manual

# Or directly
node tests/config/test-all-configs.js
```

## 📋 Test Coverage

### Environment Tests (`environment.test.js`)
- ✅ Required environment variables
- ✅ Server configuration (NODE_ENV, PORT, HOST)
- ✅ Database configuration (Cloud SQL format)
- ✅ Redis configuration (MemoryStore format)
- ✅ Authentication configuration (JWT, Firebase)
- ✅ API configuration (rate limiting, CORS)
- ✅ Logging configuration (production settings)
- ✅ Cache configuration (TTL values)
- ✅ Cloud Run configuration
- ✅ Template variable validation

### Firebase Tests (`firebase.test.js`)
- ✅ Firebase environment variables
- ✅ Firebase Admin SDK initialization
- ✅ Firebase project configuration
- ✅ Firebase Auth service access
- ✅ Firebase permissions validation
- ✅ JWT configuration

### Connection Tests (`connections.test.js`)
- ✅ Firebase connection validation
- ✅ Database configuration validation
- ✅ Redis configuration validation
- ✅ Network configuration (CORS, rate limiting)
- ✅ Security configuration
- ✅ Production readiness checks

## 🔧 Test Configuration

### Environment File
Tests use `env.production` file for configuration:
```bash
# Load production environment variables
require('dotenv').config({ path: '../../env.production' });
```

### Test Environment
- Tests run in Node.js environment
- Firebase Admin SDK is initialized for testing
- No actual database/Redis connections (mock tests)
- Firebase connection tests may fail in CI/CD (expected)

## 📊 Test Results

### Expected Output
```
🔍 Testing All Flow API Configurations...

🔥 Firebase Configuration Test:
================================
✅ Firebase Admin SDK initialized successfully
📊 Project ID: quick-doodad-472200-k0
📧 Client Email: firebase-adminsdk-fbsvc@quick-doodad-472200-k0.iam.gserviceaccount.com
✅ Firebase Auth service is working
👥 Found 0 users in project
✅ Firebase test completed successfully

⚙️  Environment Configuration Test:
===================================
✅ NODE_ENV: Set
✅ PORT: Set
✅ HOST: Set
✅ FIREBASE_PROJECT_ID: Set
✅ FIREBASE_PRIVATE_KEY: Set
✅ FIREBASE_CLIENT_EMAIL: Set
✅ AUTH_PROVIDER: Set
✅ JWT_SECRET: Set
✅ DB_HOST: Set
✅ DB_PORT: Set
✅ DB_NAME: Set
✅ DB_USER: Set
✅ DB_PASSWORD: Set
✅ REDIS_HOST: Set
✅ REDIS_PORT: Set
✅ VALID_API_KEYS: Set
✅ CORS_ORIGIN: Set
✅ LOG_LEVEL: Set

📊 Environment Variables Status: ✅ All Set

🔍 Configuration Value Tests:
==============================
✅ NODE_ENV: Correctly set to production
✅ PORT: Correctly set to 8080 (Cloud Run standard)
✅ AUTH_PROVIDER: Correctly set to firebase
✅ JWT_SECRET: Set and appears secure

🗄️  Database Configuration:
   Host: /cloudsql/quick-doodad-472200-k0:us-central1:db-f1-micro
   Port: 5432
   Name: flow_prod
   User: db_f1_micro
   SSL: true
✅ DB_HOST: Correctly formatted for Cloud SQL

🔴 Redis Configuration:
   Host: 10.128.0.3
   Port: 6379
   DB: 0
✅ REDIS_HOST: Valid IP address format

🔑 API Configuration:
   Rate Limit Max: 1000
   Rate Limit Window: 60000
   Valid API Keys: Set
   CORS Origin: https://flow.app,https://app.flow.com

📝 Logging Configuration:
   Level: info
   Format: json
✅ Logging: Correctly configured for production

💾 Cache Configuration:
   Flow TTL: 3600s
   User TTL: 1800s
   Leaderboard TTL: 86400s

☁️  Cloud Run Configuration:
   Service: flow-prod
   Region: us-central1

📋 Configuration Summary:
=========================
✅ Firebase: Properly configured
✅ Environment Variables: All required variables set
✅ Database: Cloud SQL configuration ready
✅ Redis: MemoryStore configuration ready
✅ API: Rate limiting and CORS configured
✅ Logging: Production-ready configuration
✅ Cache: TTL values configured
✅ Cloud Run: Service configuration ready

🎉 All configuration tests completed!
```

## 🛠️ Troubleshooting

### Common Issues

1. **"Missing required Firebase environment variables"**
   - Check if `env.production` file exists
   - Verify Firebase environment variables are set
   - Ensure no template variables (${...}) remain

2. **"Firebase initialization failed"**
   - Check Firebase private key format
   - Verify project ID and client email
   - Ensure private key includes `\n` characters

3. **"Template variables found"**
   - Replace all `${...}` placeholders with actual values
   - Check environment file for missing replacements

4. **"Database configuration invalid"**
   - Verify Cloud SQL format: `/cloudsql/project:region:instance`
   - Check database credentials
   - Ensure SSL is enabled

### Debug Commands

```bash
# Check environment variables
node -e "require('dotenv').config({path:'./env.production'}); console.log(process.env.FIREBASE_PROJECT_ID)"

# Test Firebase connection
node -e "
const admin = require('firebase-admin');
require('dotenv').config({path:'./env.production'});
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});
console.log('Firebase initialized successfully');
"
```

## 📚 Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Google Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Google Cloud MemoryStore Documentation](https://cloud.google.com/memorystore/docs)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

---

**Remember**: These tests validate configuration but don't test actual connections to external services. For connection testing, deploy to Cloud Run and test endpoints directly.
