#!/bin/bash

# 🔒 Security Verification Script for Flow Project
# This script checks for credential leaks and security issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Flow Project Security Verification${NC}"
echo -e "${BLUE}=====================================${NC}"

# Function to check for credential patterns
check_credentials() {
    local pattern="$1"
    local description="$2"
    local severity="$3"
    
    echo -e "${BLUE}Checking for $description...${NC}"
    
    if grep -r "$pattern" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.backup" --exclude="*.template" | grep -v "your_.*_here" | grep -v "YOUR_.*" | grep -v "\[YOUR_.*\]" > /dev/null; then
        echo -e "${RED}❌ FOUND: $description${NC}"
        grep -r "$pattern" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.backup" --exclude="*.template" | grep -v "your_.*_here" | grep -v "YOUR_.*" | grep -v "\[YOUR_.*\]"
        return 1
    else
        echo -e "${GREEN}✅ CLEAN: $description${NC}"
        return 0
    fi
}

# Function to check git status
check_git_status() {
    echo -e "${BLUE}Checking Git status...${NC}"
    
    # Check if sensitive files are staged
    if git diff --cached --name-only | grep -E "(GoogleService-Info\.plist|google-services\.json|\.env|env\.production)" > /dev/null; then
        echo -e "${RED}❌ SENSITIVE FILES STAGED FOR COMMIT!${NC}"
        git diff --cached --name-only | grep -E "(GoogleService-Info\.plist|google-services\.json|\.env|env\.production)"
        return 1
    else
        echo -e "${GREEN}✅ No sensitive files staged${NC}"
        return 0
    fi
}

# Function to check .gitignore
check_gitignore() {
    echo -e "${BLUE}Checking .gitignore configuration...${NC}"
    
    local missing_patterns=()
    
    # Check for critical patterns
    if ! grep -q "GoogleService-Info\.plist" .gitignore; then
        missing_patterns+=("GoogleService-Info.plist")
    fi
    
    if ! grep -q "google-services\.json" .gitignore; then
        missing_patterns+=("google-services.json")
    fi
    
    if ! grep -q "\.env" .gitignore; then
        missing_patterns+=(".env files")
    fi
    
    if [ ${#missing_patterns[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ .gitignore properly configured${NC}"
        return 0
    else
        echo -e "${RED}❌ Missing patterns in .gitignore:${NC}"
        printf '%s\n' "${missing_patterns[@]}"
        return 1
    fi
}

# Function to check environment variable usage
check_env_usage() {
    echo -e "${BLUE}Checking environment variable usage...${NC}"
    
    local issues=0
    
    # Check for hardcoded passwords in scripts (exclude legitimate uses)
    if grep -r "DB_PASSWORD.*=" scripts/ --exclude="*.template" | grep -v "\${DB_PASSWORD}" | grep -v "your_.*_here" | grep -v "openssl rand" | grep -v "gcloud secrets" > /dev/null; then
        echo -e "${RED}❌ Hardcoded DB_PASSWORD found in scripts${NC}"
        grep -r "DB_PASSWORD.*=" scripts/ --exclude="*.template" | grep -v "\${DB_PASSWORD}" | grep -v "your_.*_here" | grep -v "openssl rand" | grep -v "gcloud secrets"
        issues=$((issues + 1))
    fi
    
    if grep -r "JWT_SECRET.*=" scripts/ --exclude="*.template" | grep -v "\${JWT_SECRET}" | grep -v "your_.*_here" | grep -v "openssl rand" | grep -v "gcloud secrets" > /dev/null; then
        echo -e "${RED}❌ Hardcoded JWT_SECRET found in scripts${NC}"
        grep -r "JWT_SECRET.*=" scripts/ --exclude="*.template" | grep -v "\${JWT_SECRET}" | grep -v "your_.*_here" | grep -v "openssl rand" | grep -v "gcloud secrets"
        issues=$((issues + 1))
    fi
    
    if [ $issues -eq 0 ]; then
        echo -e "${GREEN}✅ Scripts use environment variables properly${NC}"
        return 0
    else
        return 1
    fi
}

# Run all checks
echo -e "${BLUE}Starting security verification...${NC}"
echo ""

overall_status=0

# Check 1: Git status
if ! check_git_status; then
    overall_status=1
fi
echo ""

# Check 2: .gitignore
if ! check_gitignore; then
    overall_status=1
fi
echo ""

# Check 3: Environment variable usage
if ! check_env_usage; then
    overall_status=1
fi
echo ""

# Check 4: Credential patterns
echo -e "${BLUE}Checking for credential patterns...${NC}"

# Check for common password patterns
if ! check_credentials "password.*=.*['\"][^'\"]*['\"]" "hardcoded passwords" "HIGH"; then
    overall_status=1
fi

# Check for API keys
if ! check_credentials "AIza[0-9A-Za-z_-]{35}" "Firebase API keys" "CRITICAL"; then
    overall_status=1
fi

# Check for JWT secrets
if ! check_credentials "jwt.*secret.*=.*['\"][^'\"]*['\"]" "JWT secrets" "HIGH"; then
    overall_status=1
fi

# Check for private keys (exclude templates and tests)
if ! check_credentials "BEGIN PRIVATE KEY" "private keys" "CRITICAL"; then
    # Filter out template files and test files
    if grep -r "BEGIN PRIVATE KEY" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.backup" --exclude="*.template" --exclude="*.example" --exclude="*.test.js" | grep -v "Your Firebase Private Key" | grep -v "PLACEHOLDER" > /dev/null; then
        echo -e "${RED}❌ FOUND: Actual private keys (not templates)${NC}"
        grep -r "BEGIN PRIVATE KEY" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.backup" --exclude="*.template" --exclude="*.example" --exclude="*.test.js" | grep -v "Your Firebase Private Key" | grep -v "PLACEHOLDER"
        overall_status=1
    else
        echo -e "${GREEN}✅ Only template private keys found (safe)${NC}"
    fi
fi

echo ""

# Final result
if [ $overall_status -eq 0 ]; then
    echo -e "${GREEN}🎉 SECURITY VERIFICATION PASSED!${NC}"
    echo -e "${GREEN}✅ No credential leaks detected${NC}"
    echo -e "${GREEN}✅ Git status is clean${NC}"
    echo -e "${GREEN}✅ .gitignore properly configured${NC}"
    echo -e "${GREEN}✅ Environment variables used correctly${NC}"
    echo ""
    echo -e "${BLUE}🔒 Your project is secure and ready to commit!${NC}"
    exit 0
else
    echo -e "${RED}🚨 SECURITY VERIFICATION FAILED!${NC}"
    echo -e "${RED}❌ Credential leaks or security issues detected${NC}"
    echo ""
    echo -e "${YELLOW}⚠️ Please fix the issues above before committing${NC}"
    echo -e "${YELLOW}⚠️ Review the SECURITY_GUIDE.md for best practices${NC}"
    exit 1
fi
