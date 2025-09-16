#!/bin/bash

# Setup script for Google Cloud Platform infrastructure
# This script sets up the necessary GCP resources for Flow deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-"flow-project"}
REGION=${REGION:-"us-central1"}
ZONE=${ZONE:-"us-central1-a"}
ENVIRONMENT=${ENVIRONMENT:-"production"}

echo -e "${BLUE}🚀 Setting up GCP infrastructure for Flow${NC}"
echo -e "${BLUE}Project ID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  You are not authenticated with gcloud. Please run:${NC}"
    echo "gcloud auth login"
    exit 1
fi

# Set the project
echo -e "${BLUE}📋 Setting project to ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${BLUE}🔧 Enabling required APIs${NC}"
APIS=(
    "run.googleapis.com"
    "sqladmin.googleapis.com"
    "redis.googleapis.com"
    "secretmanager.googleapis.com"
    "artifactregistry.googleapis.com"
    "cloudbuild.googleapis.com"
    "logging.googleapis.com"
    "monitoring.googleapis.com"
    "clouderrorreporting.googleapis.com"
    "cloudscheduler.googleapis.com"
    "storage.googleapis.com"
    "iam.googleapis.com"
    "compute.googleapis.com"
    "vpcaccess.googleapis.com"
)

for api in "${APIS[@]}"; do
    echo -e "${YELLOW}  Enabling ${api}${NC}"
    gcloud services enable ${api}
done

# Create Artifact Registry repository
echo -e "${BLUE}📦 Creating Artifact Registry repository${NC}"
gcloud artifacts repositories create flow-repo \
    --repository-format=docker \
    --location=${REGION} \
    --description="Docker repository for Flow application images" \
    --quiet || echo "Repository already exists"

# Create VPC network
echo -e "${BLUE}🌐 Creating VPC network${NC}"
gcloud compute networks create flow-vpc-${ENVIRONMENT} \
    --subnet-mode=custom \
    --bgp-routing-mode=regional \
    --quiet || echo "Network already exists"

# Create subnet
echo -e "${BLUE}🔗 Creating subnet${NC}"
gcloud compute networks subnets create flow-subnet-${ENVIRONMENT} \
    --network=flow-vpc-${ENVIRONMENT} \
    --range=10.0.0.0/24 \
    --region=${REGION} \
    --enable-private-ip-google-access \
    --quiet || echo "Subnet already exists"

# Create VPC connector
echo -e "${BLUE}🔌 Creating VPC connector${NC}"
gcloud compute networks vpc-access connectors create flow-connector-${ENVIRONMENT} \
    --region=${REGION} \
    --subnet=flow-subnet-${ENVIRONMENT} \
    --subnet-project=${PROJECT_ID} \
    --min-instances=2 \
    --max-instances=3 \
    --quiet || echo "VPC connector already exists"

# Create Cloud SQL instance
echo -e "${BLUE}🗄️  Creating Cloud SQL instance${NC}"
gcloud sql instances create flow-db-${ENVIRONMENT} \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=${REGION} \
    --storage-type=SSD \
    --storage-size=20GB \
    --storage-auto-increase \
    --backup-start-time=03:00 \
    --enable-point-in-time-recovery \
    --retained-backups-count=30 \
    --network=projects/${PROJECT_ID}/global/networks/flow-vpc-${ENVIRONMENT} \
    --no-assign-ip \
    --require-ssl \
    --quiet || echo "Cloud SQL instance already exists"

# Create database
echo -e "${BLUE}📊 Creating database${NC}"
gcloud sql databases create flow_${ENVIRONMENT} \
    --instance=flow-db-${ENVIRONMENT} \
    --quiet || echo "Database already exists"

# Create database user
echo -e "${BLUE}👤 Creating database user${NC}"
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users create flow_user \
    --instance=flow-db-${ENVIRONMENT} \
    --password=${DB_PASSWORD} \
    --quiet || echo "Database user already exists"

# Create Redis instance
echo -e "${BLUE}🔴 Creating Redis instance${NC}"
gcloud redis instances create flow-redis-${ENVIRONMENT} \
    --size=1 \
    --region=${REGION} \
    --network=projects/${PROJECT_ID}/global/networks/flow-vpc-${ENVIRONMENT} \
    --redis-version=redis_7_0 \
    --quiet || echo "Redis instance already exists"

