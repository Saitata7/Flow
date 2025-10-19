# GCP Production Environment Setup Guide

## Overview

This guide covers the complete setup of the Flow API backend server for Google Cloud Platform (GCP) production deployment, including local development and production environment configurations.

## Files Created/Updated

### Environment Configuration Files
- **`env.local`** - Local development environment configuration
- **`env.gcp`** - GCP production environment configuration

### GCP Configuration Classes
- **`src/config/gcpConfig.js`** - Centralized configuration manager
- **`src/config/gcpDatabase.js`** - GCP Cloud SQL database manager
- **`src/config/gcpRedis.js`** - GCP Redis MemoryStore manager

### Updated Existing Files
- **`src/db/config.js`** - Updated to use GCP configuration manager
- **`src/redis/client.js`** - Updated to use GCP configuration manager
- **`src/index.js`** - Updated to use GCP configuration manager

### Deployment & Testing Scripts
- **`scripts/testGCPProduction.js`** - Comprehensive GCP environment testing
- **`scripts/deployGCP.sh`** - GCP Cloud Run deployment script

## Environment Configuration

### Local Development (`env.local`)

```bash
# Server Configuration
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Database (Local PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flow_dev
DB_USER=flow_user
DB_PASSWORD=flow_password
DB_SSL=false

# Redis (Local Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=Flow-dev-secret-key-2024-change-in-production
AUTH_PROVIDER=jwt-only
```

### GCP Production (`env.gcp`)

```bash
# Server Configuration
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# GCP Cloud SQL
DB_HOST=/cloudsql/flow-production:us-central1:flow-postgres
DB_PORT=5432
DB_NAME=flow_production
DB_USER=flow_user
DB_PASSWORD=${DB_PASSWORD}
DB_SSL=true

# GCP Redis MemoryStore
REDIS_HOST=10.58.145.227
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# Authentication
JWT_SECRET=${JWT_SECRET}
AUTH_PROVIDER=firebase
FIREBASE_PROJECT_ID=flow-production
```

## GCP Services Configuration

### Cloud SQL (PostgreSQL)
- **Instance**: `flow-postgres`
- **Region**: `us-central1`
- **Connection**: Unix socket via Cloud SQL Proxy
- **SSL**: Enabled for production
- **Pooling**: Optimized for Cloud Run (5-20 connections)

### Redis MemoryStore
- **Host**: `10.58.145.227` (Internal IP)
- **Port**: `6379`
- **Authentication**: Password-based
- **Network**: VPC peering with Cloud Run

### Cloud Run
- **Service**: `flow-api`
- **Region**: `us-central1`
- **Port**: `8080`
- **Memory**: 1Gi
- **CPU**: 1
- **Scaling**: 0-10 instances

## Testing

### Local Environment Test
```bash
NODE_ENV=development node scripts/testGCPProduction.js
```

**Expected Output:**
```
🎉 ALL TESTS PASSED - GCP Production Environment Ready!
🚀 Environment Details:
   Environment: development
   Is GCP: false
   Database: localhost
   Redis: localhost
   Port: 4000
```

### GCP Production Test
```bash
NODE_ENV=production node scripts/testGCPProduction.js
```

**Expected Output:**
```
✅ Configuration test passed
❌ Database test failed: connect ENOENT /cloudsql/... (Expected - not running on GCP)
```

*Note: Database connection failure is expected when testing locally, as Cloud SQL Proxy socket is only available on Cloud Run.*

## Deployment

### Prerequisites
1. Google Cloud SDK installed
2. Docker installed
3. GCP project configured
4. Required APIs enabled:
   - Cloud Build API
   - Cloud Run API
   - Cloud SQL Admin API
   - Redis API

### Deploy to GCP
```bash
./scripts/deployGCP.sh
```

This script will:
1. Set GCP project
2. Enable required APIs
3. Build Docker image
4. Push to Google Container Registry
5. Deploy to Cloud Run
6. Configure Cloud SQL connection
7. Test deployment

## Configuration Features

### Automatic Environment Detection
- **Development**: Uses `env.local` file
- **Production**: Uses `env.gcp` file
- **Fallback**: Uses environment variables

### Database Connection Management
- **Local**: Direct TCP connection to localhost
- **GCP**: Unix socket via Cloud SQL Proxy
- **Pooling**: Optimized for each environment
- **Health Checks**: Built-in connection monitoring

### Redis Connection Management
- **Local**: Direct connection to localhost
- **GCP**: VPC peering to MemoryStore
- **Reconnection**: Automatic retry with exponential backoff
- **Health Checks**: Built-in connection monitoring

### Security Features
- **Environment Variables**: Sensitive data via env vars
- **SSL/TLS**: Enabled for production connections
- **Authentication**: JWT + Firebase Auth
- **Rate Limiting**: Configurable per environment

## Monitoring & Logging

### Health Checks
- **Database**: Connection pool status
- **Redis**: Latency and memory usage
- **Overall**: Service availability

### Logging
- **Local**: Console + file logging
- **GCP**: Google Cloud Logging integration
- **Levels**: Debug (dev) / Info (prod)

### Metrics
- **Database**: Pool statistics, query performance
- **Redis**: Connection status, memory usage
- **API**: Request/response times, error rates

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check Cloud SQL instance is running
   - Verify Cloud SQL Proxy is configured
   - Check network connectivity

2. **Redis Connection Failed**
   - Verify MemoryStore instance is running
   - Check VPC peering configuration
   - Verify Redis password

3. **Configuration Not Loading**
   - Check environment file exists
   - Verify file permissions
   - Check environment variable names

### Debug Commands

```bash
# Test configuration loading
NODE_ENV=development node -e "const config = require('./src/config/gcpConfig'); console.log(config.getEnvironmentInfo());"

# Test database connection
NODE_ENV=development node -e "const db = require('./src/config/gcpDatabase'); db.initialize().then(() => console.log('DB OK')).catch(console.error);"

# Test Redis connection
NODE_ENV=development node -e "const redis = require('./src/config/gcpRedis'); redis.initialize().then(() => console.log('Redis OK')).catch(console.error);"
```

## Security Considerations

### Production Security
- **Secrets**: Stored in GCP Secret Manager
- **Network**: VPC peering for internal communication
- **SSL**: All connections encrypted
- **Authentication**: Multi-factor authentication
- **Monitoring**: Comprehensive audit logging

### Development Security
- **Local Secrets**: Stored in `.env.local` (not committed)
- **Network**: Localhost only
- **SSL**: Disabled for local development
- **Authentication**: JWT-only mode

## Next Steps

1. **Set up GCP Project**: Create project and enable APIs
2. **Configure Secrets**: Set up Secret Manager
3. **Deploy Infrastructure**: Cloud SQL, MemoryStore, Cloud Run
4. **Deploy Application**: Use deployment script
5. **Monitor**: Set up monitoring and alerting
6. **Test**: Run comprehensive tests

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review GCP documentation
3. Check application logs
4. Run diagnostic scripts
