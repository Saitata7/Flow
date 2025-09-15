#!/bin/bash

# GCP Resource Setup Script for Flow API
# This script provisions all necessary GCP resources for the Flow API

set -e

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="flow-api"
DB_INSTANCE_NAME="flow-db"
DB_NAME="flow"
DB_USER="flow_user"
REDIS_INSTANCE_NAME="flow-redis"
ARTIFACT_REGISTRY_NAME="flow-registry"

echo "🚀 Setting up GCP resources for Flow API..."
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"

# Enable required APIs
echo "📋 Enabling required GCP APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    redis.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    --project=$PROJECT_ID

# Create Artifact Registry
echo "📦 Creating Artifact Registry..."
gcloud artifacts repositories create $ARTIFACT_REGISTRY_NAME \
    --repository-format=docker \
    --location=$REGION \
    --project=$PROJECT_ID \
    || echo "Artifact Registry already exists"

# Create Cloud SQL instance
echo "🗄️ Creating Cloud SQL PostgreSQL instance..."
gcloud sql instances create $DB_INSTANCE_NAME \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=$REGION \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup \
    --enable-ip-alias \
    --network=default \
    --project=$PROJECT_ID \
    || echo "Cloud SQL instance already exists"

# Create database
echo "📊 Creating database..."
gcloud sql databases create $DB_NAME \
    --instance=$DB_INSTANCE_NAME \
    --project=$PROJECT_ID \
    || echo "Database already exists"

# Create database user
echo "👤 Creating database user..."
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users create $DB_USER \
    --instance=$DB_INSTANCE_NAME \
    --password=$DB_PASSWORD \
    --project=$PROJECT_ID \
    || echo "Database user already exists"

# Create MemoryStore Redis instance
echo "🔴 Creating MemoryStore Redis instance..."
gcloud redis instances create $REDIS_INSTANCE_NAME \
    --size=1 \
    --region=$REGION \
    --redis-version=redis_7_0 \
    --network=default \
    --project=$PROJECT_ID \
    || echo "Redis instance already exists"

# Get connection details
echo "📋 Gathering connection details..."

# Get Cloud SQL connection details
DB_HOST=$(gcloud sql instances describe $DB_INSTANCE_NAME --project=$PROJECT_ID --format='value(ipAddresses[0].ipAddress)')
echo "Database Host: $DB_HOST"

# Get Redis connection details
REDIS_HOST=$(gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$REGION --project=$PROJECT_ID --format='value(host)')
echo "Redis Host: $REDIS_HOST"

# Create secrets in Secret Manager
echo "🔐 Creating secrets in Secret Manager..."

# Database password
echo "$DB_PASSWORD" | gcloud secrets create db-password \
    --data-file=- \
    --project=$PROJECT_ID \
    || echo "DB password secret already exists"

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64)
echo "$JWT_SECRET" | gcloud secrets create jwt-secret \
    --data-file=- \
    --project=$PROJECT_ID \
    || echo "JWT secret already exists"

# Firebase Private Key (placeholder)
echo "-----BEGIN PRIVATE KEY-----\nPLACEHOLDER_FIREBASE_PRIVATE_KEY\n-----END PRIVATE KEY-----" | gcloud secrets create firebase-private-key \
    --data-file=- \
    --project=$PROJECT_ID \
    || echo "Firebase private key secret already exists"

# Firebase Client Email (placeholder)
echo "firebase-adminsdk-xxxxx@$PROJECT_ID.iam.gserviceaccount.com" | gcloud secrets create firebase-client-email \
    --data-file=- \
    --project=$PROJECT_ID \
    || echo "Firebase client email secret already exists"

# API Keys
echo "flow-api-key-$(openssl rand -hex 16),flow-service-key-$(openssl rand -hex 16)" | gcloud secrets create api-keys \
    --data-file=- \
    --project=$PROJECT_ID \
    || echo "API keys secret already exists"

# CORS Origin (placeholder)
echo "https://flow.app,https://app.flow.com" | gcloud secrets create cors-origin \
    --data-file=- \
    --project=$PROJECT_ID \
    || echo "CORS origin secret already exists"

echo ""
echo "✅ GCP resources setup complete!"
echo ""
echo "📋 Connection Details:"
echo "Database Host: $DB_HOST"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Redis Host: $REDIS_HOST"
echo ""
echo "🔐 Secrets created in Secret Manager:"
echo "- db-password"
echo "- jwt-secret"
echo "- firebase-private-key"
echo "- firebase-client-email"
echo "- api-keys"
echo "- cors-origin"
echo ""
echo "📝 Next steps:"
echo "1. Update your GitHub repository secrets with the connection details"
echo "2. Configure Firebase project and update Firebase secrets"
echo "3. Run the GitHub Actions workflow to deploy the API"
echo "4. Test the deployed API endpoints"
echo ""
echo "🔗 Useful commands:"
echo "gcloud sql connect $DB_INSTANCE_NAME --user=$DB_USER --database=$DB_NAME --project=$PROJECT_ID"
echo "gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$REGION --project=$PROJECT_ID"
echo "gcloud run services list --region=$REGION --project=$PROJECT_ID"
