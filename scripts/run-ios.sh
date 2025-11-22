#!/bin/bash

# Run script for Perpetual Trading React Native App on Mac (iOS)
# This script starts the Metro bundler and runs the app on iOS simulator

set -e

echo "🚀 Running Perpetual Trading App on iOS..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: This script must be run on macOS${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if pods are installed
if [ ! -d "ios/Pods" ]; then
    echo "📦 Installing CocoaPods..."
    cd ios
    pod install
    cd ..
fi

# Check if simulator is already running
SIMULATOR_RUNNING=$(xcrun simctl list devices | grep "iPhone" | grep "Booted" || true)

if [ -z "$SIMULATOR_RUNNING" ]; then
    echo "📱 Starting iOS simulator..."

    # Get list of available iPhone simulators
    SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone 15" | head -n 1 | grep -o -E '\(([A-F0-9-]+)\)' | tr -d '()')

    if [ -z "$SIMULATOR_ID" ]; then
        # Fallback to any available iPhone
        SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone" | head -n 1 | grep -o -E '\(([A-F0-9-]+)\)' | tr -d '()')
    fi

    if [ -z "$SIMULATOR_ID" ]; then
        echo -e "${RED}Error: No iOS simulator found${NC}"
        echo "Please create a simulator in Xcode"
        exit 1
    fi

    echo "Using simulator: $SIMULATOR_ID"
    xcrun simctl boot "$SIMULATOR_ID"
    open -a Simulator

    # Wait for simulator to boot
    echo "Waiting for simulator to boot..."
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
npm start > metro.log 2>&1 &
METRO_PID=$!

# Wait for Metro to start
echo "Waiting for Metro bundler to start..."
sleep 5

# Build and run the app
echo "🔨 Building and running app..."
xcodebuild \
  -workspace ios/PerpetualTrading.xcworkspace \
  -scheme PerpetualTrading \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath ios/build \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  build

# Install the app on the simulator
echo "📲 Installing app on simulator..."
xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/PerpetualTrading.app

# Launch the app
echo "🚀 Launching app..."
xcrun simctl launch booted com.perpetualtrading

echo ""
echo -e "${GREEN}✓${NC} App is running!"
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
