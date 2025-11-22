#!/bin/bash

# Build script for Perpetual Trading React Native App on Mac (iOS)
# This script builds the iOS app

set -e

# Setup logging
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/build-ios-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🏗️  Building Perpetual Trading App for iOS..."
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

# Check if we're on macOS
log_info "Checking platform..."
if [[ "$OSTYPE" != "darwin"* ]]; then
    log_error "This script must be run on macOS"
    exit 1
fi
log_success "Running on macOS"

# Check if Node.js is installed
log_info "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi
log_success "Node.js found: $(node --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install 2>&1 | tee -a "$LOG_FILE"
    log_success "Dependencies installed"
else
    log_success "Dependencies already installed"
fi

# Check if CocoaPods is installed
log_info "Checking CocoaPods installation..."
if ! command -v pod &> /dev/null; then
    log_error "CocoaPods is not installed"
    log_error "Install with: sudo gem install cocoapods"
    exit 1
fi
log_success "CocoaPods found: $(pod --version)"

# Install pods
log_info "Installing iOS dependencies (CocoaPods)..."
cd ios
pod install 2>&1 | tee -a "../$LOG_FILE"
POD_EXIT_CODE=$?
cd ..

if [ $POD_EXIT_CODE -ne 0 ]; then
    log_error "CocoaPods installation failed!"
    log_error "Try fixing with: sudo gem install ffi --platform=ruby"
    exit 1
fi
log_success "CocoaPods dependencies installed"

# Detect available iOS simulator destination
log_info "Detecting iOS simulator for build..."

# First, check if there's a booted simulator and use it
BOOTED_SIMULATOR_ID=$(xcrun simctl list devices | grep "iPhone" | grep "Booted" | head -n 1 | grep -o -E '\([A-F0-9-]+\)' | tr -d '()' || true)

if [ -n "$BOOTED_SIMULATOR_ID" ]; then
    DESTINATION_ID="$BOOTED_SIMULATOR_ID"
    SIMULATOR_NAME=$(xcrun simctl list devices | grep "$DESTINATION_ID" | sed 's/^[[:space:]]*//' | cut -d '(' -f1 | xargs)
    log_success "Using booted simulator: $SIMULATOR_NAME (ID: $DESTINATION_ID)"
else
    log_info "No booted simulator found. Querying available destinations from xcodebuild..."

    # Get available destinations from xcodebuild
    DESTINATIONS_OUTPUT=$(xcodebuild -workspace ios/PerpetualTrading.xcworkspace \
      -scheme PerpetualTrading \
      -showdestinations 2>&1)

    # Extract the first iOS Simulator destination ID
    DESTINATION_ID=$(echo "$DESTINATIONS_OUTPUT" | grep "platform:iOS Simulator" | grep -v "Unavailable" | head -n 1 | grep -o 'id:[A-F0-9-]*' | cut -d: -f2)

    if [ -z "$DESTINATION_ID" ]; then
        log_error "No available iOS Simulator destination found"
        log_error "Available destinations:"
        echo "$DESTINATIONS_OUTPUT" | grep "platform:iOS Simulator"
        exit 1
    fi

    # Get the name of the simulator for logging
    DESTINATION_NAME=$(echo "$DESTINATIONS_OUTPUT" | grep "$DESTINATION_ID" | grep -o 'name:[^,]*' | cut -d: -f2 | xargs)
    log_success "Using available simulator: $DESTINATION_NAME (ID: $DESTINATION_ID)"
fi

# Build iOS app
log_info "Building iOS app with xcodebuild..."
START_TIME=$(date +%s)
xcodebuild \
  -workspace ios/PerpetualTrading.xcworkspace \
  -scheme PerpetualTrading \
  -configuration Debug \
  -destination "id=$DESTINATION_ID" \
  -derivedDataPath ios/build \
  clean build 2>&1 | tee -a "$LOG_FILE"
BUILD_EXIT_CODE=$?
END_TIME=$(date +%s)
BUILD_DURATION=$((END_TIME - START_TIME))

if [ $BUILD_EXIT_CODE -ne 0 ]; then
    log_error "Build failed!"
    log_error "Check log file: $LOG_FILE"
    exit 1
fi
log_success "Build completed in ${BUILD_DURATION}s"

# Check if build was successful
if [ -d "ios/build/Build/Products/Debug-iphonesimulator/PerpetualTrading.app" ]; then
    log_success "Build successful!"
    log_info "App location: ios/build/Build/Products/Debug-iphonesimulator/PerpetualTrading.app"

    # Get app size
    APP_SIZE=$(du -sh ios/build/Build/Products/Debug-iphonesimulator/PerpetualTrading.app | cut -f1)
    log_info "App size: $APP_SIZE"
else
    log_error "Build failed!"
    log_error "Check log file: $LOG_FILE"
    exit 1
fi

echo ""
log_success "🎉 Build completed successfully!"
echo "⏰ Finished at: $(date)"
echo "📝 Full log: $LOG_FILE"
echo ""
echo "Next steps:"
echo "  • Run the app: ./scripts/run-ios.sh"
echo "  • Run tests: ./scripts/test-ios.sh"
