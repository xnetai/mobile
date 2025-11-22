#!/bin/bash

# Test script for Perpetual Trading React Native App on Mac (iOS)
# This script runs E2E tests with Detox and captures screenshots

set -e

echo "🧪 Testing Perpetual Trading App on iOS..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: This script must be run on macOS${NC}"
    exit 1
fi

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

echo -e "${GREEN}✓${NC} Running on macOS"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Detox CLI is installed
if ! command -v detox &> /dev/null; then
    echo "📦 Installing Detox CLI..."
    npm install -g detox-cli
fi

# Install pods if needed
if [ ! -d "ios/Pods" ]; then
    echo "📦 Installing CocoaPods..."
    cd ios
    pod install
    cd ..
fi

# Check if applesimutils is installed (required for Detox on iOS)
if ! command -v applesimutils &> /dev/null; then
    echo -e "${YELLOW}Warning: applesimutils is not installed${NC}"
    echo "Installing applesimutils..."
    brew tap wix/brew
    brew install applesimutils
fi

# Check if simulator is running, if not start one
SIMULATOR_RUNNING=$(xcrun simctl list devices | grep "iPhone" | grep "Booted" || true)

if [ -z "$SIMULATOR_RUNNING" ]; then
    echo "📱 Starting iOS simulator..."

    SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone 15" | head -n 1 | grep -o -E '\(([A-F0-9-]+)\)' | tr -d '()')

    if [ -z "$SIMULATOR_ID" ]; then
        SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone" | head -n 1 | grep -o -E '\(([A-F0-9-]+)\)' | tr -d '()')
    fi

    if [ -z "$SIMULATOR_ID" ]; then
        echo -e "${RED}Error: No iOS simulator found${NC}"
        exit 1
    fi

    echo "Using simulator: $SIMULATOR_ID"
    xcrun simctl boot "$SIMULATOR_ID"
    open -a Simulator

    sleep 5
    echo -e "${GREEN}✓${NC} Simulator is ready"
else
    echo -e "${GREEN}✓${NC} Simulator is already running"
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

# Build the app and test if requested
if [ "$RUN_BUILD" = true ]; then
    echo "🔨 Building app for Detox..."
    npm run build:e2e:ios

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

npm run test:e2e:ios -- --configuration $CONFIGURATION

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
    echo "  • Run tests again with: npm run test:e2e:ios"
fi

exit $TEST_EXIT_CODE
