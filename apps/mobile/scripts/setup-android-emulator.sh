#!/bin/bash

# Android Emulator Setup Script for Flow Mobile App
# This script sets up the Android emulator for testing the Flow app with full backend support

set -e

echo "🚀 Setting up Android Emulator for Flow Mobile App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Android SDK is installed
check_android_sdk() {
    print_status "Checking Android SDK installation..."
    
    if [ -z "$ANDROID_HOME" ]; then
        print_error "ANDROID_HOME environment variable is not set"
        print_status "Please set ANDROID_HOME to your Android SDK path"
        print_status "Example: export ANDROID_HOME=/Users/username/Library/Android/sdk"
        exit 1
    fi
    
    if [ ! -d "$ANDROID_HOME" ]; then
        print_error "Android SDK directory not found at $ANDROID_HOME"
        exit 1
    fi
    
    print_success "Android SDK found at $ANDROID_HOME"
}

# Check if emulator is installed
check_emulator() {
    print_status "Checking Android Emulator installation..."
    
    if ! command -v emulator &> /dev/null; then
        print_error "Android Emulator not found in PATH"
        print_status "Please install Android Emulator through Android Studio SDK Manager"
        exit 1
    fi
    
    print_success "Android Emulator found"
}

# Create AVD if it doesn't exist
create_avd() {
    local avd_name="Flow_Emulator"
    local api_level="33"
    local target="google_apis"
    
    print_status "Checking for existing AVD: $avd_name"
    
    if ! avdmanager list avd | grep -q "$avd_name"; then
        print_status "Creating new AVD: $avd_name"
        
        # Create AVD with specific configuration
        echo "no" | avdmanager create avd \
            --name "$avd_name" \
            --package "system-images;android-$api_level;$target;x86_64" \
            --device "pixel_6" \
            --force
        
        print_success "AVD created: $avd_name"
    else
        print_success "AVD already exists: $avd_name"
    fi
}

# Start emulator
start_emulator() {
    local avd_name="Flow_Emulator"
    
    print_status "Starting Android Emulator..."
    
    # Check if emulator is already running
    if adb devices | grep -q "emulator"; then
        print_warning "Emulator is already running"
        return 0
    fi
    
    # Start emulator in background
    emulator -avd "$avd_name" \
        -no-audio \
        -no-window \
        -gpu swiftshader_indirect \
        -memory 4096 \
        -cores 4 \
        -skin 1080x1920 \
        -netdelay none \
        -netspeed full &
    
    local emulator_pid=$!
    
    print_status "Emulator starting (PID: $emulator_pid)..."
    print_status "Waiting for emulator to be ready..."
    
    # Wait for emulator to be ready
    local timeout=300
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if adb devices | grep -q "emulator.*device"; then
            print_success "Emulator is ready!"
            break
        fi
        
        sleep 5
        elapsed=$((elapsed + 5))
        print_status "Waiting... ($elapsed/$timeout seconds)"
    done
    
    if [ $elapsed -ge $timeout ]; then
        print_error "Emulator failed to start within $timeout seconds"
        exit 1
    fi
}

# Install Google Play Services
install_google_play() {
    print_status "Installing Google Play Services..."
    
    # Wait for emulator to be fully booted
    adb wait-for-device
    adb shell getprop sys.boot_completed | grep -q "1"
    
    # Install Google Play Services APK if available
    if [ -f "$ANDROID_HOME/extras/google/google_play_services/apk/google_play_services.apk" ]; then
        adb install -r "$ANDROID_HOME/extras/google/google_play_services/apk/google_play_services.apk"
        print_success "Google Play Services installed"
    else
        print_warning "Google Play Services APK not found - using system image with Play Store"
    fi
}

# Configure emulator for Firebase
configure_firebase() {
    print_status "Configuring emulator for Firebase..."
    
    # Enable Google Services
    adb shell settings put global google_services_enabled 1
    
    # Set up Google account (optional)
    print_status "You may need to add a Google account manually in the emulator"
    print_status "Go to Settings > Accounts > Add Account > Google"
}

# Build and install the app
build_and_install() {
    print_status "Building and installing Flow app..."
    
    cd "$(dirname "$0")/.."
    
    # Clean previous builds
    print_status "Cleaning previous builds..."
    ./gradlew clean
    
    # Build debug APK
    print_status "Building debug APK..."
    ./gradlew assembleDebug
    
    # Install APK
    print_status "Installing APK on emulator..."
    adb install -r android/app/build/outputs/apk/debug/app-debug.apk
    
    print_success "Flow app installed successfully!"
}

# Main execution
main() {
    print_status "Starting Android Emulator setup for Flow Mobile App..."
    
    check_android_sdk
    check_emulator
    create_avd
    start_emulator
    install_google_play
    configure_firebase
    build_and_install
    
    print_success "🎉 Android Emulator setup completed!"
    print_status "You can now run the Flow app on the emulator"
    print_status "Use 'npm run android:dev' to start the development server"
    print_status "Use 'npm run android:emulator' to run on emulator"
}

# Run main function
main "$@"