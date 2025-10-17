#!/bin/bash
set -e

# Configuration
PROJECT_ID="quick-doodad-472200-k0"
SERVICE_NAME="flow-api"
REGION="us-central1"
INSTANCE_NAME="flow-prod"
IMAGE_NAME="gcr.io/${PROJECT_ID}/flow-api:latest"

echo "🚀 Clean Cloud Run Deployment Script"
echo "===================================="
echo "Project: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo "Instance: ${INSTANCE_NAME}"
echo ""

# Step 1: Clean build with no cache
echo "📦 Building fresh Docker image (no cache)..."
cd /Users/saitata/Desktop/MINE/Projects/Mobile_applications/Flow/services/api

gcloud builds submit --no-source --config=- <<EOF
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ["build","--no-cache","-t","${IMAGE_NAME}","."]
images: ["${IMAGE_NAME}"]
EOF

echo "✅ Fresh image built: ${IMAGE_NAME}"
echo ""

# Step 2: Deploy to Cloud Run with correct configuration
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --execution-environment=gen2 \
  --cpu-throttling \
  --set-env-vars "DB_HOST=/cloudsql/${PROJECT_ID}:${REGION}:${INSTANCE_NAME},DB_PORT=5432,DB_NAME=flow,DB_USER=flow_user,NODE_ENV=production,PGSSLMODE=disable" \
  --add-cloudsql-instances "${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"

echo ""
echo "✅ Deployment complete!"
echo ""

# Step 3: Get service URL and test
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")
echo "🌐 Service URL: ${SERVICE_URL}"
echo ""

# Step 4: Test health endpoint
echo "🔍 Testing health endpoint..."
sleep 10
curl -s "${SERVICE_URL}/health" | jq . || echo "❌ Health check failed"

echo ""
echo "🔍 Testing diagnostic endpoint..."
curl -s "${SERVICE_URL}/_diag/dbinfo" | jq . || echo "❌ Diagnostic endpoint failed"

echo ""
echo "✅ Clean deployment script complete!"
