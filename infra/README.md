# Flow Infrastructure

This directory contains all infrastructure-related files for deploying Flow to Google Cloud Platform.

## Directory Structure

```
infra/
├── cloudbuild/           # Cloud Build configurations
│   └── deploy-api.yaml   # API deployment pipeline
├── terraform/            # Infrastructure as Code
│   ├── main.tf          # Main Terraform configuration
│   ├── variables.tf     # Terraform variables
│   └── outputs.tf       # Terraform outputs
├── scripts/              # Deployment and setup scripts
│   ├── setup-gcp.sh     # GCP infrastructure setup
│   ├── deploy.sh        # API deployment script
│   └── smoke-test.sh    # Smoke testing script
├── monitoring/           # Monitoring configurations
│   └── alert-policy.yaml # Cloud Monitoring alert policies
└── README.md            # This file
```

## Quick Start

### 1. Prerequisites

- Google Cloud SDK installed and configured
- Docker installed
- Node.js 20+ installed
- Appropriate GCP permissions

### 2. Setup Infrastructure

```bash
# Set environment variables
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export ENVIRONMENT="production"

# Run automated setup
./scripts/setup-gcp.sh
```

### 3. Deploy Application

```bash
# Set deployment variables
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export SERVICE_NAME="flow-api"
export ENVIRONMENT="production"

# Deploy to Cloud Run
./scripts/deploy.sh
```

### 4. Run Smoke Tests

```bash
# Set service URL
export SERVICE_URL="https://your-service-url"

# Run smoke tests
./scripts/smoke-test.sh
```

## Infrastructure Components

### Cloud Run
- **Service**: `flow-api`
- **Region**: `us-central1`
- **Scaling**: 0-20 instances (production), 0-5 instances (staging)
- **Resources**: 2 CPU, 2Gi memory (production), 1 CPU, 1Gi memory (staging)

### Cloud SQL
- **Instance**: `flow-db-production`
- **Engine**: PostgreSQL 15
- **Tier**: `db-f1-micro`
- **Storage**: 20GB SSD with auto-increase
- **Backup**: Daily backups with point-in-time recovery

### MemoryStore Redis
- **Instance**: `flow-redis-production`
- **Version**: Redis 7.0
- **Memory**: 1GB (staging), 4GB (production)
- **Tier**: Basic (staging), Standard HA (production)

### Artifact Registry
- **Repository**: `flow-repo`
- **Format**: Docker
- **Location**: `us-central1`

### Secret Manager
- `database-url`: Database connection string
- `redis-host`: Redis host address
- `redis-password`: Redis authentication string
- `jwt-secret`: JWT signing secret
- `firebase-project-id`: Firebase project ID
- `firebase-private-key`: Firebase Admin SDK private key
- `firebase-client-email`: Firebase Admin SDK client email

### VPC Network
- **Network**: `flow-vpc-production`
- **Subnet**: `flow-subnet-production` (10.0.0.0/24)
- **Connector**: `flow-connector-production`

### Cloud Storage
- **Bucket**: `flow-assets-production-*`
- **Purpose**: Static assets, avatars, media files
- **Lifecycle**: Automatic cleanup of old files

## Deployment Strategies

### Manual Deployment

1. **Build and Push Image**
   ```bash
   cd services/api
   docker build -t us-central1-docker.pkg.dev/PROJECT_ID/flow-repo/flow-api:latest .
   docker push us-central1-docker.pkg.dev/PROJECT_ID/flow-repo/flow-api:latest
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy flow-api \
     --image us-central1-docker.pkg.dev/PROJECT_ID/flow-repo/flow-api:latest \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated
   ```

### Automated Deployment

Use the deployment script for a complete deployment:

```bash
./scripts/deploy.sh
```

### CI/CD Pipeline

The GitHub Actions workflow automatically:
1. Runs tests and linting
2. Builds and pushes Docker images
3. Deploys to staging environment
4. Runs smoke tests
5. Deploys to production (on release)
6. Performs security scanning
7. Runs performance tests

## Monitoring and Alerting

### Cloud Monitoring
- **Uptime Checks**: Health endpoint monitoring
- **Alert Policies**: Service down, high error rate, high response time
- **Custom Metrics**: Application-specific metrics

### Cloud Logging
- **Application Logs**: Automatically collected from Cloud Run
- **Access Logs**: HTTP request/response logs
- **Error Logs**: Unhandled exceptions and errors

### Error Reporting
- **Automatic Error Collection**: Unhandled exceptions
- **Error Grouping**: Similar errors grouped together
- **Error Trends**: Error rate over time

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

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   ```bash
   gcloud run services logs tail flow-api --region us-central1
   ```

2. **Database Connection Issues**
   ```bash
   gcloud sql instances describe flow-db-production
   ```

3. **Secret Access Issues**
   ```bash
   gcloud secrets list
   gcloud projects get-iam-policy PROJECT_ID
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
docker run -p 8080:8080 us-central1-docker.pkg.dev/PROJECT_ID/flow-repo/flow-api:latest
```

## Cost Optimization

### Resource Sizing
- **Right-size Instances**: Monitor usage and adjust
- **Auto-scaling**: Scale to zero when not in use
- **Reserved Instances**: For predictable workloads

### Storage Optimization
- **Lifecycle Policies**: Automatic deletion of old data
- **Compression**: Enable compression for stored data
- **Cleanup Jobs**: Regular cleanup of temporary data

## Environment Management

### Staging Environment
- **Purpose**: Testing and development
- **Resources**: Smaller instance sizes
- **Scaling**: 0-5 instances
- **Database**: Separate staging database
- **Redis**: Separate staging Redis instance

### Production Environment
- **Purpose**: Live application
- **Resources**: Production-sized instances
- **Scaling**: 1-20 instances
- **Database**: Production database with backups
- **Redis**: High availability Redis

## Maintenance

### Regular Tasks
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

## Support

For infrastructure-related issues:
- Create a GitHub issue
- Check the [Deployment Documentation](../docs/DEPLOYMENT.md)
- Review the [Troubleshooting Guide](../docs/DEPLOYMENT.md#troubleshooting)

## Contributing

When making changes to infrastructure:
1. Test changes in staging environment first
2. Update documentation
3. Create pull request with detailed description
4. Ensure all tests pass
5. Get approval from infrastructure team
