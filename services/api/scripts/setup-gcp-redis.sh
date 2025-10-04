#!/bin/bash

# 🔗 GCP Redis Connection Setup Script
# This script configures your application to connect to GCP MemoryStore Redis

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="quick-doodad-472200-k0"
REGION="us-central1"
INSTANCE_NAME="flow-redis"

echo -e "${BLUE}🔗 Setting up GCP Redis connection...${NC}"

# Check if Redis instance exists and get details
echo -e "${BLUE}📋 Checking Redis instance status...${NC}"
REDIS_STATUS=$(gcloud redis instances describe $INSTANCE_NAME --region=$REGION --format="value(state)" 2>/dev/null || echo "NOT_FOUND")

if [ "$REDIS_STATUS" = "NOT_FOUND" ]; then
    echo -e "${YELLOW}⚠️ Redis instance not found. Creating...${NC}"
    gcloud redis instances create $INSTANCE_NAME --size=1 --region=$REGION --redis-version=redis_7_0
    echo -e "${GREEN}✅ Redis instance creation initiated${NC}"
elif [ "$REDIS_STATUS" = "CREATING" ]; then
    echo -e "${YELLOW}⚠️ Redis instance is still being created. Please wait...${NC}"
    echo -e "${BLUE}You can check status with: gcloud redis instances describe $INSTANCE_NAME --region=$REGION${NC}"
elif [ "$REDIS_STATUS" = "READY" ]; then
    echo -e "${GREEN}✅ Redis instance is ready${NC}"
else
    echo -e "${YELLOW}⚠️ Redis instance status: $REDIS_STATUS${NC}"
fi

# Get Redis connection details
echo -e "${BLUE}📋 Getting Redis connection details...${NC}"
REDIS_HOST=$(gcloud redis instances describe $INSTANCE_NAME --region=$REGION --format="value(host)" 2>/dev/null || echo "")
REDIS_PORT=$(gcloud redis instances describe $INSTANCE_NAME --region=$REGION --format="value(port)" 2>/dev/null || echo "6379")

if [ -n "$REDIS_HOST" ]; then
    echo -e "${GREEN}✅ Redis connection details:${NC}"
    echo -e "${GREEN}Host: $REDIS_HOST${NC}"
    echo -e "${GREEN}Port: $REDIS_PORT${NC}"
    
    # Update environment configuration
    echo -e "${BLUE}📝 Updating environment configuration...${NC}"
    
    # Update .env files
    if [ -f ".env" ]; then
        sed -i.bak "s/REDIS_HOST=.*/REDIS_HOST=$REDIS_HOST/" .env
        sed -i.bak "s/REDIS_PORT=.*/REDIS_PORT=$REDIS_PORT/" .env
        echo -e "${GREEN}✅ Updated .env file${NC}"
    fi
    
    if [ -f "env.production" ]; then
        sed -i.bak "s/REDIS_HOST=.*/REDIS_HOST=$REDIS_HOST/" env.production
        sed -i.bak "s/REDIS_PORT=.*/REDIS_PORT=$REDIS_PORT/" env.production
        echo -e "${GREEN}✅ Updated env.production file${NC}"
    fi
    
    # Test Redis connection
    echo -e "${BLUE}🔍 Testing Redis connection...${NC}"
    node -e "
    const Redis = require('ioredis');
    const redis = new Redis({
      host: '$REDIS_HOST',
      port: $REDIS_PORT,
      connectTimeout: 10000,
      lazyConnect: true
    });
    
    redis.connect()
      .then(() => {
        console.log('✅ Redis connection successful');
        return redis.ping();
      })
      .then(result => {
        console.log('✅ Redis ping result:', result);
        redis.disconnect();
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Redis connection failed:', error.message);
        process.exit(1);
      });
    "
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}🎉 GCP Redis setup completed successfully!${NC}"
        echo -e "${BLUE}📋 Connection details:${NC}"
        echo -e "${BLUE}Host: $REDIS_HOST${NC}"
        echo -e "${BLUE}Port: $REDIS_PORT${NC}"
        echo -e "${BLUE}No password required (internal GCP network)${NC}"
        
        echo -e "${BLUE}📋 Next steps:${NC}"
        echo -e "${BLUE}1. Restart your application${NC}"
        echo -e "${BLUE}2. Test Redis operations${NC}"
        echo -e "${BLUE}3. Monitor Redis usage in GCP Console${NC}"
    else
        echo -e "${RED}❌ Redis connection test failed${NC}"
        echo -e "${YELLOW}⚠️ Make sure your application is running in the same VPC network${NC}"
    fi
    
else
    echo -e "${YELLOW}⚠️ Redis instance not ready yet. Please wait and run this script again.${NC}"
    echo -e "${BLUE}Check status: gcloud redis instances describe $INSTANCE_NAME --region=$REGION${NC}"
fi

echo -e "${GREEN}🎯 GCP Redis setup script completed!${NC}"
