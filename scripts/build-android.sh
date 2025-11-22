#!/bin/bash

# Build script for Perpetual Trading React Native App on Mac
# This script builds the Android app

set -e

echo "🏗️  Building Perpetual Trading App..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${YELLOW}Warning: This script is designed for macOS${NC}"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} npm found: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# Check if ANDROID_HOME is set
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}Warning: ANDROID_HOME is not set${NC}"
    echo "Setting ANDROID_HOME to default location..."
    export ANDROID_HOME=$HOME/Library/Android/sdk
fi

echo -e "${GREEN}✓${NC} ANDROID_HOME: $ANDROID_HOME"

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo -e "${RED}Error: Java is not installed${NC}"
    echo "Please install Java 11 or higher"
    exit 1
fi

echo -e "${GREEN}✓${NC} Java found: $(java -version 2>&1 | head -n 1)"

# Navigate to android directory
cd android

# Make gradlew executable
chmod +x gradlew

# Clean build
echo "🧹 Cleaning previous build..."
./gradlew clean

# Build debug APK
echo "🔨 Building debug APK..."
./gradlew assembleDebug

# Check if build was successful
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo -e "${GREEN}✓${NC} Build successful!"
    echo "📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk"

    # Get APK size
    APK_SIZE=$(du -h app/build/outputs/apk/debug/app-debug.apk | cut -f1)
    echo "📦 APK size: $APK_SIZE"
else
    echo -e "${RED}✗${NC} Build failed!"
    exit 1
fi

cd ..

echo ""
echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  • Run the app: ./scripts/run.sh"
echo "  • Run tests: ./scripts/test.sh"
