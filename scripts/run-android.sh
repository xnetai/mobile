#!/bin/bash

# Run script for Perpetual Trading React Native App on Mac
# This script starts the Metro bundler and runs the app on Android emulator

set -e

# Setup logging
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/run-android-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🚀 Running Perpetual Trading App on Android..."
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

# Check if ANDROID_HOME is set
log_info "Checking Android SDK configuration..."
if [ -z "$ANDROID_HOME" ]; then
    log_warning "ANDROID_HOME is not set"
    log_info "Setting ANDROID_HOME to default location..."
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
fi
log_success "ANDROID_HOME: $ANDROID_HOME"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install 2>&1 | tee -a "$LOG_FILE"
    log_success "Dependencies installed"
fi

# Check if emulator is already running
log_info "Checking emulator status..."
if adb devices | grep -q "emulator"; then
    log_success "Android emulator is already running"
else
    log_info "Starting Android emulator..."

    # List available AVDs
    AVDS=$($ANDROID_HOME/emulator/emulator -list-avds)

    if [ -z "$AVDS" ]; then
        log_error "No Android Virtual Devices found"
        log_error "Please create an AVD using Android Studio or avdmanager"
        exit 1
    fi

    # Use the first available AVD
    FIRST_AVD=$(echo "$AVDS" | head -n 1)
    log_info "Using AVD: $FIRST_AVD"

    # Start emulator in background
    $ANDROID_HOME/emulator/emulator -avd "$FIRST_AVD" -no-snapshot-load > emulator.log 2>&1 &
    EMULATOR_PID=$!
    log_info "Emulator started (PID: $EMULATOR_PID)"

    # Wait for emulator to boot
    log_info "Waiting for emulator to boot..."
    adb wait-for-device

    # Wait for boot to complete
    while [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do
        log_info "Still booting..."
        sleep 2
    done

    log_success "Emulator is ready"
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

# Build and install the app
log_info "Building and installing app..."
cd android
./gradlew installDebug 2>&1 | tee -a "../$LOG_FILE"
cd ..
log_success "App installed"

# Launch the app
log_info "Launching app..."
adb shell am start -n com.perpetualtrading/.MainActivity
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
echo "  adb logcat | grep ReactNative"
