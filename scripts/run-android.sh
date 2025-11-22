#!/bin/bash

# Run script for Perpetual Trading React Native App on Mac
# This script starts the Metro bundler and runs the app on Android emulator

set -e

echo "🚀 Running Perpetual Trading App..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${YELLOW}Warning: This script is designed for macOS${NC}"
fi

# Check if ANDROID_HOME is set
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}Warning: ANDROID_HOME is not set${NC}"
    echo "Setting ANDROID_HOME to default location..."
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if emulator is already running
if adb devices | grep -q "emulator"; then
    echo -e "${GREEN}✓${NC} Android emulator is already running"
else
    echo "📱 Starting Android emulator..."

    # List available AVDs
    AVDS=$($ANDROID_HOME/emulator/emulator -list-avds)

    if [ -z "$AVDS" ]; then
        echo -e "${RED}Error: No Android Virtual Devices found${NC}"
        echo "Please create an AVD using Android Studio or avdmanager"
        exit 1
    fi

    # Use the first available AVD
    FIRST_AVD=$(echo "$AVDS" | head -n 1)
    echo "Using AVD: $FIRST_AVD"

    # Start emulator in background
    $ANDROID_HOME/emulator/emulator -avd "$FIRST_AVD" -no-snapshot-load > /dev/null 2>&1 &

    # Wait for emulator to boot
    echo "Waiting for emulator to boot..."
    adb wait-for-device

    # Wait for boot to complete
    while [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do
        echo "Still booting..."
        sleep 2
    done

    echo -e "${GREEN}✓${NC} Emulator is ready"
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

# Build and install the app
echo "🔨 Building and installing app..."
cd android
./gradlew installDebug
cd ..

# Launch the app
echo "🚀 Launching app..."
adb shell am start -n com.perpetualtrading/.MainActivity

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
echo "  adb logcat | grep ReactNative"
