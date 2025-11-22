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

# Build iOS app
log_info "Building iOS app with xcodebuild..."
START_TIME=$(date +%s)
xcodebuild \
  -workspace ios/PerpetualTrading.xcworkspace \
  -scheme PerpetualTrading \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
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
