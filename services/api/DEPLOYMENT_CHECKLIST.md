# 🚀 Flow API GCP Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. GCP Project Configuration
- [ ] Create GCP project with billing enabled
- [ ] Enable required APIs (Cloud Run, Cloud SQL, MemoryStore, Artifact Registry)
- [ ] Create service account with necessary permissions
- [ ] Download service account JSON key

### 2. Firebase Configuration
- [ ] Create Firebase project
- [ ] Enable Authentication (Email/Password, Google, etc.)
- [ ] Generate Firebase Admin SDK credentials
- [ ] Configure authorized domains

### 3. GitHub Repository Setup
- [ ] Add GitHub repository secrets:
  - [ ] `GCP_PROJECT_ID`
  - [ ] `GCP_SA_KEY`
  - [ ] `GCP_ARTIFACT_REGISTRY`
  - [ ] `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - [ ] `REDIS_HOST`, `REDIS_PASSWORD`
  - [ ] `JWT_SECRET`
  - [ ] `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
  - [ ] `VALID_API_KEYS`
  - [ ] `CORS_ORIGIN`

## 🏗️ Infrastructure Provisioning

### 4. Run Setup Script
```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
cd services/api
./scripts/setup-gcp-resources.sh
```

- [ ] Artifact Registry created
- [ ] Cloud SQL PostgreSQL instance created
- [ ] MemoryStore Redis instance created
- [ ] Secrets created in Secret Manager
- [ ] Connection details noted

### 5. Database Setup
- [ ] Connect to Cloud SQL instance
- [ ] Run database migrations
- [ ] Verify tables created successfully
- [ ] Test database connectivity

## 🐳 Container Deployment

### 6. Docker Configuration
- [ ] Dockerfile optimized for Cloud Run
- [ ] Multi-stage build implemented
- [ ] Security best practices applied
- [ ] Health checks configured
- [ ] Port 8080 exposed

### 7. GitHub Actions Workflow
- [ ] Workflow file created (`.github/workflows/deploy-gcp.yml`)
- [ ] Tests and linting configured
- [ ] Docker build and push to Artifact Registry
- [ ] Cloud Run deployment configured
- [ ] Database migrations automated
- [ ] Health checks implemented

## 🚀 Deployment Execution

### 8. Deploy to Cloud Run
- [ ] Push to `main` branch triggers deployment
- [ ] GitHub Actions workflow runs successfully
- [ ] Docker image built and pushed
- [ ] Cloud Run service deployed
- [ ] Database migrations executed
- [ ] Health checks pass

### 9. Service Configuration
- [ ] Auto-scaling configured (min=0, max=5)
- [ ] Concurrency set to 80
- [ ] Memory: 1Gi, CPU: 1
- [ ] Timeout: 300s
- [ ] HTTPS endpoint available
- [ ] Environment variables set

## 🔍 Post-Deployment Verification

### 10. Health Checks
```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe flow-api --region=us-central1 --format='value(status.url)')

# Test health endpoint
curl $SERVICE_URL/health
```

- [ ] Health endpoint returns 200 OK
- [ ] Database connection status: connected
- [ ] Redis connection status: connected
- [ ] Service uptime and version info

### 11. API Testing
```bash
# Test API endpoints
curl $SERVICE_URL/
curl $SERVICE_URL/docs
curl $SERVICE_URL/v1/flows
```

- [ ] Root endpoint returns API info
- [ ] Swagger documentation accessible
- [ ] API endpoints respond correctly
- [ ] Authentication working (Firebase tokens)

### 12. Mobile App Integration
- [ ] Update mobile app with production API URL
- [ ] Test Firebase authentication flow
- [ ] Verify API calls from mobile app
- [ ] Test flow creation and entry tracking

## 📊 Monitoring and Logging

### 13. Cloud Run Monitoring
- [ ] Request metrics visible in GCP Console
- [ ] Error rates monitored
- [ ] Response time percentiles tracked
- [ ] Instance scaling monitored
- [ ] CPU and memory utilization tracked

### 14. Logging Configuration
- [ ] Structured JSON logging enabled
- [ ] Log levels configured (info for production)
- [ ] Request/response logging working
- [ ] Error tracking and alerting set up

### 15. Security Verification
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Authentication required for protected endpoints
- [ ] Secrets stored in Secret Manager

## 🔧 Performance Optimization

### 16. Caching Strategy
- [ ] Redis caching implemented
- [ ] Leaderboard data cached (24h TTL)
- [ ] User stats cached (1h TTL)
- [ ] Flow data cached (1h TTL)

### 17. Database Optimization
- [ ] Connection pooling configured
- [ ] Database indexes optimized
- [ ] Query performance monitored
- [ ] Read replicas considered (if needed)

## 🚨 Troubleshooting

### 18. Common Issues Check
- [ ] Service starts successfully
- [ ] Database connections stable
- [ ] Redis connections stable
- [ ] Firebase authentication working
- [ ] CORS configured for mobile app domains
- [ ] Rate limiting not blocking legitimate requests

### 19. Debug Tools
- [ ] Cloud Logging queries working
- [ ] Service status commands available
- [ ] Database connection testing tools
- [ ] Redis connection testing tools

## 📈 Scaling and Maintenance

### 20. Auto-scaling Configuration
- [ ] Min instances: 0 (scale to zero)
- [ ] Max instances: 5
- [ ] Concurrency: 80 requests per instance
- [ ] Scaling metrics monitored

### 21. Backup and Recovery
- [ ] Database automated backups enabled
- [ ] Backup retention policy configured
- [ ] Disaster recovery plan documented
- [ ] Data export procedures tested

## 🎯 Final Validation

### 22. End-to-End Testing
- [ ] Mobile app can authenticate with Firebase
- [ ] Mobile app can create flows
- [ ] Mobile app can log flow entries
- [ ] Mobile app can view statistics
- [ ] Web app can access API
- [ ] External API consumers can access endpoints

### 23. Performance Testing
- [ ] Load testing completed
- [ ] Response times acceptable (< 200ms)
- [ ] Error rates low (< 1%)
- [ ] Auto-scaling working correctly

### 24. Documentation
- [ ] Deployment guide updated
- [ ] API documentation accessible
- [ ] Monitoring dashboards configured
- [ ] Runbooks created for common issues

## 🎉 Deployment Complete!

Once all items are checked:
- [ ] **Production API URL**: `https://flow-api-xxxxx-uc.a.run.app`
- [ ] **API Documentation**: `https://flow-api-xxxxx-uc.a.run.app/docs`
- [ ] **Health Check**: `https://flow-api-xxxxx-uc.a.run.app/health`
- [ ] **Mobile app updated** with production URL
- [ ] **Monitoring and alerting** configured
- [ ] **Team notified** of successful deployment

---

## 📞 Support Contacts

- **DevOps Team**: devops@flow.app
- **API Team**: api@flow.app
- **Emergency**: +1-XXX-XXX-XXXX

## 🔗 Useful Links

- [GCP Console](https://console.cloud.google.com)
- [Cloud Run Service](https://console.cloud.google.com/run)
- [Cloud SQL Instances](https://console.cloud.google.com/sql)
- [MemoryStore Instances](https://console.cloud.google.com/memorystore)
- [Cloud Logging](https://console.cloud.google.com/logs)
- [GitHub Actions](https://github.com/your-org/flow/actions)
