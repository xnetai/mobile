#!/bin/bash

# Run script for Perpetual Trading React Native App on Mac (iOS)
# This script starts the Metro bundler and runs the app on iOS simulator

set -e

# Setup logging
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/run-ios-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🚀 Running Perpetual Trading App on iOS..."
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

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install 2>&1 | tee -a "$LOG_FILE"
    log_success "Dependencies installed"
fi

# Check if pods are installed
if [ ! -d "ios/Pods" ]; then
    log_info "Installing CocoaPods..."
    cd ios
    pod install 2>&1 | tee -a "../$LOG_FILE"
    cd ..
    log_success "CocoaPods installed"
fi

# Check if simulator is already running and get its ID
log_info "Checking simulator status..."
SIMULATOR_ID=$(xcrun simctl list devices | grep "iPhone" | grep "Booted" | head -n 1 | grep -o -E '\([A-F0-9-]+\)' | tr -d '()' || true)

if [ -z "$SIMULATOR_ID" ]; then
    log_info "No booted simulator found. Starting iOS simulator..."

    # Try to find iPhone 15 Pro first, then iPhone 15, then any iPhone
    SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone 15 Pro" | head -n 1 | grep -o -E '\([A-F0-9-]+\)' | tr -d '()' || true)

    if [ -z "$SIMULATOR_ID" ]; then
        SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone 15" | head -n 1 | grep -o -E '\([A-F0-9-]+\)' | tr -d '()' || true)
    fi

    if [ -z "$SIMULATOR_ID" ]; then
        # Fallback to any available iPhone
        SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone" | head -n 1 | grep -o -E '\([A-F0-9-]+\)' | tr -d '()' || true)
    fi

    if [ -z "$SIMULATOR_ID" ]; then
        log_error "No iOS simulator found"
        log_error "Please create a simulator in Xcode"
        exit 1
    fi

    log_info "Booting simulator: $SIMULATOR_ID"
    xcrun simctl boot "$SIMULATOR_ID"
    open -a Simulator

    # Wait for simulator to boot
    log_info "Waiting for simulator to boot..."
    sleep 5

    log_success "Simulator is ready"
else
    # Get simulator name for logging
    SIMULATOR_NAME=$(xcrun simctl list devices | grep "$SIMULATOR_ID" | sed 's/^[[:space:]]*//' | cut -d '(' -f1 | xargs)
    log_success "Using already booted simulator: $SIMULATOR_NAME ($SIMULATOR_ID)"
fi

# Kill any existing Metro bundler
log_info "Cleaning up existing Metro bundler..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Start Metro bundler in background
log_info "Starting Metro bundler..."
npm start > metro.log 2>&1 &
METRO_PID=$!
log_success "Metro bundler started (PID: $METRO_PID)"

# Wait for Metro to start
log_info "Waiting for Metro bundler to start..."
sleep 5

# Build and run the app
log_info "Building and running app with xcodebuild..."
START_TIME=$(date +%s)
xcodebuild \
  -workspace ios/PerpetualTrading.xcworkspace \
  -scheme PerpetualTrading \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath ios/build \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  build 2>&1 | tee -a "$LOG_FILE"
END_TIME=$(date +%s)
BUILD_DURATION=$((END_TIME - START_TIME))
log_success "Build completed in ${BUILD_DURATION}s"

# Install the app on the simulator
log_info "Installing app on simulator..."
xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/PerpetualTrading.app
log_success "App installed"

# Launch the app
log_info "Launching app..."
xcrun simctl launch booted com.perpetualtrading
log_success "App launched"

echo ""
log_success "✓ App is running!"
echo "⏰ Finished at: $(date)"
echo "📝 Full log: $LOG_FILE"
echo ""
echo "Metro bundler PID: $METRO_PID"
echo "Metro log: metro.log"
echo ""
echo "To stop Metro bundler:"
echo "  kill $METRO_PID"
echo ""
echo "To view Metro logs:"
echo "  tail -f metro.log"
echo ""
echo "To view app logs:"
echo "  xcrun simctl spawn booted log stream --predicate 'processImagePath contains \"PerpetualTrading\"'"
