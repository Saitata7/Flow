#!/bin/bash

# 🔗 Cloud SQL Proxy Setup Script for DBeaver
# This script sets up Cloud SQL Proxy to connect to GCP Cloud SQL instances
# 
# ⚠️ SECURITY WARNING: Set DB_PASSWORD environment variable before running!
# Example: export DB_PASSWORD="your_actual_password"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="quick-doodad-472200-k0"
INSTANCE_NAME="flow-prod"
REGION="us-central1"
LOCAL_PORT="5433"

echo -e "${BLUE}🔗 Setting up Cloud SQL Proxy for DBeaver...${NC}"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Not authenticated with gcloud. Please run: gcloud auth login${NC}"
    exit 1
fi

# Check if Cloud SQL Proxy is already installed
if command -v cloud_sql_proxy &> /dev/null; then
    echo -e "${GREEN}✅ Cloud SQL Proxy is already installed${NC}"
else
    echo -e "${BLUE}📦 Installing Cloud SQL Proxy...${NC}"
    
    # Detect OS and architecture
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    case $ARCH in
        x86_64) ARCH="amd64" ;;
        arm64) ARCH="arm64" ;;
        *) echo -e "${RED}❌ Unsupported architecture: $ARCH${NC}"; exit 1 ;;
    esac
    
    # Download Cloud SQL Proxy
    PROXY_URL="https://dl.google.com/cloudsql/cloud_sql_proxy.${OS}.${ARCH}"
    echo -e "${BLUE}Downloading from: $PROXY_URL${NC}"
    
    curl -o cloud_sql_proxy "$PROXY_URL"
    chmod +x cloud_sql_proxy
    
    # Move to /usr/local/bin for system-wide access
    sudo mv cloud_sql_proxy /usr/local/bin/
    
    echo -e "${GREEN}✅ Cloud SQL Proxy installed successfully${NC}"
fi

# Create connection string
CONNECTION_NAME="${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"

echo -e "${BLUE}🚀 Starting Cloud SQL Proxy...${NC}"
echo -e "${BLUE}Connection: ${CONNECTION_NAME}${NC}"
echo -e "${BLUE}Local port: ${LOCAL_PORT}${NC}"

# Start Cloud SQL Proxy in background
cloud_sql_proxy -instances="${CONNECTION_NAME}=tcp:${LOCAL_PORT}" &
PROXY_PID=$!

# Wait a moment for proxy to start
sleep 3

# Check if proxy is running
if ps -p $PROXY_PID > /dev/null; then
    echo -e "${GREEN}✅ Cloud SQL Proxy started successfully (PID: $PROXY_PID)${NC}"
    echo -e "${GREEN}🔗 Proxy is running on localhost:${LOCAL_PORT}${NC}"
    
    echo -e "${BLUE}📋 DBeaver Connection Settings:${NC}"
    echo -e "${BLUE}Host: localhost${NC}"
    echo -e "${BLUE}Port: ${LOCAL_PORT}${NC}"
    echo -e "${BLUE}Database: flow${NC}"
    echo -e "${BLUE}Username: flow_user${NC}"
    echo -e "${BLUE}Password: [YOUR_DB_PASSWORD]${NC}"
    echo -e "${BLUE}SSL: Not required (proxy handles SSL)${NC}"
    
    echo -e "${YELLOW}⚠️ Keep this terminal open while using DBeaver${NC}"
    echo -e "${YELLOW}⚠️ Press Ctrl+C to stop the proxy${NC}"
    
    # Test connection
    echo -e "${BLUE}🔍 Testing connection...${NC}"
    sleep 2
    
    if command -v psql &> /dev/null; then
        if [ -n "$DB_PASSWORD" ]; then
            if PGPASSWORD="$DB_PASSWORD" psql -h localhost -p $LOCAL_PORT -U flow_user -d flow -c "SELECT current_database(), current_user;" &> /dev/null; then
                echo -e "${GREEN}✅ Connection test successful!${NC}"
            else
                echo -e "${YELLOW}⚠️ Connection test failed, but proxy is running${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️ DB_PASSWORD not set, skipping connection test${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ psql not found, skipping connection test${NC}"
    fi
    
    # Wait for user to stop
    echo -e "${BLUE}Press Ctrl+C to stop the Cloud SQL Proxy...${NC}"
    trap "echo -e '${BLUE}Stopping Cloud SQL Proxy...${NC}'; kill $PROXY_PID; exit 0" INT
    
    # Keep running
    while true; do
        sleep 1
        if ! ps -p $PROXY_PID > /dev/null; then
            echo -e "${RED}❌ Cloud SQL Proxy stopped unexpectedly${NC}"
            exit 1
        fi
    done
    
else
    echo -e "${RED}❌ Failed to start Cloud SQL Proxy${NC}"
    exit 1
fi
