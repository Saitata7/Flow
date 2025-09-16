#!/bin/bash

# Deployment script for Flow API to Google Cloud Run
# This script builds and deploys the API service to Cloud Run

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
SERVICE_NAME=${SERVICE_NAME:-"flow-api"}
ENVIRONMENT=${ENVIRONMENT:-"production"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo -e "${BLUE}🚀 Deploying Flow API to Google Cloud Run${NC}"
echo -e "${BLUE}Project ID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}Service: ${SERVICE_NAME}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Image Tag: ${IMAGE_TAG}${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ You are not authenticated with gcloud. Please run: gcloud auth login${NC}"
    exit 1
fi

# Set the project
echo -e "${BLUE}📋 Setting project to ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID}

# Configure Docker for Artifact Registry
echo -e "${BLUE}🐳 Configuring Docker for Artifact Registry${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build Docker image
echo -e "${BLUE}🔨 Building Docker image${NC}"
cd services/api

IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/flow-repo/${SERVICE_NAME}:${IMAGE_TAG}"

docker build -t ${IMAGE_URL} .

# Push image to Artifact Registry
echo -e "${BLUE}📤 Pushing image to Artifact Registry${NC}"
docker push ${IMAGE_URL}

# Deploy to Cloud Run
echo -e "${BLUE}🚀 Deploying to Cloud Run${NC}"

# Set environment variables based on environment
if [ "${ENVIRONMENT}" = "production" ]; then
    MIN_INSTANCES=1
    MAX_INSTANCES=20
    CPU_LIMIT="2"
    MEMORY_LIMIT="2Gi"
    SECRETS="DATABASE_URL=database-url:latest,REDIS_HOST=redis-host:latest,REDIS_PASSWORD=redis-password:latest,JWT_SECRET=jwt-secret:latest,FIREBASE_PROJECT_ID=firebase-project-id:latest,FIREBASE_PRIVATE_KEY=firebase-private-key:latest,FIREBASE_CLIENT_EMAIL=firebase-client-email:latest"
    CLOUD_SQL_INSTANCE="flow-db"
else
    MIN_INSTANCES=0
    MAX_INSTANCES=5
    CPU_LIMIT="1"
    MEMORY_LIMIT="1Gi"
    SECRETS="DATABASE_URL=database-url-${ENVIRONMENT}:latest,REDIS_HOST=redis-host-${ENVIRONMENT}:latest,REDIS_PASSWORD=redis-password-${ENVIRONMENT}:latest,JWT_SECRET=jwt-secret-${ENVIRONMENT}:latest"
    CLOUD_SQL_INSTANCE="flow-db-${ENVIRONMENT}"
fi

gcloud run deploy ${SERVICE_NAME}${ENVIRONMENT:+-${ENVIRONMENT}} \
    --image ${IMAGE_URL} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory ${MEMORY_LIMIT} \
    --cpu ${CPU_LIMIT} \
    --min-instances ${MIN_INSTANCES} \
    --max-instances ${MAX_INSTANCES} \
    --concurrency 80 \
    --timeout 300 \
    --set-env-vars NODE_ENV=${ENVIRONMENT},PORT=8080,HOST=0.0.0.0 \
    --set-secrets ${SECRETS} \
    --set-cloudsql-instances ${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE} \
    --service-account flow-service-${ENVIRONMENT}@${PROJECT_ID}.iam.gserviceaccount.com

# Run database migrations
echo -e "${BLUE}🗄️  Running database migrations${NC}"

# Create migration job
gcloud run jobs create ${SERVICE_NAME}-migrate${ENVIRONMENT:+-${ENVIRONMENT}} \
    --image ${IMAGE_URL} \
    --region ${REGION} \
    --set-env-vars NODE_ENV=${ENVIRONMENT} \
    --set-secrets DATABASE_URL=database-url${ENVIRONMENT:+-${ENVIRONMENT}}:latest \
    --set-cloudsql-instances ${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE} \
    --command node \
    --args migrations/migrate.js \
    --max-retries 3 \
    --parallelism 1 \
    --task-count 1 \
    --service-account flow-service-${ENVIRONMENT}@${PROJECT_ID}.iam.gserviceaccount.com \
    --quiet || echo "Migration job already exists"

# Execute migration job
gcloud run jobs execute ${SERVICE_NAME}-migrate${ENVIRONMENT:+-${ENVIRONMENT}} \
    --region ${REGION} \
    --wait

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME}${ENVIRONMENT:+-${ENVIRONMENT}} --region ${REGION} --format='value(status.url)')

# Wait for service to be ready
echo -e "${BLUE}⏳ Waiting for service to be ready...${NC}"
sleep 30

# Run smoke tests
echo -e "${BLUE}🧪 Running smoke tests${NC}"

# Test health endpoint
echo -e "${YELLOW}  Testing health endpoint...${NC}"
if curl -f "${SERVICE_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}    ✅ Health endpoint is working${NC}"
else
    echo -e "${RED}    ❌ Health endpoint failed${NC}"
    exit 1
fi

# Test API documentation
echo -e "${YELLOW}  Testing API documentation...${NC}"
if curl -f "${SERVICE_URL}/docs" > /dev/null 2>&1; then
    echo -e "${GREEN}    ✅ API documentation is accessible${NC}"
else
    echo -e "${RED}    ❌ API documentation failed${NC}"
    exit 1
fi

# Test OpenAPI spec
echo -e "${YELLOW}  Testing OpenAPI specification...${NC}"
if curl -f "${SERVICE_URL}/openapi.json" > /dev/null 2>&1; then
    echo -e "${GREEN}    ✅ OpenAPI specification is accessible${NC}"
else
    echo -e "${RED}    ❌ OpenAPI specification failed${NC}"
    exit 1
fi

# Clean up old revisions
echo -e "${BLUE}🧹 Cleaning up old revisions${NC}"
OLD_REVISIONS=$(gcloud run revisions list --service=${SERVICE_NAME}${ENVIRONMENT:+-${ENVIRONMENT}} --region=${REGION} --format='value(metadata.name)' --sort-by='~metadata.creationTimestamp' | tail -n +3)

for revision in $OLD_REVISIONS; do
    echo -e "${YELLOW}  Deleting old revision: ${revision}${NC}"
    gcloud run revisions delete ${revision} --region=${REGION} --quiet || true
done

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "  Service URL: ${SERVICE_URL}"
echo -e "  Health Check: ${SERVICE_URL}/health"
echo -e "  API Docs: ${SERVICE_URL}/docs"
echo -e "  OpenAPI Spec: ${SERVICE_URL}/openapi.json"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  Image: ${IMAGE_URL}"
echo ""
echo -e "${BLUE}🔗 Useful commands:${NC}"
echo -e "  View logs: gcloud run services logs tail ${SERVICE_NAME}${ENVIRONMENT:+-${ENVIRONMENT}} --region ${REGION}"
echo -e "  View service: gcloud run services describe ${SERVICE_NAME}${ENVIRONMENT:+-${ENVIRONMENT}} --region ${REGION}"
echo -e "  View revisions: gcloud run revisions list --service=${SERVICE_NAME}${ENVIRONMENT:+-${ENVIRONMENT}} --region ${REGION}"
echo ""
echo -e "${GREEN}🎉 Flow API is now deployed and running!${NC}"