# Create Cloud Storage bucket
echo -e "${BLUE}🪣 Creating Cloud Storage bucket${NC}"
BUCKET_NAME="flow-assets-${ENVIRONMENT}-$(date +%s)"
gsutil mb -p ${PROJECT_ID} -c STANDARD -l ${REGION} gs://${BUCKET_NAME} || echo "Bucket creation failed or already exists"

# Create service account
echo -e "${BLUE}🔐 Creating service account${NC}"
gcloud iam service-accounts create flow-service-${ENVIRONMENT} \
    --display-name="Flow Service Account" \
    --description="Service account for Flow Cloud Run service" \
    --quiet || echo "Service account already exists"

# Grant permissions to service account
echo -e "${BLUE}🔑 Granting permissions to service account${NC}"
SERVICE_ACCOUNT="flow-service-${ENVIRONMENT}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/cloudsql.client" \
    --quiet || echo "Permission already granted"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet || echo "Permission already granted"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/storage.objectViewer" \
    --quiet || echo "Permission already granted"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/logging.logWriter" \
    --quiet || echo "Permission already granted"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/monitoring.metricWriter" \
    --quiet || echo "Permission already granted"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/errorreporting.writer" \
    --quiet || echo "Permission already granted"

# Create secrets
echo -e "${BLUE}🔒 Creating secrets${NC}"

# Database URL secret
DB_URL="postgresql://flow_user:${DB_PASSWORD}@$(gcloud sql instances describe flow-db-${ENVIRONMENT} --format='value(ipAddresses[0].ipAddress)'):5432/flow_${ENVIRONMENT}?sslmode=require"
echo -n "${DB_URL}" | gcloud secrets create database-url-${ENVIRONMENT} --data-file=- --quiet || echo "Secret already exists"

# Redis host secret
REDIS_HOST=$(gcloud redis instances describe flow-redis-${ENVIRONMENT} --region=${REGION} --format='value(host)')
echo -n "${REDIS_HOST}" | gcloud secrets create redis-host-${ENVIRONMENT} --data-file=- --quiet || echo "Secret already exists"

# Redis password secret
REDIS_PASSWORD=$(gcloud redis instances describe flow-redis-${ENVIRONMENT} --region=${REGION} --format='value(authString)')
echo -n "${REDIS_PASSWORD}" | gcloud secrets create redis-password-${ENVIRONMENT} --data-file=- --quiet || echo "Secret already exists"

# JWT secret
JWT_SECRET=$(openssl rand -base64 64)
echo -n "${JWT_SECRET}" | gcloud secrets create jwt-secret-${ENVIRONMENT} --data-file=- --quiet || echo "Secret already exists"

# Firebase project ID secret
echo -n "${PROJECT_ID}" | gcloud secrets create firebase-project-id-${ENVIRONMENT} --data-file=- --quiet || echo "Secret already exists"

# Create Cloud Build trigger
echo -e "${BLUE}⚡ Creating Cloud Build trigger${NC}"
gcloud builds triggers create github \
    --repo-name=flow \
    --repo-owner=$(git config user.name) \
    --branch-pattern="^main$" \
    --build-config=infra/cloudbuild/deploy-api.yaml \
    --substitutions=_REGION=${REGION},_ARTIFACT_REGISTRY_REPO=flow-repo,_CLOUD_SQL_INSTANCE=flow-db-${ENVIRONMENT} \
    --quiet || echo "Build trigger already exists"

echo ""
echo -e "${GREEN}✅ GCP infrastructure setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "  Project ID: ${PROJECT_ID}"
echo -e "  Region: ${REGION}"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  Service Account: ${SERVICE_ACCOUNT}"
echo -e "  Database: flow-db-${ENVIRONMENT}"
echo -e "  Redis: flow-redis-${ENVIRONMENT}"
echo -e "  Artifact Registry: flow-repo"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo -e "  1. Add Firebase Admin SDK secrets to Secret Manager"
echo -e "  2. Configure GitHub Actions secrets"
echo -e "  3. Run database migrations"
echo -e "  4. Deploy the application"
echo ""
echo -e "${BLUE}🔗 Useful commands:${NC}"
echo -e "  View secrets: gcloud secrets list"
echo -e "  View services: gcloud run services list"
echo -e "  View databases: gcloud sql instances list"
echo -e "  View Redis: gcloud redis instances list"
