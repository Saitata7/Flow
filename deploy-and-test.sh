#!/bin/bash

# Deployment and Testing Script for Sync & Auth Refactor
# Run this script after deploying to verify everything works

set -e  # Exit on error

echo "🚀 Flow Sync & Auth Deployment Test"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API URL (adjust for your environment)
API_URL="${API_URL:-http://localhost:3000}"

# Check if backend is running
echo -e "\n${YELLOW}1. Checking backend health...${NC}"
if curl -s -f "${API_URL}/v1/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    exit 1
fi

# Run migrations
echo -e "\n${YELLOW}2. Running database migrations...${NC}"
cd services/api
npm run migrate

# Test 1: Check if sessions table exists
echo -e "\n${YELLOW}3. Verifying database schema...${NC}"
if psql $DATABASE_URL -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions');" | grep -q "t"; then
    echo -e "${GREEN}✅ Sessions table exists${NC}"
else
    echo -e "${RED}❌ Sessions table missing${NC}"
    exit 1
fi

if psql $DATABASE_URL -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sync_log');" | grep -q "t"; then
    echo -e "${GREEN}✅ Sync_log table exists${NC}"
else
    echo -e "${RED}❌ Sync_log table missing${NC}"
    exit 1
fi

# Test 2: Session extension
echo -e "\n${YELLOW}4. Testing session extension...${NC}"
# This would require a logged-in user session
echo -e "${YELLOW}ℹ️  Manual test required: Login and make API calls, then check expires_at${NC}"

# Test 3: Redis fallback
echo -e "\n${YELLOW}5. Testing Redis fallback...${NC}"
echo -e "${YELLOW}ℹ️  Manual test: Stop Redis (docker stop redis) and verify no 401s${NC}"

# Test 4: New endpoints
echo -e "\n${YELLOW}6. Testing new endpoints...${NC}"
echo -e "${YELLOW}ℹ️  Try: GET ${API_URL}/v1/sync/status${NC}"

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Test mobile app login/logout"
echo "2. Create cloud flow (verify sync)"
echo "3. Create local flow (verify stays local)"
echo "4. Test offline mode (queue, reconnect, sync)"
echo "5. Review DEPLOYMENT_TEST_CHECKLIST.md for full test suite"

