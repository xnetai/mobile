#!/bin/bash

# Test script for Perpetual Trading React Native App on Mac
# This script runs E2E tests with Detox and captures screenshots

set -e

# Setup logging
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/test-android-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🧪 Testing Perpetual Trading App on Android..."
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
    log_warning "This script is designed for macOS"
fi

# Parse command line arguments
RUN_BUILD=true
RUN_TESTS=true
CONFIGURATION="android.emu.debug"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --no-build) RUN_BUILD=false ;;
        --build-only) RUN_TESTS=false ;;
        --config) CONFIGURATION="$2"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Check if ANDROID_HOME is set
log_info "Checking Android SDK configuration..."
if [ -z "$ANDROID_HOME" ]; then
    log_warning "ANDROID_HOME is not set"
    log_info "Setting ANDROID_HOME to default location..."
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
fi
log_success "ANDROID_HOME: $ANDROID_HOME"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install 2>&1 | tee -a "$LOG_FILE"
    log_success "Dependencies installed"
fi

# Check if emulator is running
log_info "Checking emulator status..."
if ! adb devices | grep -q "emulator"; then
    log_info "Starting Android emulator..."

    # List available AVDs
    AVDS=$($ANDROID_HOME/emulator/emulator -list-avds)

    if [ -z "$AVDS" ]; then
        log_error "No Android Virtual Devices found"
        log_error "Please create an AVD with the following specifications:"
        echo "  • Device: Pixel 3a or similar"
        echo "  • API Level: 34 (Android 14)"
        echo "  • AVD Name: Pixel_3a_API_34 (or update .detoxrc.js)"
        exit 1
    fi

    # Try to find the configured AVD first
    if echo "$AVDS" | grep -q "Pixel_3a_API_34"; then
        AVD_NAME="Pixel_3a_API_34"
    else
        # Use the first available AVD
        AVD_NAME=$(echo "$AVDS" | head -n 1)
        log_warning "Pixel_3a_API_34 not found, using $AVD_NAME"
    fi

    log_info "Using AVD: $AVD_NAME"

    # Start emulator in background
    $ANDROID_HOME/emulator/emulator -avd "$AVD_NAME" -no-snapshot-load > emulator.log 2>&1 &
    EMULATOR_PID=$!
    log_info "Emulator started (PID: $EMULATOR_PID)"

    # Wait for emulator to boot
    log_info "Waiting for emulator to boot..."
    adb wait-for-device

    # Wait for boot to complete
    BOOT_TIMEOUT=300
    BOOT_COUNT=0
    while [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do
        log_info "Still booting... ($BOOT_COUNT/$BOOT_TIMEOUT)"
        sleep 2
        BOOT_COUNT=$((BOOT_COUNT + 2))
        if [ $BOOT_COUNT -gt $BOOT_TIMEOUT ]; then
            log_error "Emulator boot timeout"
            exit 1
        fi
    done

    # Give it a few more seconds to fully initialize
    log_info "Waiting for system to fully initialize..."
    sleep 10

    log_success "Emulator is ready (PID: $EMULATOR_PID)"
else
    log_success "Emulator is already running"
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

# Build the app and test APK if requested
if [ "$RUN_BUILD" = true ]; then
    log_info "Building app and test APK for Detox..."
    START_TIME=$(date +%s)
    npm run build:e2e 2>&1 | tee -a "$LOG_FILE"
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
npm run test:e2e -- --configuration $CONFIGURATION 2>&1 | tee -a "$LOG_FILE"
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
    echo "  • Check emulator.log for emulator logs"
    echo "  • Check $LOG_FILE for full test logs"
    echo "  • Run tests again with: npm run test:e2e"
fi

echo ""
echo "⏰ Finished at: $(date)"
echo "📝 Full log: $LOG_FILE"

exit $TEST_EXIT_CODE
