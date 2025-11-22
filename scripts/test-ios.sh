#!/bin/bash

# Test script for Perpetual Trading React Native App on Mac (iOS)
# This script runs E2E tests with Detox and captures screenshots

set -e

# Setup logging
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/test-ios-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🧪 Testing Perpetual Trading App on iOS..."
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

# Parse command line arguments
RUN_BUILD=true
RUN_TESTS=true
CONFIGURATION="ios.sim.debug"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --no-build) RUN_BUILD=false ;;
        --build-only) RUN_TESTS=false ;;
        --config) CONFIGURATION="$2"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install 2>&1 | tee -a "$LOG_FILE"
    log_success "Dependencies installed"
fi

# Check if Detox CLI is installed
log_info "Checking Detox CLI installation..."
if ! command -v detox &> /dev/null; then
    log_info "Installing Detox CLI..."
    npm install -g detox-cli 2>&1 | tee -a "$LOG_FILE"
    log_success "Detox CLI installed"
else
    log_success "Detox CLI found"
fi

# Install pods if needed
if [ ! -d "ios/Pods" ]; then
    log_info "Installing CocoaPods..."
    cd ios
    pod install 2>&1 | tee -a "../$LOG_FILE"
    cd ..
    log_success "CocoaPods installed"
fi

# Check if applesimutils is installed (required for Detox on iOS)
log_info "Checking applesimutils installation..."
if ! command -v applesimutils &> /dev/null; then
    log_warning "applesimutils is not installed"
    log_info "Installing applesimutils..."
    brew tap wix/brew 2>&1 | tee -a "$LOG_FILE"
    brew install applesimutils 2>&1 | tee -a "$LOG_FILE"
    log_success "applesimutils installed"
else
    log_success "applesimutils found"
fi

# Check if simulator is running, if not start one
log_info "Checking simulator status..."
SIMULATOR_RUNNING=$(xcrun simctl list devices | grep "iPhone" | grep "Booted" || true)

if [ -z "$SIMULATOR_RUNNING" ]; then
    log_info "Starting iOS simulator..."

    # Get list of available iPhone simulators
    SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone 15" | head -n 1 | grep -o -E '\(([A-F0-9-]+)\)' | tr -d '()')

    if [ -z "$SIMULATOR_ID" ]; then
        # Fallback to any available iPhone
        SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone" | head -n 1 | grep -o -E '\(([A-F0-9-]+)\)' | tr -d '()')
    fi

    if [ -z "$SIMULATOR_ID" ]; then
        log_error "No iOS simulator found"
        log_error "Please create a simulator in Xcode"
        exit 1
    fi

    log_info "Using simulator: $SIMULATOR_ID"
    xcrun simctl boot "$SIMULATOR_ID"
    open -a Simulator

    # Wait for simulator to boot
    log_info "Waiting for simulator to boot..."
    sleep 5

    log_success "Simulator is ready"
else
    log_success "Simulator is already running"
fi

# Kill any existing Metro bundler
log_info "Cleaning up existing Metro bundler..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Start Metro bundler in background
log_info "Starting Metro bundler..."
npm start > metro-test.log 2>&1 &
METRO_PID=$!
log_success "Metro bundler started (PID: $METRO_PID)"

# Wait for Metro to start
log_info "Waiting for Metro bundler to start..."
sleep 8

# Build the app and test if requested
if [ "$RUN_BUILD" = true ]; then
    log_info "Building app for Detox..."
    START_TIME=$(date +%s)
    npm run build:e2e:ios 2>&1 | tee -a "$LOG_FILE"
    BUILD_EXIT_CODE=$?
    END_TIME=$(date +%s)
    BUILD_DURATION=$((END_TIME - START_TIME))

    if [ $BUILD_EXIT_CODE -ne 0 ]; then
        log_error "Build failed!"
        kill $METRO_PID 2>/dev/null || true
        exit 1
    fi

    log_success "Build completed in ${BUILD_DURATION}s"
fi

# Exit if build-only mode
if [ "$RUN_TESTS" = false ]; then
    log_info "Build-only mode, skipping tests"
    kill $METRO_PID 2>/dev/null || true
    exit 0
fi

# Create artifacts directory
log_info "Creating artifacts directory..."
mkdir -p artifacts

# Run Detox tests
echo ""
log_info "Running E2E tests with Detox..."
log_info "Configuration: $CONFIGURATION"
echo ""

TEST_START_TIME=$(date +%s)
npm run test:e2e:ios -- --configuration $CONFIGURATION 2>&1 | tee -a "$LOG_FILE"
TEST_EXIT_CODE=$?
TEST_END_TIME=$(date +%s)
TEST_DURATION=$((TEST_END_TIME - TEST_START_TIME))

# Kill Metro bundler
kill $METRO_PID 2>/dev/null || true

# Check test results
echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    log_success "All tests passed! (${TEST_DURATION}s)"
else
    log_error "Some tests failed! (${TEST_DURATION}s)"
fi
echo ""

# Show artifacts
if [ -d "artifacts" ] && [ "$(ls -A artifacts)" ]; then
    log_info "Screenshots saved to: artifacts/"
    echo ""
    echo "Available screenshots:"
    ls -lh artifacts/*.png 2>/dev/null | awk '{print "  • " $9 " (" $5 ")"}'
    echo ""
fi

# Show test summary
echo ""
log_info "Test Summary:"
echo "  • Configuration: $CONFIGURATION"
echo "  • Exit code: $TEST_EXIT_CODE"
echo "  • Test duration: ${TEST_DURATION}s"
echo "  • Metro bundler PID: $METRO_PID"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    log_success "🎉 Testing completed successfully!"
else
    log_error "⚠️  Testing completed with failures"
    echo ""
    echo "To debug:"
    echo "  • Check artifacts/ directory for screenshots"
    echo "  • Check metro-test.log for Metro bundler logs"
    echo "  • Check $LOG_FILE for full test logs"
    echo "  • Run tests again with: npm run test:e2e:ios"
fi

echo ""
echo "⏰ Finished at: $(date)"
echo "📝 Full log: $LOG_FILE"

exit $TEST_EXIT_CODE
