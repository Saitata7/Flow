# Flow API - GCP Cloud Run Deployment Guide

This guide covers deploying the Flow API to Google Cloud Platform using Cloud Run, Cloud SQL, and MemoryStore.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web App       │    │   External API  │
│   (Firebase)    │    │   (React)       │    │   Consumers     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Cloud Run Service    │
                    │      (Flow API)          │
                    │   - Auto-scaling         │
                    │   - HTTPS endpoint       │
                    │   - Health checks        │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      Cloud SQL            │
                    │    (PostgreSQL 15)       │
                    │   - Managed database     │
                    │   - Automated backups    │
                    │   - High availability    │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     MemoryStore           │
                    │      (Redis 7)            │
                    │   - Caching layer        │
                    │   - Session storage      │
                    │   - Leaderboards         │
                    └───────────────────────────┘
```

## 📋 Prerequisites

1. **Google Cloud Project** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Docker** installed locally
4. **GitHub repository** with Actions enabled
5. **Firebase project** configured

## 🚀 Quick Deployment

### Step 1: Setup GCP Resources

Run the setup script to provision all necessary resources:

```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"

# Run the setup script
cd services/api
./scripts/setup-gcp-resources.sh
```

This script will create:
- ✅ Artifact Registry for container images
- ✅ Cloud SQL PostgreSQL instance
- ✅ MemoryStore Redis instance
- ✅ Secret Manager secrets
- ✅ Required IAM permissions

### Step 2: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

```bash
# GCP Configuration
GCP_PROJECT_ID=your-project-id
GCP_SA_KEY={"type":"service_account",...}  # Service Account JSON key
GCP_ARTIFACT_REGISTRY=flow-registry

# Database Configuration
DB_HOST=10.x.x.x  # Cloud SQL private IP
DB_NAME=flow
DB_USER=flow_user
DB_PASSWORD=generated-password

# Redis Configuration
REDIS_HOST=10.x.x.x  # MemoryStore private IP
REDIS_PASSWORD=generated-password

# Authentication
JWT_SECRET=generated-jwt-secret
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# API Configuration
VALID_API_KEYS=flow-api-key-xxxxx,flow-service-key-xxxxx
CORS_ORIGIN=https://flow.app,https://app.flow.com
```

### Step 3: Deploy via GitHub Actions

Push to the `main` branch to trigger automatic deployment:

```bash
git add .
git commit -m "Deploy Flow API to GCP Cloud Run"
git push origin main
```

The GitHub Actions workflow will:
1. ✅ Run tests and linting
2. ✅ Build Docker image
3. ✅ Push to Artifact Registry
4. ✅ Deploy to Cloud Run
5. ✅ Run database migrations
6. ✅ Perform health checks
7. ✅ Update API SDK configuration

## 🔧 Manual Deployment

### Build and Push Docker Image

```bash
# Build the image
docker build -t us-central1-docker.pkg.dev/PROJECT_ID/flow-registry/flow-api:latest .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/PROJECT_ID/flow-registry/flow-api:latest
```

### Deploy to Cloud Run

```bash
gcloud run deploy flow-api \
  --image us-central1-docker.pkg.dev/PROJECT_ID/flow-registry/flow-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars PORT=8080 \
  --set-env-vars DB_HOST=DB_HOST \
  --set-env-vars DB_NAME=flow \
  --set-env-vars DB_USER=flow_user \
  --set-env-vars DB_PASSWORD=DB_PASSWORD \
  --set-env-vars REDIS_HOST=REDIS_HOST \
  --set-env-vars REDIS_PASSWORD=REDIS_PASSWORD \
  --set-env-vars JWT_SECRET=JWT_SECRET \
  --set-env-vars FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID \
  --set-env-vars FIREBASE_PRIVATE_KEY="FIREBASE_PRIVATE_KEY" \
  --set-env-vars FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL \
  --set-env-vars AUTH_PROVIDER=firebase \
  --set-env-vars VALID_API_KEYS=VALID_API_KEYS \
  --set-env-vars CORS_ORIGIN=CORS_ORIGIN \
  --set-env-vars LOG_LEVEL=info
