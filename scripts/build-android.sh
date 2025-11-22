#!/bin/bash

# Build script for Perpetual Trading React Native App
# This script builds the Android app on macOS, Linux, and Windows (Git Bash/WSL)

set -e

# Setup logging
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/build-android-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🏗️  Building Perpetual Trading App for Android..."
echo "📝 Log file: $LOG_FILE"
echo "⏰ Started at: $(date)"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $(date '+%H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $(date '+%H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}✗${NC} $(date '+%H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $(date '+%H:%M:%S') - $1"
}

# Detect platform
log_info "Detecting platform..."
PLATFORM="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    PLATFORM="windows"
fi
log_success "Platform detected: $PLATFORM"

# Check if Node.js is installed
log_info "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi
log_success "Node.js found: $(node --version)"

# Check if npm is installed
log_info "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
fi
log_success "npm found: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install 2>&1 | tee -a "$LOG_FILE"
    log_success "Dependencies installed"
else
    log_success "Dependencies already installed"
fi

# Check if ANDROID_HOME is set
log_info "Checking Android SDK configuration..."
if [ -z "$ANDROID_HOME" ]; then
    log_warning "ANDROID_HOME is not set"
    log_info "Setting ANDROID_HOME to default location for $PLATFORM..."

    case "$PLATFORM" in
        "macos")
            export ANDROID_HOME=$HOME/Library/Android/sdk
            ;;
        "linux")
            export ANDROID_HOME=$HOME/Android/Sdk
            ;;
        "windows")
            # Try common Windows paths
            if [ -d "/c/Users/$USER/AppData/Local/Android/Sdk" ]; then
                export ANDROID_HOME="/c/Users/$USER/AppData/Local/Android/Sdk"
            elif [ -d "$HOME/AppData/Local/Android/Sdk" ]; then
                export ANDROID_HOME="$HOME/AppData/Local/Android/Sdk"
            else
                log_error "Could not find Android SDK. Please set ANDROID_HOME manually"
                exit 1
            fi
            ;;
        *)
            log_error "Unknown platform. Please set ANDROID_HOME manually"
            exit 1
            ;;
    esac
fi
log_success "ANDROID_HOME: $ANDROID_HOME"

# Check if Java is installed
log_info "Checking Java installation..."
if ! command -v java &> /dev/null; then
    log_error "Java is not installed"
    log_error "Please install Java 11 or higher"
    exit 1
fi
log_success "Java found: $(java -version 2>&1 | head -n 1)"

# Navigate to android directory
log_info "Navigating to android directory..."
cd android

# Make gradlew executable
log_info "Setting gradlew permissions..."
chmod +x gradlew

# Clean build
log_info "Cleaning previous build..."
./gradlew clean 2>&1 | tee -a "../$LOG_FILE"
CLEAN_EXIT_CODE=$?

if [ $CLEAN_EXIT_CODE -ne 0 ]; then
    log_error "Clean failed!"
    cd ..
    exit 1
fi
log_success "Clean completed"

# Build debug APK
log_info "Building debug APK..."
START_TIME=$(date +%s)
./gradlew assembleDebug 2>&1 | tee -a "../$LOG_FILE"
BUILD_EXIT_CODE=$?
END_TIME=$(date +%s)
BUILD_DURATION=$((END_TIME - START_TIME))

if [ $BUILD_EXIT_CODE -ne 0 ]; then
    log_error "Build failed!"
    log_error "Check log file: $LOG_FILE"
    cd ..
    exit 1
fi
log_success "Build completed in ${BUILD_DURATION}s"

# Check if build was successful
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    log_success "Build successful!"
    log_info "APK location: android/app/build/outputs/apk/debug/app-debug.apk"

    # Get APK size
    APK_SIZE=$(du -h app/build/outputs/apk/debug/app-debug.apk | cut -f1)
    log_info "APK size: $APK_SIZE"
else
    log_error "Build failed!"
    log_error "Check log file: $LOG_FILE"
    exit 1
fi

cd ..

echo ""
log_success "🎉 Build completed successfully!"
echo "⏰ Finished at: $(date)"
echo "📝 Full log: $LOG_FILE"
echo ""
echo "Next steps:"
echo "  • Run the app: ./scripts/run-android.sh"
echo "  • Run tests: ./scripts/test-android.sh"
