#!/bin/bash

# 🚀 Flow API GCP Deployment Script
# This script deploys the Flow API to Google Cloud Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="flow-api"
ARTIFACT_REGISTRY=${GCP_ARTIFACT_REGISTRY:-"flow-registry"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo -e "${BLUE}🚀 Deploying Flow API to GCP Cloud Run...${NC}"
echo -e "${BLUE}Project ID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}Service: ${SERVICE_NAME}${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️ Not authenticated with gcloud. Please run: gcloud auth login${NC}"
    exit 1
fi

# Set the project
echo -e "${BLUE}📋 Setting project to ${PROJECT_ID}...${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${BLUE}📋 Enabling required GCP APIs...${NC}"
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Create Artifact Registry if it doesn't exist
echo -e "${BLUE}📦 Creating Artifact Registry...${NC}"
if ! gcloud artifacts repositories describe ${ARTIFACT_REGISTRY} --location=${REGION} &> /dev/null; then
    gcloud artifacts repositories create ${ARTIFACT_REGISTRY} \
        --repository-format=docker \
        --location=${REGION} \
        --description="Flow API Docker images"
    echo -e "${GREEN}✅ Artifact Registry created${NC}"
else
    echo -e "${GREEN}✅ Artifact Registry already exists${NC}"
fi

# Configure Docker authentication
echo -e "${BLUE}🐳 Configuring Docker authentication...${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build Docker image
echo -e "${BLUE}🔨 Building Docker image...${NC}"
cd "$(dirname "$0")/.."
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG} .

# Push Docker image
echo -e "${BLUE}📤 Pushing Docker image...${NC}"
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG}

# Deploy to Cloud Run with optimized configuration
echo -e "${BLUE}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --concurrency 80 \
    --timeout 300 \
    --execution-environment gen2 \
    --cpu-throttling \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8080 \
    --set-env-vars HOST=0.0.0.0 \
    --set-env-vars LOG_LEVEL=info \
    --set-env-vars NODE_OPTIONS=--max-old-space-size=512 \
    --set-env-vars AUTH_PROVIDER=firebase \
    --set-env-vars CORS_ORIGIN=https://flow.app,https://app.flow.com,https://flow-mobile.app

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🚀 Service URL: ${SERVICE_URL}${NC}"
echo -e "${GREEN}📚 API Documentation: ${SERVICE_URL}/docs${NC}"
echo -e "${GREEN}🔍 Health Check: ${SERVICE_URL}/health${NC}"

# Test health endpoint
echo -e "${BLUE}🔍 Testing health endpoint...${NC}"
sleep 10  # Wait for service to be ready

if curl -f "${SERVICE_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${YELLOW}⚠️ Health check failed. Service may still be starting up.${NC}"
    echo -e "${YELLOW}Please check the service logs: gcloud run services logs read ${SERVICE_NAME} --region=${REGION}${NC}"
fi

echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}1. Set up environment variables in Cloud Run console${NC}"
echo -e "${BLUE}2. Configure database connection${NC}"
echo -e "${BLUE}3. Run database migrations${NC}"
echo -e "${BLUE}4. Test API endpoints${NC}"
echo -e "${BLUE}5. Update mobile app with production URL${NC}"

echo -e "${GREEN}🎯 Deployment script completed!${NC}"
