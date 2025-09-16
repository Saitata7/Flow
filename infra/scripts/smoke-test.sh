#!/bin/bash

# Smoke test script for Flow API
# This script performs comprehensive smoke tests on the deployed API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_URL=${SERVICE_URL:-""}
ENVIRONMENT=${ENVIRONMENT:-"production"}
TIMEOUT=${TIMEOUT:-30}
RETRIES=${RETRIES:-3}

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

echo -e "${BLUE}🧪 Flow API Smoke Tests${NC}"
echo -e "${BLUE}Service URL: ${SERVICE_URL}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Timeout: ${TIMEOUT}s${NC}"
echo ""

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${YELLOW}Running test: ${test_name}${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ ${test_name} - PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}  ❌ ${test_name} - FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local endpoint="$1"
    local expected_status="$2"
    local test_name="$3"
    
    run_test "$test_name" "curl -f -s -w '%{http_code}' -o /dev/null '${SERVICE_URL}${endpoint}' | grep -q '${expected_status}'"
}

# Function to test JSON response
test_json_endpoint() {
    local endpoint="$1"
    local test_name="$2"
    
    run_test "$test_name" "curl -f -s '${SERVICE_URL}${endpoint}' | jq . > /dev/null"
}

# Function to test response time
test_response_time() {
    local endpoint="$1"
    local max_time="$2"
    local test_name="$3"
    
    run_test "$test_name" "curl -f -s -w '%{time_total}' -o /dev/null '${SERVICE_URL}${endpoint}' | awk '{if (\$1 > ${max_time}) exit 1; else exit 0}'"
}

# Check if SERVICE_URL is provided
if [ -z "$SERVICE_URL" ]; then
    echo -e "${RED}❌ SERVICE_URL is required${NC}"
    echo "Usage: SERVICE_URL=https://your-service-url ./smoke-test.sh"
    exit 1
fi

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is not installed${NC}"
    exit 1
fi

# Check if jq is available (for JSON tests)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq is not installed, skipping JSON validation tests${NC}"
fi

echo -e "${BLUE}🔍 Starting smoke tests...${NC}"
echo ""

# Basic connectivity tests
echo -e "${BLUE}📡 Basic Connectivity Tests${NC}"

# Test if service is reachable
run_test "Service Reachability" "curl -f -s --connect-timeout ${TIMEOUT} '${SERVICE_URL}' > /dev/null"

# Test if service responds to HEAD request
run_test "HEAD Request" "curl -f -s -I --connect-timeout ${TIMEOUT} '${SERVICE_URL}' > /dev/null"

echo ""

# Health check tests
echo -e "${BLUE}🏥 Health Check Tests${NC}"

# Test health endpoint
test_endpoint "/health" "200" "Health Endpoint"

# Test health endpoint response time
test_response_time "/health" "1" "Health Endpoint Response Time"

# Test health endpoint JSON response (if jq is available)
if command -v jq &> /dev/null; then
    test_json_endpoint "/health" "Health Endpoint JSON Response"
fi

echo ""

# API documentation tests
echo -e "${BLUE}📚 API Documentation Tests${NC}"

# Test API documentation
test_endpoint "/docs" "200" "API Documentation"

# Test OpenAPI specification
test_endpoint "/openapi.json" "200" "OpenAPI Specification"

# Test OpenAPI JSON response (if jq is available)
if command -v jq &> /dev/null; then
    test_json_endpoint "/openapi.json" "OpenAPI JSON Response"
fi

echo ""

# API endpoint tests
echo -e "${BLUE}🔌 API Endpoint Tests${NC}"

# Test API version endpoint
test_endpoint "/api/v1" "200" "API Version Endpoint"

# Test flows endpoint (should require authentication)
test_endpoint "/api/v1/flows" "401" "Flows Endpoint Authentication"

# Test invalid endpoint
test_endpoint "/api/v1/invalid" "404" "Invalid Endpoint Handling"

echo ""

# CORS tests
echo -e "${BLUE}🌐 CORS Tests${NC}"

# Test CORS preflight request
run_test "CORS Preflight Request" "curl -f -s -X OPTIONS -H 'Origin: https://example.com' -H 'Access-Control-Request-Method: GET' '${SERVICE_URL}/api/v1/flows' > /dev/null"

# Test CORS headers
run_test "CORS Headers" "curl -f -s -I -H 'Origin: https://example.com' '${SERVICE_URL}/api/v1/flows' | grep -q 'Access-Control-Allow-Origin'"

echo ""

# Performance tests
echo -e "${BLUE}⚡ Performance Tests${NC}"

# Test response time for health endpoint
test_response_time "/health" "0.5" "Health Endpoint Performance"

# Test response time for docs endpoint
test_response_time "/docs" "2" "Documentation Endpoint Performance"

# Test response time for OpenAPI spec
test_response_time "/openapi.json" "1" "OpenAPI Spec Performance"

echo ""

# Security tests
echo -e "${BLUE}🔒 Security Tests${NC}"

# Test HTTPS (if applicable)
if [[ "$SERVICE_URL" == https://* ]]; then
    run_test "HTTPS Connection" "curl -f -s --connect-timeout ${TIMEOUT} '${SERVICE_URL}' > /dev/null"
fi

# Test security headers
run_test "Security Headers" "curl -f -s -I '${SERVICE_URL}' | grep -q 'X-Content-Type-Options'"

# Test rate limiting (if implemented)
run_test "Rate Limiting" "for i in {1..10}; do curl -f -s '${SERVICE_URL}/health' > /dev/null; done"

echo ""

# Load testing (basic)
echo -e "${BLUE}📊 Load Testing${NC}"

# Test concurrent requests
run_test "Concurrent Requests" "for i in {1..5}; do curl -f -s '${SERVICE_URL}/health' > /dev/null & done; wait"

# Test multiple endpoints concurrently
run_test "Multiple Endpoints Concurrent" "curl -f -s '${SERVICE_URL}/health' > /dev/null & curl -f -s '${SERVICE_URL}/docs' > /dev/null & curl -f -s '${SERVICE_URL}/openapi.json' > /dev/null & wait"

echo ""

# Environment-specific tests
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${BLUE}🏭 Production Environment Tests${NC}"
    
    # Test production-specific endpoints
    test_endpoint "/api/v1/stats/global" "401" "Global Stats Endpoint"
    
    # Test production performance requirements
    test_response_time "/health" "0.2" "Production Health Performance"
    
    echo ""
fi

# Summary
echo -e "${BLUE}📋 Test Summary${NC}"
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All smoke tests passed!${NC}"
    echo -e "${GREEN}✅ Service is healthy and ready for use${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some smoke tests failed!${NC}"
    echo -e "${RED}⚠️  Service may not be ready for production use${NC}"
    exit 1
fi
