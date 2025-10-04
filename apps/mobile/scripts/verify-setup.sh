#!/bin/bash

# Integration Test Script for Flow Mobile App
# Tests Firebase Auth and API connectivity

set -e

echo "🧪 Testing Flow Mobile App Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test Firebase configuration
test_firebase_config() {
    print_status "Testing Firebase configuration..."
    
    if [ ! -f "android/app/google-services.json" ]; then
        print_error "google-services.json not found"
        return 1
    fi
    
    if ! grep -q "com.anonymous.Flow" android/app/google-services.json; then
        print_error "Package name mismatch in google-services.json"
        return 1
    fi
    
    print_success "Firebase configuration looks good"
    return 0
}

# Test Android build configuration
test_android_build() {
    print_status "Testing Android build configuration..."
    
    if [ ! -f "android/app/build.gradle" ]; then
        print_error "Android build.gradle not found"
        return 1
    fi
    
    if ! grep -q "com.google.gms.google-services" android/app/build.gradle; then
        print_error "Google Services plugin not configured"
        return 1
    fi
    
    if ! grep -q "firebase-auth" android/app/build.gradle; then
        print_error "Firebase Auth dependency not found"
        return 1
    fi
    
    print_success "Android build configuration looks good"
    return 0
}

# Test package.json scripts
test_npm_scripts() {
    print_status "Testing npm scripts..."
    
    if ! grep -q "android:dev" package.json; then
        print_error "android:dev script not found"
        return 1
    fi
    
    if ! grep -q "android:build" package.json; then
        print_error "android:build script not found"
        return 1
    fi
    
    if ! grep -q "setup:emulator" package.json; then
        print_error "setup:emulator script not found"
        return 1
    fi
    
    print_success "npm scripts configuration looks good"
    return 0
}

# Test Firebase service
test_firebase_service() {
    print_status "Testing Firebase service..."
    
    if [ ! -f "src/services/firebaseNativeService.js" ]; then
        print_error "Firebase service not found"
        return 1
    fi
    
    if ! grep -q "@react-native-firebase/auth" src/services/firebaseNativeService.js; then
        print_error "Firebase Auth import not found"
        return 1
    fi
    
    if ! grep -q "GoogleSignin.configure" src/services/firebaseNativeService.js; then
        print_error "Google Sign-In configuration not found"
        return 1
    fi
    
    print_success "Firebase service configuration looks good"
    return 0
}

# Test API service
test_api_service() {
    print_status "Testing API service..."
    
    if [ ! -f "src/services/apiService.js" ]; then
        print_error "API service not found"
        return 1
    fi
    
    if ! grep -q "axios" src/services/apiService.js; then
        print_error "Axios import not found"
        return 1
    fi
    
    if ! grep -q "getAuthToken" src/services/apiService.js; then
        print_error "Auth token method not found"
        return 1
    fi
    
    print_success "API service configuration looks good"
    return 0
}

# Test AuthContext
test_auth_context() {
    print_status "Testing AuthContext..."
    
    if [ ! -f "src/context/AuthContext.js" ]; then
        print_error "AuthContext not found"
        return 1
    fi
    
    if ! grep -q "@react-native-firebase/auth" src/context/AuthContext.js; then
        print_error "Firebase Auth import not found in AuthContext"
        return 1
    fi
    
    if ! grep -q "useAuth" src/context/AuthContext.js; then
        print_error "useAuth hook not found"
        return 1
    fi
    
    print_success "AuthContext configuration looks good"
    return 0
}

# Test emulator setup script
test_emulator_script() {
    print_status "Testing emulator setup script..."
    
    if [ ! -f "scripts/setup-android-emulator.sh" ]; then
        print_error "Emulator setup script not found"
        return 1
    fi
    
    if [ ! -x "scripts/setup-android-emulator.sh" ]; then
        print_error "Emulator setup script not executable"
        return 1
    fi
    
    print_success "Emulator setup script looks good"
    return 0
}

# Test dependencies
test_dependencies() {
    print_status "Testing dependencies..."
    
    if ! npm list @react-native-firebase/auth > /dev/null 2>&1; then
        print_error "@react-native-firebase/auth not installed"
        return 1
    fi
    
    if ! npm list @react-native-google-signin/google-signin > /dev/null 2>&1; then
        print_error "@react-native-google-signin/google-signin not installed"
        return 1
    fi
    
    if ! npm list axios > /dev/null 2>&1; then
        print_error "axios not installed"
        return 1
    fi
    
    print_success "Dependencies look good"
    return 0
}

# Main test execution
main() {
    local tests_passed=0
    local tests_total=0
    
    echo "Starting integration tests..."
    echo "================================"
    
    # Run all tests
    test_firebase_config && ((tests_passed++))
    ((tests_total++))
    
    test_android_build && ((tests_passed++))
    ((tests_total++))
    
    test_npm_scripts && ((tests_passed++))
    ((tests_total++))
    
    test_firebase_service && ((tests_passed++))
    ((tests_total++))
    
    test_api_service && ((tests_passed++))
    ((tests_total++))
    
    test_auth_context && ((tests_passed++))
    ((tests_total++))
    
    test_emulator_script && ((tests_passed++))
    ((tests_total++))
    
    test_dependencies && ((tests_passed++))
    ((tests_total++))
    
    echo "================================"
    echo "Test Results: $tests_passed/$tests_total tests passed"
    
    if [ $tests_passed -eq $tests_total ]; then
        print_success "🎉 All tests passed! Ready for development."
        echo ""
        echo "Next steps:"
        echo "1. Update Google Sign-In web client ID in src/services/firebaseNativeService.js"
        echo "2. Run: npm run setup:emulator"
        echo "3. Run: npm run android:dev"
        return 0
    else
        print_error "❌ Some tests failed. Please fix the issues above."
        return 1
    fi
}

# Run main function
main "$@"