```

## 🔍 Monitoring and Health Checks

### Health Check Endpoint

The API provides comprehensive health checks:

```bash
curl https://your-service-url/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected",
  "memory": {
    "used": "45MB",
    "free": "203MB"
  }
}
```

### Cloud Run Metrics

Monitor your service in the GCP Console:
- **Request Count**: Number of requests per second
- **Request Latency**: Response time percentiles
- **Error Rate**: Percentage of failed requests
- **Instance Count**: Number of running instances
- **CPU Utilization**: CPU usage percentage
- **Memory Utilization**: Memory usage percentage

### Logging

View logs in Cloud Logging:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=flow-api" --limit 50
```

## 🔐 Security Configuration

### IAM Roles

The service account needs these roles:
- `Cloud Run Developer`
- `Cloud SQL Client`
- `Redis Instance Admin`
- `Secret Manager Secret Accessor`
- `Artifact Registry Reader`

### Network Security

- Cloud SQL uses private IP (VPC peering)
- MemoryStore uses private IP (VPC peering)
- Cloud Run uses HTTPS only
- CORS configured for specific origins

### Secrets Management

All sensitive data stored in Secret Manager:
- Database credentials
- JWT secrets
- Firebase keys
- API keys

## 📊 Performance Optimization

### Auto-scaling Configuration

```yaml
min-instances: 0      # Scale to zero when not in use
max-instances: 5      # Maximum concurrent instances
concurrency: 80      # Requests per instance
cpu: 1               # 1 vCPU per instance
memory: 1Gi          # 1GB RAM per instance
```

### Caching Strategy

- **Redis Cache**: Leaderboards, user stats, flow data
- **TTL**: 1 hour for user data, 24 hours for leaderboards
- **Cache Invalidation**: On data updates

### Database Optimization

- **Connection Pooling**: Knex.js connection pool
- **Indexes**: Optimized for common queries
- **Read Replicas**: For read-heavy workloads (optional)

## 🚨 Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   # Check logs
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=flow-api" --limit 20
   ```

2. **Database connection failed**
   ```bash
   # Test database connectivity
   gcloud sql connect flow-db --user=flow_user --database=flow
   ```

3. **Redis connection failed**
   ```bash
   # Check Redis instance status
   gcloud redis instances describe flow-redis --region=us-central1
   ```

4. **Authentication errors**
   ```bash
   # Verify Firebase configuration
   gcloud secrets versions access latest --secret=firebase-project-id
   ```

### Debug Commands

```bash
# Get service URL
gcloud run services describe flow-api --region=us-central1 --format='value(status.url)'

# Check service status
gcloud run services describe flow-api --region=us-central1

# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=flow-api" --limit 10

# Test health endpoint
curl https://your-service-url/health
```

## 🔄 CI/CD Pipeline

The GitHub Actions workflow includes:

1. **Testing**: ESLint, Jest tests, coverage
2. **Security**: Trivy vulnerability scanning
3. **Building**: Docker image creation
4. **Deployment**: Cloud Run service update
5. **Migrations**: Database schema updates
6. **Health Checks**: Service validation
7. **Notifications**: Slack/email alerts

### Workflow Triggers

- **Push to main**: Full deployment
- **Pull Request**: Testing only
- **Manual**: Workflow dispatch

## 📈 Scaling Considerations

### Horizontal Scaling

- Cloud Run automatically scales based on traffic
- Configure min/max instances based on usage patterns
- Use Cloud Load Balancer for multiple regions

### Vertical Scaling

- Increase CPU/memory for compute-intensive operations
- Monitor resource utilization and adjust accordingly
- Consider Cloud Run Jobs for batch processing

### Database Scaling

- Enable read replicas for read-heavy workloads
- Use connection pooling to manage connections
- Monitor query performance and optimize indexes

## 💰 Cost Optimization

### Cloud Run

- Use min-instances=0 to scale to zero
- Optimize concurrency settings
- Monitor request patterns

### Cloud SQL

- Use appropriate machine types
- Enable automated backups
- Consider committed use discounts

### MemoryStore

- Right-size Redis instances
- Monitor memory usage
- Use appropriate Redis versions

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [MemoryStore Documentation](https://cloud.google.com/memorystore/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
