#!/bin/bash

# 🚀 Flow API Production Deployment Script
# Optimized for Google Cloud Run with proper secret management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"quick-doodad-472200-k0"}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="flow-api"
ARTIFACT_REGISTRY="flow-registry"
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo -e "${BLUE}🚀 Deploying Flow API to GCP Cloud Run (Production)${NC}"
echo -e "${BLUE}Project ID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}Service: ${SERVICE_NAME}${NC}"

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

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

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
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

# Build Docker image with optimizations
echo -e "${BLUE}🔨 Building optimized Docker image...${NC}"
cd "$(dirname "$0")/.."

# Build with BuildKit for better performance
export DOCKER_BUILDKIT=1
docker build \
    --build-arg NODE_ENV=production \
    --build-arg NODE_OPTIONS="--max-old-space-size=512" \
    -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG} \
    -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/${SERVICE_NAME}:latest \
    .

# Push Docker image
echo -e "${BLUE}📤 Pushing Docker image...${NC}"
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG}
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/${SERVICE_NAME}:latest

# Create secrets if they don't exist
echo -e "${BLUE}🔐 Setting up secrets...${NC}"

# Database secrets
echo -e "${BLUE}   Setting up database secrets...${NC}"
echo -n "/cloudsql/quick-doodad-472200-k0:us-central1:flow-prod" | gcloud secrets create db-host --data-file=- --replication-policy="automatic" 2>/dev/null || echo "db-host secret already exists"
echo -n "${DB_PASSWORD}" | gcloud secrets create db-password --data-file=- --replication-policy="automatic" 2>/dev/null || echo "db-password secret already exists"

# Redis secrets
echo -e "${BLUE}   Setting up Redis secrets...${NC}"
echo -n "10.58.145.227" | gcloud secrets create redis-host --data-file=- --replication-policy="automatic" 2>/dev/null || echo "redis-host secret already exists"
echo -n "" | gcloud secrets create redis-password --data-file=- --replication-policy="automatic" 2>/dev/null || echo "redis-password secret already exists"

# JWT secret
echo -e "${BLUE}   Setting up JWT secret...${NC}"
echo -n "${JWT_SECRET}" | gcloud secrets create jwt-secret --data-file=- --replication-policy="automatic" 2>/dev/null || echo "jwt-secret secret already exists"

# Firebase secrets
echo -e "${BLUE}   Setting up Firebase secrets...${NC}"
echo -n "quick-doodad-472200-k0" | gcloud secrets create firebase-project-id --data-file=- --replication-policy="automatic" 2>/dev/null || echo "firebase-project-id secret already exists"
echo -n "${FIREBASE_CLIENT_EMAIL}" | gcloud secrets create firebase-client-email --data-file=- --replication-policy="automatic" 2>/dev/null || echo "firebase-client-email secret already exists"

# API keys
echo -e "${BLUE}   Setting up API keys...${NC}"
echo -n "flow-prod-api-key-2024,flow-service-key-2024" | gcloud secrets create api-keys --data-file=- --replication-policy="automatic" 2>/dev/null || echo "api-keys secret already exists"

# CORS origin
echo -e "${BLUE}   Setting up CORS origin...${NC}"
echo -n "https://flow.app,https://app.flow.com,https://flow-mobile.app" | gcloud secrets create cors-origin --data-file=- --replication-policy="automatic" 2>/dev/null || echo "cors-origin secret already exists"

# Deploy to Cloud Run with secrets and optimized configuration
echo -e "${BLUE}🚀 Deploying to Cloud Run with production configuration...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --min-instances 0 \
    --max-instances 20 \
    --concurrency 100 \
    --timeout 300 \
    --execution-environment gen2 \
    --cpu-throttling \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8080 \
    --set-env-vars HOST=0.0.0.0 \
    --set-env-vars LOG_LEVEL=info \
    --set-env-vars NODE_OPTIONS=--max-old-space-size=1024 \
    --set-env-vars AUTH_PROVIDER=firebase \
    --set-env-vars DB_NAME=flow \
    --set-env-vars DB_USER=flow_user \
    --set-env-vars DB_PORT=5432 \
    --set-env-vars DB_SSL=true \
    --set-env-vars REDIS_PORT=6379 \
    --set-env-vars REDIS_DB=0 \
    --set-env-vars JWT_EXPIRES_IN=7d \
    --set-env-vars API_RATE_LIMIT_MAX=1000 \
    --set-env-vars API_RATE_LIMIT_WINDOW=60000 \
    --set-env-vars LOG_FORMAT=json \
    --set-env-vars CACHE_TTL_FLOW=3600 \
    --set-env-vars CACHE_TTL_USER=1800 \
    --set-env-vars CACHE_TTL_LEADERBOARD=86400 \
    --set-secrets DB_HOST=db-host:latest \
    --set-secrets DB_PASSWORD=db-password:latest \
    --set-secrets REDIS_HOST=redis-host:latest \
    --set-secrets REDIS_PASSWORD=redis-password:latest \
    --set-secrets JWT_SECRET=jwt-secret:latest \
    --set-secrets FIREBASE_PROJECT_ID=firebase-project-id:latest \
    --set-secrets FIREBASE_CLIENT_EMAIL=firebase-client-email:latest \
    --set-secrets VALID_API_KEYS=api-keys:latest \
    --set-secrets CORS_ORIGIN=cors-origin:latest

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🚀 Service URL: ${SERVICE_URL}${NC}"
echo -e "${GREEN}📚 API Documentation: ${SERVICE_URL}/docs${NC}"
echo -e "${GREEN}🔍 Health Check: ${SERVICE_URL}/health${NC}"

# Test health endpoint
echo -e "${BLUE}🔍 Testing health endpoint...${NC}"
sleep 15  # Wait for service to be ready

for i in {1..5}; do
    if curl -f "${SERVICE_URL}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        break
    else
        echo -e "${YELLOW}⚠️ Health check attempt ${i}/5 failed. Retrying in 5 seconds...${NC}"
        sleep 5
    fi
done

# Test API endpoints
echo -e "${BLUE}🔍 Testing API endpoints...${NC}"

# Test root endpoint
if curl -f "${SERVICE_URL}/" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Root endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️ Root endpoint not responding${NC}"
fi

# Test docs endpoint
if curl -f "${SERVICE_URL}/docs" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API documentation accessible${NC}"
else
    echo -e "${YELLOW}⚠️ API documentation not accessible${NC}"
fi

# Display final information
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "${BLUE}   Service Name: ${SERVICE_NAME}${NC}"
echo -e "${BLUE}   Region: ${REGION}${NC}"
echo -e "${BLUE}   URL: ${SERVICE_URL}${NC}"
echo -e "${BLUE}   Memory: 2Gi${NC}"
echo -e "${BLUE}   CPU: 2${NC}"
echo -e "${BLUE}   Max Instances: 20${NC}"
echo -e "${BLUE}   Concurrency: 100${NC}"

echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "${BLUE}1. Update mobile app with production URL: ${SERVICE_URL}${NC}"
echo -e "${BLUE}2. Test Firebase authentication flow${NC}"
echo -e "${BLUE}3. Monitor service logs: gcloud run services logs read ${SERVICE_NAME} --region=${REGION}${NC}"
echo -e "${BLUE}4. Set up monitoring and alerting in GCP Console${NC}"
echo -e "${BLUE}5. Configure custom domain if needed${NC}"

echo -e "${GREEN}🎯 Production deployment completed successfully!${NC}"
