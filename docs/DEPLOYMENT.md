# Flow Deployment Guide

This guide covers the complete deployment process for the Flow monorepo to Google Cloud Platform (GCP).

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
- [Deployment Process](#deployment-process)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Observability](#monitoring--observability)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

## Overview

Flow uses a modern, cloud-native deployment strategy on Google Cloud Platform:

- **API & Services**: Deployed to Cloud Run (containerized Node.js)
- **Database**: Cloud SQL PostgreSQL with private IP and SSL
- **Cache**: MemoryStore Redis for sessions and leaderboards
- **Storage**: Cloud Storage for avatars and media
- **Secrets**: Secret Manager for sensitive configuration
- **Monitoring**: Cloud Logging, Monitoring, and Error Reporting
- **CI/CD**: GitHub Actions with automated testing and deployment

## Prerequisites

### Required Tools

1. **Google Cloud SDK**
   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

2. **Docker**
   ```bash
   # Install Docker Desktop
   # Visit: https://www.docker.com/products/docker-desktop
   ```

3. **Terraform** (optional, for infrastructure as code)
   ```bash
   # Install Terraform
   brew install terraform  # macOS
   # or download from: https://www.terraform.io/downloads
   ```

4. **Node.js 20+**
   ```bash
   # Install Node.js
   brew install node  # macOS
   # or download from: https://nodejs.org/
   ```

### Required Permissions

Your GCP account needs the following roles:
- Project Owner or Editor
- Cloud Run Admin
- Cloud SQL Admin
- Secret Manager Admin
- Artifact Registry Admin
- Cloud Build Editor

## Infrastructure Setup

### Option 1: Automated Setup (Recommended)

Use our automated setup script:

```bash
# Set environment variables
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export ENVIRONMENT="production"

# Run setup script
./infra/scripts/setup-gcp.sh
```

### Option 2: Terraform (Infrastructure as Code)

```bash
# Navigate to terraform directory
cd infra/terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -var="project_id=your-project-id"

# Apply the configuration
terraform apply -var="project_id=your-project-id"
```

### Option 3: Manual Setup

Follow the [GCP Console Setup Guide](#gcp-console-setup) below.

### GCP Console Setup

1. **Create Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Note the Project ID

2. **Enable APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable sqladmin.googleapis.com
   gcloud services enable redis.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable logging.googleapis.com
   gcloud services enable monitoring.googleapis.com
   gcloud services enable clouderrorreporting.googleapis.com
   gcloud services enable cloudscheduler.googleapis.com
   gcloud services enable storage.googleapis.com
   gcloud services enable iam.googleapis.com
   gcloud services enable compute.googleapis.com
   gcloud services enable vpcaccess.googleapis.com
   ```

3. **Create Artifact Registry**
   ```bash
   gcloud artifacts repositories create flow-repo \
     --repository-format=docker \
     --location=us-central1 \
     --description="Docker repository for Flow application images"
   ```

4. **Create VPC Network**
   ```bash
   gcloud compute networks create flow-vpc-production \
     --subnet-mode=custom \
     --bgp-routing-mode=regional

   gcloud compute networks subnets create flow-subnet-production \
     --network=flow-vpc-production \
     --range=10.0.0.0/24 \
     --region=us-central1 \
     --enable-private-ip-google-access
   ```

5. **Create VPC Connector**
   ```bash
   gcloud compute networks vpc-access connectors create flow-connector-production \
     --region=us-central1 \
     --subnet=flow-subnet-production \
     --min-instances=2 \
     --max-instances=3
   ```

6. **Create Cloud SQL Instance**
   ```bash
   gcloud sql instances create flow-db-production \
     --database-version=POSTGRES_15 \
     --tier=db-f1-micro \
     --region=us-central1 \
     --storage-type=SSD \
     --storage-size=20GB \
     --storage-auto-increase \
     --backup-start-time=03:00 \
     --enable-point-in-time-recovery \
     --retained-backups-count=30 \
     --network=projects/YOUR_PROJECT_ID/global/networks/flow-vpc-production \
     --no-assign-ip \
     --require-ssl
   ```

7. **Create Database and User**
   ```bash
   gcloud sql databases create flow_production \
     --instance=flow-db-production

   gcloud sql users create flow_user \
     --instance=flow-db-production \
     --password=YOUR_SECURE_PASSWORD
   ```

8. **Create Redis Instance**
   ```bash
   gcloud redis instances create flow-redis-production \
     --size=1 \
     --region=us-central1 \
     --network=projects/YOUR_PROJECT_ID/global/networks/flow-vpc-production \
     --redis-version=redis_7_0
   ```

9. **Create Service Account**
   ```bash
   gcloud iam service-accounts create flow-service-production \
     --display-name="Flow Service Account" \
     --description="Service account for Flow Cloud Run service"
   ```

10. **Grant Permissions**
    ```bash
    SERVICE_ACCOUNT="flow-service-production@YOUR_PROJECT_ID.iam.gserviceaccount.com"
    
    gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/cloudsql.client"
    
    gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/secretmanager.secretAccessor"
    
    gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/storage.objectViewer"
    
    gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/logging.logWriter"
    
    gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/monitoring.metricWriter"
    
    gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/errorreporting.writer"
    ```

11. **Create Secrets**
    ```bash
    # Database URL
    echo -n "postgresql://flow_user:YOUR_PASSWORD@PRIVATE_IP:5432/flow_production?sslmode=require" | \
      gcloud secrets create database-url --data-file=-
    
    # Redis Host
    echo -n "REDIS_HOST_IP" | gcloud secrets create redis-host --data-file=-
    
    # Redis Password
    echo -n "REDIS_AUTH_STRING" | gcloud secrets create redis-password --data-file=-
    
    # JWT Secret
    echo -n "YOUR_JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
    
    # Firebase Project ID
    echo -n "YOUR_PROJECT_ID" | gcloud secrets create firebase-project-id --data-file=-
    
    # Firebase Private Key
    echo -n "YOUR_FIREBASE_PRIVATE_KEY" | gcloud secrets create firebase-private-key --data-file=-
    
    # Firebase Client Email
    echo -n "YOUR_FIREBASE_CLIENT_EMAIL" | gcloud secrets create firebase-client-email --data-file=-
    ```

## Deployment Process

### Manual Deployment

1. **Build and Push Docker Image**
   ```bash
   # Navigate to API service directory
   cd services/api
   
   # Build Docker image
   docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/flow-repo/flow-api:latest .
   
   # Push to Artifact Registry
   docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/flow-repo/flow-api:latest
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy flow-api \
     --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/flow-repo/flow-api:latest \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --port 8080 \
     --memory 2Gi \
     --cpu 2 \
     --min-instances 1 \
     --max-instances 20 \
     --concurrency 80 \
     --timeout 300 \
     --set-env-vars NODE_ENV=production,PORT=8080,HOST=0.0.0.0 \
     --set-secrets DATABASE_URL=database-url:latest,REDIS_HOST=redis-host:latest,REDIS_PASSWORD=redis-password:latest,JWT_SECRET=jwt-secret:latest,FIREBASE_PROJECT_ID=firebase-project-id:latest,FIREBASE_PRIVATE_KEY=firebase-private-key:latest,FIREBASE_CLIENT_EMAIL=firebase-client-email:latest \
     --set-cloudsql-instances YOUR_PROJECT_ID:us-central1:flow-db-production \
     --service-account flow-service-production@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

3. **Run Database Migrations**
   ```bash
   # Create migration job
   gcloud run jobs create flow-api-migrate \
     --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/flow-repo/flow-api:latest \
     --region us-central1 \
     --set-env-vars NODE_ENV=production \
     --set-secrets DATABASE_URL=database-url:latest \
     --set-cloudsql-instances YOUR_PROJECT_ID:us-central1:flow-db-production \
     --command node \
     --args migrations/migrate.js \
     --max-retries 3 \
     --parallelism 1 \
     --task-count 1 \
     --service-account flow-service-production@YOUR_PROJECT_ID.iam.gserviceaccount.com
   
   # Execute migration job
   gcloud run jobs execute flow-api-migrate --region us-central1 --wait
   ```

4. **Run Smoke Tests**
   ```bash
   # Get service URL
   SERVICE_URL=$(gcloud run services describe flow-api --region us-central1 --format='value(status.url)')
   
   # Test health endpoint
   curl -f "${SERVICE_URL}/health"
   
   # Test API documentation
   curl -f "${SERVICE_URL}/docs"
   
   # Test OpenAPI spec
   curl -f "${SERVICE_URL}/openapi.json"
   ```

### Automated Deployment Script

Use our deployment script for easier deployment:

```bash
# Set environment variables
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export SERVICE_NAME="flow-api"
export ENVIRONMENT="production"
export IMAGE_TAG="latest"

# Run deployment script
./infra/scripts/deploy.sh
```

## CI/CD Pipeline

### GitHub Actions Setup

1. **Create Service Account Key**
   ```bash
   gcloud iam service-accounts keys create gcp-key.json \
     --iam-account flow-service-production@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

2. **Add GitHub Secrets**
   Go to your GitHub repository → Settings → Secrets and variables → Actions
   
   Add the following secrets:
   - `GCP_PROJECT_ID`: Your GCP project ID
   - `GCP_SA_KEY`: Contents of the gcp-key.json file
   - `SLACK_WEBHOOK`: Slack webhook URL for notifications (optional)

3. **Configure Branch Protection**
   - Go to Settings → Branches
   - Add rule for `main` branch
   - Require status checks to pass before merging
   - Require branches to be up to date before merging

### Pipeline Stages

1. **Lint and Test**
   - ESLint and Prettier checks
   - Unit and integration tests
   - Type checking

2. **Build and Push**
   - Build Docker image
   - Push to Artifact Registry
   - Security scanning with Trivy

3. **Deploy to Staging**
   - Deploy to staging environment
   - Run database migrations
   - Execute smoke tests

4. **Deploy to Production** (on release)
   - Deploy to production environment
   - Run database migrations
   - Execute comprehensive smoke tests
   - Clean up old revisions

5. **Performance Testing**
   - Load testing against staging
   - Performance benchmarks

6. **Security Scanning**
   - Vulnerability scanning
   - Dependency audit

## Monitoring & Observability

### Cloud Logging

- **Application Logs**: Automatically collected from Cloud Run
- **Access Logs**: HTTP request/response logs
- **Error Logs**: Unhandled exceptions and errors

### Cloud Monitoring

- **Uptime Checks**: Health endpoint monitoring
- **Alert Policies**: Service down alerts
- **Custom Metrics**: Application-specific metrics

### Error Reporting

- **Automatic Error Collection**: Unhandled exceptions
- **Error Grouping**: Similar errors grouped together
- **Error Trends**: Error rate over time

### Setting Up Monitoring

1. **Create Uptime Check**
   ```bash
   gcloud monitoring uptime-checks create http \
     --hostname=YOUR_SERVICE_URL \
     --path=/health \
     --check-interval=60s \
     --timeout=10s
   ```

2. **Create Alert Policy**
   ```bash
   gcloud alpha monitoring policies create \
     --policy-from-file=monitoring/alert-policy.yaml
   ```

3. **View Logs**
   ```bash
   gcloud run services logs tail flow-api --region us-central1
   ```

## Security

### Network Security

- **Private IP**: Database and Redis use private IPs
- **VPC**: Services run in private VPC
- **SSL/TLS**: All connections encrypted
- **Firewall Rules**: Restrictive firewall rules

### Access Control

- **IAM**: Role-based access control
- **Service Accounts**: Least privilege principle
- **Secret Manager**: Encrypted secrets storage

### Data Protection

- **Encryption at Rest**: All data encrypted
- **Encryption in Transit**: TLS for all connections
- **Backup Encryption**: Database backups encrypted

### Security Best Practices

1. **Regular Updates**: Keep dependencies updated
2. **Security Scanning**: Automated vulnerability scanning
3. **Access Auditing**: Regular access reviews
4. **Secret Rotation**: Regular secret rotation

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check logs
   gcloud run services logs tail flow-api --region us-central1
   
   # Check service status
   gcloud run services describe flow-api --region us-central1
   ```

2. **Database Connection Issues**
   ```bash
   # Check Cloud SQL instance
   gcloud sql instances describe flow-db-production
   
   # Check VPC connector
   gcloud compute networks vpc-access connectors describe flow-connector-production --region us-central1
   ```

3. **Secret Access Issues**
   ```bash
   # Check service account permissions
   gcloud projects get-iam-policy YOUR_PROJECT_ID
   
   # Check secrets
   gcloud secrets list
   ```

4. **High Memory Usage**
   ```bash
   # Check memory usage
   gcloud run services describe flow-api --region us-central1
   
   # Scale up memory
   gcloud run services update flow-api --region us-central1 --memory 4Gi
   ```

### Debugging Commands

```bash
# View service details
gcloud run services describe flow-api --region us-central1

# View recent logs
gcloud run services logs read flow-api --region us-central1 --limit 100

# View revisions
gcloud run revisions list --service=flow-api --region us-central1

# Test service locally
docker run -p 8080:8080 us-central1-docker.pkg.dev/YOUR_PROJECT_ID/flow-repo/flow-api:latest
```

## Rollback Procedures

### Quick Rollback

1. **List Revisions**
   ```bash
   gcloud run revisions list --service=flow-api --region us-central1
   ```

2. **Rollback to Previous Revision**
   ```bash
   gcloud run services update-traffic flow-api \
     --to-revisions=REVISION_NAME=100 \
     --region us-central1
   ```

### Complete Rollback

1. **Redeploy Previous Version**
   ```bash
   # Build previous version
   docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/flow-repo/flow-api:previous .
   
   # Deploy previous version
   gcloud run deploy flow-api \
     --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/flow-repo/flow-api:previous \
     --region us-central1
   ```

2. **Database Rollback**
   ```bash
   # Restore from backup
   gcloud sql backups restore BACKUP_ID \
     --restore-instance=flow-db-production
   ```

### Emergency Procedures

1. **Disable Service**
   ```bash
   gcloud run services update flow-api \
     --region us-central1 \
     --max-instances 0
   ```

2. **Enable Maintenance Mode**
   ```bash
   gcloud run services update flow-api \
     --region us-central1 \
     --set-env-vars MAINTENANCE_MODE=true
   ```

## Performance Optimization

### Scaling Configuration

- **Min Instances**: 1 (production), 0 (staging)
- **Max Instances**: 20 (production), 5 (staging)
- **Concurrency**: 80 requests per instance
- **Memory**: 2Gi (production), 1Gi (staging)
- **CPU**: 2 (production), 1 (staging)

### Database Optimization

- **Connection Pooling**: Configured in application
- **Read Replicas**: For read-heavy workloads
- **Backup Strategy**: Daily backups with point-in-time recovery

### Caching Strategy

- **Redis**: Session storage and leaderboards
- **Cloud CDN**: Static asset caching
- **Application Caching**: In-memory caching for frequently accessed data

## Cost Optimization

### Resource Sizing

- **Right-size Instances**: Monitor usage and adjust
- **Auto-scaling**: Scale to zero when not in use
- **Reserved Instances**: For predictable workloads

### Storage Optimization

- **Lifecycle Policies**: Automatic deletion of old data
- **Compression**: Enable compression for stored data
- **Cleanup Jobs**: Regular cleanup of temporary data

## Support and Maintenance

### Regular Maintenance

- **Security Updates**: Monthly dependency updates
- **Backup Verification**: Weekly backup tests
- **Performance Reviews**: Monthly performance analysis
- **Cost Reviews**: Monthly cost optimization reviews

### Monitoring Checklist

- [ ] Service uptime > 99.9%
- [ ] Response time < 200ms (95th percentile)
- [ ] Error rate < 0.1%
- [ ] Database connections < 80% of limit
- [ ] Memory usage < 80% of limit
- [ ] Disk usage < 80% of limit

### Contact Information

- **Technical Issues**: Create GitHub issue
- **Security Issues**: Email security@flow.com
- **General Support**: Email support@flow.com

---

For more information, see:
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./API_USAGE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
