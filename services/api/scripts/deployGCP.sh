#!/bin/bash
# GCP Production Deployment Script
# Deploys the Flow API to Google Cloud Run with latest configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Updated for latest setup
PROJECT_ID="quick-doodad-472200-k0"
SERVICE_NAME="flow-api"
REGION="us-central1"
IMAGE_NAME="us-central1-docker.pkg.dev/${PROJECT_ID}/flow-registry/${SERVICE_NAME}"
REGISTRY_URL="us-central1-docker.pkg.dev"

echo -e "${BLUE}🚀 Starting GCP Production Deployment${NC}"
echo "================================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install Google Cloud SDK${NC}"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker${NC}"
    exit 1
fi

# Set project
echo -e "${YELLOW}📋 Setting GCP project to ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required GCP APIs${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com

# Configure Docker for Artifact Registry
echo -e "${YELLOW}🔧 Configuring Docker for Artifact Registry${NC}"
gcloud auth configure-docker ${REGISTRY_URL}

# Build Docker image with latest tag
echo -e "${YELLOW}🐳 Building Docker image${NC}"
docker build -t ${IMAGE_NAME}:latest .

# Push image to Artifact Registry
echo -e "${YELLOW}📤 Pushing image to Artifact Registry${NC}"
docker push ${IMAGE_NAME}:latest

# Deploy to Cloud Run with latest configuration
echo -e "${YELLOW}🚀 Deploying to Cloud Run${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME}:latest \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 300 \
    --concurrency 80 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars HOST=0.0.0.0 \
    --set-env-vars DB_HOST=34.63.78.153 \
    --set-env-vars DB_NAME=flow \
    --set-env-vars DB_USER=flow_user \
    --set-env-vars DB_PORT=5432 \
    --set-env-vars DB_SSL=false \
    --set-env-vars PGSSLMODE=disable \
    --set-env-vars DB_POOL_MIN=2 \
    --set-env-vars DB_POOL_MAX=10 \
    --set-env-vars DB_POOL_IDLE_TIMEOUT=10000 \
    --set-env-vars DB_POOL_CONNECTION_TIMEOUT=5000 \
    --set-secrets DB_PASSWORD=db-password:latest \
    --set-secrets REDIS_HOST=redis-host:latest \
    --set-secrets REDIS_PASSWORD=redis-password:latest \
    --set-secrets JWT_SECRET=jwt-secret:latest \
    --set-secrets FIREBASE_PROJECT_ID=firebase-project-id:latest \
    --set-secrets FIREBASE_PRIVATE_KEY=firebase-private-key:latest \
    --set-secrets FIREBASE_CLIENT_EMAIL=firebase-client-email:latest \
    --set-env-vars AUTH_PROVIDER=firebase \
    --set-env-vars ALLOW_UNAUTHENTICATED=true \
    --set-secrets VALID_API_KEYS=api-keys:latest \
    --set-secrets CORS_ORIGIN=cors-origin:latest \
    --set-env-vars LOG_LEVEL=info \
    --set-secrets SENDGRID_API_KEY=sendgrid-api-key:latest \
    --set-env-vars SMTP_FROM=noreply@flow.app \
    --set-env-vars FRONTEND_URL=https://flow.app

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Service URL: ${SERVICE_URL}${NC}"

# Test deployment
echo -e "${YELLOW}🧪 Testing deployment${NC}"
if curl -f -s ${SERVICE_URL}/health > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Set up Cloud SQL connection
echo -e "${YELLOW}🗄️ Setting up Cloud SQL connection${NC}"
gcloud run services update ${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --add-cloudsql-instances ${PROJECT_ID}:${REGION}:flow-postgres

# Set up MemoryStore connection
echo -e "${YELLOW}🔴 Setting up MemoryStore connection${NC}"
# Note: MemoryStore connection is handled via VPC peering
# The Redis host IP should be configured in environment variables

echo -e "${GREEN}🎉 GCP Production Deployment Complete!${NC}"
echo "================================================"
echo -e "${BLUE}Service URL: ${SERVICE_URL}${NC}"
echo -e "${BLUE}Project ID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}Service Name: ${SERVICE_NAME}${NC}"
echo "================================================"
