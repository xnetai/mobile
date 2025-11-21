#!/bin/bash

# Test script for Perpetual Trading React Native App on Mac
# This script runs E2E tests with Detox and captures screenshots

set -e

echo "🧪 Testing Perpetual Trading App..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${YELLOW}Warning: This script is designed for macOS${NC}"
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
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}Warning: ANDROID_HOME is not set${NC}"
    echo "Setting ANDROID_HOME to default location..."
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
fi

echo -e "${GREEN}✓${NC} ANDROID_HOME: $ANDROID_HOME"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if emulator is running
if ! adb devices | grep -q "emulator"; then
    echo "📱 Starting Android emulator..."

    # List available AVDs
    AVDS=$($ANDROID_HOME/emulator/emulator -list-avds)

    if [ -z "$AVDS" ]; then
        echo -e "${RED}Error: No Android Virtual Devices found${NC}"
        echo "Please create an AVD with the following specifications:"
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
        echo -e "${YELLOW}Warning: Pixel_3a_API_34 not found, using $AVD_NAME${NC}"
    fi

    echo "Starting AVD: $AVD_NAME"

    # Start emulator in background
    $ANDROID_HOME/emulator/emulator -avd "$AVD_NAME" -no-snapshot-load > emulator.log 2>&1 &
    EMULATOR_PID=$!

    # Wait for emulator to boot
    echo "Waiting for emulator to boot..."
    adb wait-for-device

    # Wait for boot to complete
    BOOT_TIMEOUT=300
    BOOT_COUNT=0
    while [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do
        echo "Still booting... ($BOOT_COUNT/$BOOT_TIMEOUT)"
        sleep 2
        BOOT_COUNT=$((BOOT_COUNT + 2))
        if [ $BOOT_COUNT -gt $BOOT_TIMEOUT ]; then
            echo -e "${RED}Error: Emulator boot timeout${NC}"
            exit 1
        fi
    done

    # Give it a few more seconds to fully initialize
    echo "Waiting for system to fully initialize..."
    sleep 10

    echo -e "${GREEN}✓${NC} Emulator is ready (PID: $EMULATOR_PID)"
else
    echo -e "${GREEN}✓${NC} Emulator is already running"
fi

# Kill any existing Metro bundler
echo "🧹 Cleaning up existing Metro bundler..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Start Metro bundler in background
echo "📦 Starting Metro bundler..."
npm start > metro-test.log 2>&1 &
METRO_PID=$!

# Wait for Metro to start
echo "Waiting for Metro bundler to start..."
sleep 8

# Build the app and test APK if requested
if [ "$RUN_BUILD" = true ]; then
    echo "🔨 Building app and test APK for Detox..."
    npm run build:e2e

    if [ $? -ne 0 ]; then
        echo -e "${RED}✗${NC} Build failed!"
        kill $METRO_PID 2>/dev/null || true
        exit 1
    fi

    echo -e "${GREEN}✓${NC} Build successful"
fi

# Exit if build-only mode
if [ "$RUN_TESTS" = false ]; then
    echo -e "${BLUE}Build-only mode, skipping tests${NC}"
    kill $METRO_PID 2>/dev/null || true
    exit 0
fi

# Create artifacts directory
mkdir -p artifacts

# Run Detox tests
echo ""
echo "🧪 Running E2E tests with Detox..."
echo "Configuration: $CONFIGURATION"
echo ""

npm run test:e2e -- --configuration $CONFIGURATION

TEST_EXIT_CODE=$?

# Kill Metro bundler
kill $METRO_PID 2>/dev/null || true

# Check test results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} All tests passed!"
    echo ""
else
    echo ""
    echo -e "${RED}✗${NC} Some tests failed!"
    echo ""
fi

# Show artifacts
if [ -d "artifacts" ] && [ "$(ls -A artifacts)" ]; then
    echo "📸 Screenshots saved to: artifacts/"
    echo ""
    echo "Available screenshots:"
    ls -lh artifacts/*.png 2>/dev/null | awk '{print "  • " $9 " (" $5 ")"}'
    echo ""
fi

# Show test summary
echo "Test Summary:"
echo "  • Configuration: $CONFIGURATION"
echo "  • Exit code: $TEST_EXIT_CODE"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}🎉 Testing completed successfully!${NC}"
else
    echo -e "${RED}⚠️  Testing completed with failures${NC}"
    echo ""
    echo "To debug:"
    echo "  • Check artifacts/ directory for screenshots"
    echo "  • Check metro-test.log for Metro bundler logs"
    echo "  • Check emulator.log for emulator logs"
    echo "  • Run tests again with: npm run test:e2e"
fi

exit $TEST_EXIT_CODE
