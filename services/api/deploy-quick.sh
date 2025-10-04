#!/bin/bash

# 🚀 Quick GCP Deployment Script for Flow API
# This script deploys the API to GCP Cloud Run and provides the URL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Flow API to GCP Cloud Run...${NC}"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install Google Cloud SDK first.${NC}"
    echo -e "${BLUE}📥 Install from: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Not authenticated with gcloud. Please run: gcloud auth login${NC}"
    exit 1
fi

# Set project and region
PROJECT_ID="quick-doodad-472200-k0"
REGION="us-central1"
SERVICE_NAME="flow-api"

echo -e "${BLUE}📋 Project: ${PROJECT_ID}${NC}"
echo -e "${BLUE}📋 Region: ${REGION}${NC}"
echo -e "${BLUE}📋 Service: ${SERVICE_NAME}${NC}"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${BLUE}📋 Enabling required GCP APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Build and deploy
echo -e "${BLUE}🏗️ Building and deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 20 \
    --concurrency 100 \
    --set-env-vars NODE_ENV=production \
    --timeout 300

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Service URL: ${SERVICE_URL}${NC}"

# Test the deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"
if curl -f "${SERVICE_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is responding correctly${NC}"
else
    echo -e "${YELLOW}⚠️ API health check failed${NC}"
fi

echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "${BLUE}1. Update mobile app API URL to: ${SERVICE_URL}/v1${NC}"
echo -e "${BLUE}2. Test Firebase authentication${NC}"
echo -e "${BLUE}3. Monitor logs: gcloud run services logs read ${SERVICE_NAME} --region=${REGION}${NC}"

echo -e "${GREEN}🎯 Ready to test with mobile app!${NC}"
