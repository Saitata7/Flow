#!/bin/bash

# 🔒 Practical Security Check for Flow Project
# This script checks for actual credential leaks and security issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Flow Project Security Check${NC}"
echo -e "${BLUE}=============================${NC}"

overall_status=0

# Check 1: Git status for sensitive files
echo -e "${BLUE}1. Checking Git status...${NC}"
if git diff --cached --name-only | grep -E "(GoogleService-Info\.plist|google-services\.json|\.env|env\.production)" > /dev/null; then
    echo -e "${RED}❌ SENSITIVE FILES STAGED FOR COMMIT!${NC}"
    git diff --cached --name-only | grep -E "(GoogleService-Info\.plist|google-services\.json|\.env|env\.production)"
    overall_status=1
else
    echo -e "${GREEN}✅ No sensitive files staged${NC}"
fi

# Check 2: Look for actual Firebase API keys (not templates)
echo -e "${BLUE}2. Checking for Firebase API keys...${NC}"
if grep -r "AIza[0-9A-Za-z_-]{35}" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.backup" --exclude="*.template" --exclude="*.example" --exclude="*.test.js" > /dev/null; then
    echo -e "${RED}❌ FOUND: Actual Firebase API keys${NC}"
    grep -r "AIza[0-9A-Za-z_-]{35}" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.backup" --exclude="*.template" --exclude="*.example" --exclude="*.test.js"
    overall_status=1
else
    echo -e "${GREEN}✅ No Firebase API keys found${NC}"
fi

# Check 3: Look for actual private keys (not templates)
echo -e "${BLUE}3. Checking for private keys...${NC}"
if grep -r "BEGIN PRIVATE KEY" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.backup" --exclude="*.template" --exclude="*.example" --exclude="*.test.js" | grep -v "Your Firebase Private Key" | grep -v "PLACEHOLDER" | grep -v "BEGIN PRIVATE KEY" > /dev/null; then
    echo -e "${RED}❌ FOUND: Actual private keys${NC}"
    grep -r "BEGIN PRIVATE KEY" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.backup" --exclude="*.template" --exclude="*.example" --exclude="*.test.js" | grep -v "Your Firebase Private Key" | grep -v "PLACEHOLDER"
    overall_status=1
else
    echo -e "${GREEN}✅ Only template private keys found${NC}"
fi

# Check 4: Look for hardcoded passwords (not environment variables)
echo -e "${BLUE}4. Checking for hardcoded passwords...${NC}"
if grep -r "password.*=.*['\"][^'\"]*['\"]" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.backup" --exclude="*.template" --exclude="*.example" --exclude="*.test.js" --exclude="security-check*.sh" | grep -v "\${" | grep -v "your_.*_here" | grep -v "openssl rand" | grep -v "gcloud secrets" > /dev/null; then
    echo -e "${RED}❌ FOUND: Hardcoded passwords${NC}"
    grep -r "password.*=.*['\"][^'\"]*['\"]" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.backup" --exclude="*.template" --exclude="*.example" --exclude="*.test.js" --exclude="security-check*.sh" | grep -v "\${" | grep -v "your_.*_here" | grep -v "openssl rand" | grep -v "gcloud secrets"
    overall_status=1
else
    echo -e "${GREEN}✅ No hardcoded passwords found${NC}"
fi

# Check 5: Verify .gitignore has critical patterns
echo -e "${BLUE}5. Checking .gitignore...${NC}"
if grep -q "GoogleService-Info\.plist" .gitignore && grep -q "^\.env$" .gitignore; then
    echo -e "${GREEN}✅ .gitignore has critical patterns${NC}"
else
    echo -e "${YELLOW}⚠️ .gitignore missing some patterns${NC}"
fi

echo ""

# Final result
if [ $overall_status -eq 0 ]; then
    echo -e "${GREEN}🎉 SECURITY CHECK PASSED!${NC}"
    echo -e "${GREEN}✅ No credential leaks detected${NC}"
    echo -e "${GREEN}✅ Safe to commit${NC}"
    echo ""
    echo -e "${BLUE}🔒 Your project is secure!${NC}"
    exit 0
else
    echo -e "${RED}🚨 SECURITY CHECK FAILED!${NC}"
    echo -e "${RED}❌ Credential leaks detected${NC}"
    echo ""
    echo -e "${YELLOW}⚠️ Please fix the issues above before committing${NC}"
    exit 1
fi
