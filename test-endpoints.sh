#!/bin/bash

# Endpoint Testing Script
# Tests all new sync/auth endpoints

set -e

API_URL="${API_URL:-http://localhost:3000}"
TEST_EMAIL="${TEST_EMAIL:-test@example.com}"
TEST_PASSWORD="${TEST_PASSWORD:-Test123!@#}"

echo "🧪 Testing Sync & Auth Endpoints"
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Health Check
echo -e "\n${YELLOW}Test 1: Health Check${NC}"
HEALTH=$(curl -s "${API_URL}/v1/health")
if echo "$HEALTH" | grep -q "database"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "$HEALTH"
fi

# Test 2: Register (if needed)
echo -e "\n${YELLOW}Test 2: User Registration${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"username\": \"testuser\",
    \"dateOfBirth\": \"1990-01-01\",
    \"gender\": \"male\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Registration successful${NC}"
    SESSION_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${YELLOW}ℹ️  User might already exist, trying login...${NC}"
    # Login instead
    LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/v1/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"${TEST_EMAIL}\",
        \"password\": \"${TEST_PASSWORD}\"
      }")
    SESSION_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$SESSION_TOKEN" ]; then
    echo -e "${RED}❌ Failed to get session token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Got session token: ${SESSION_TOKEN:0:20}...${NC}"

# Test 3: Sync Status
echo -e "\n${YELLOW}Test 3: Sync Status Endpoint${NC}"
STATUS_RESPONSE=$(curl -s -X GET "${API_URL}/v1/sync/status" \
  -H "Authorization: Bearer ${SESSION_TOKEN}")

if echo "$STATUS_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Sync status endpoint working${NC}"
    echo "$STATUS_RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Sync status failed${NC}"
    echo "$STATUS_RESPONSE"
fi

# Test 4: Create Flow (Cloud)
echo -e "\n${YELLOW}Test 4: Create Cloud Flow${NC}"
CREATE_FLOW_RESPONSE=$(curl -s -X POST "${API_URL}/v1/flows" \
  -H "Authorization: Bearer ${SESSION_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Cloud Flow",
    "trackingType": "Binary",
    "frequency": "Daily",
    "storagePreference": "cloud"
  }')

if echo "$CREATE_FLOW_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Cloud flow created${NC}"
    FLOW_ID=$(echo "$CREATE_FLOW_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "Flow ID: $FLOW_ID"
else
    echo -e "${RED}❌ Failed to create cloud flow${NC}"
    echo "$CREATE_FLOW_RESPONSE"
fi

# Test 5: Batch Sync
echo -e "\n${YELLOW}Test 5: Batch Sync Endpoint${NC}"
IDEMPOTENCY_KEY="test_$(date +%s)"
BATCH_RESPONSE=$(curl -s -X POST "${API_URL}/v1/sync/batch" \
  -H "Authorization: Bearer ${SESSION_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"operations\": [{
      \"idempotencyKey\": \"${IDEMPOTENCY_KEY}\",
      \"opType\": \"CREATE_FLOW\",
      \"payload\": {
        \"title\": \"Batch Test Flow\",
        \"trackingType\": \"Binary\",
        \"frequency\": \"Daily\"
      },
      \"tempId\": \"temp_001\",
      \"storagePreference\": \"cloud\"
    }]
  }")

if echo "$BATCH_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Batch sync successful${NC}"
    echo "$BATCH_RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Batch sync failed${NC}"
    echo "$BATCH_RESPONSE"
fi

# Test 6: Idempotency (duplicate request)
echo -e "\n${YELLOW}Test 6: Testing Idempotency${NC}"
BATCH_RESPONSE_DUP=$(curl -s -X POST "${API_URL}/v1/sync/batch" \
  -H "Authorization: Bearer ${SESSION_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"operations\": [{
      \"idempotencyKey\": \"${IDEMPOTENCY_KEY}\",
      \"opType\": \"CREATE_FLOW\",
      \"payload\": {
        \"title\": \"Batch Test Flow\",
        \"trackingType\": \"Binary\",
        \"frequency\": \"Daily\"
      },
      \"tempId\": \"temp_001\",
      \"storagePreference\": \"cloud\"
    }]
  }")

if echo "$BATCH_RESPONSE_DUP" | grep -q "duplicate"; then
    echo -e "${GREEN}✅ Idempotency working (returned duplicate)${NC}"
else
    echo -e "${YELLOW}⚠️  Expected duplicate status, got:${NC}"
    echo "$BATCH_RESPONSE_DUP"
fi

echo -e "\n${GREEN}✅ All endpoint tests complete!${NC}"

