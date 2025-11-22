#!/bin/bash

# Build script for Perpetual Trading React Native App on Mac (iOS)
# This script builds the iOS app

set -e

echo "🏗️  Building Perpetual Trading App for iOS..."

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

echo -e "${GREEN}✓${NC} Running on macOS"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo -e "${RED}Error: CocoaPods is not installed${NC}"
    echo "Install with: sudo gem install cocoapods"
    exit 1
fi

echo -e "${GREEN}✓${NC} CocoaPods found: $(pod --version)"

# Install pods
echo "📦 Installing iOS dependencies (CocoaPods)..."
cd ios
pod install
cd ..

echo -e "${GREEN}✓${NC} CocoaPods installed"

# Build iOS app
echo "🔨 Building iOS app..."
xcodebuild \
  -workspace ios/PerpetualTrading.xcworkspace \
  -scheme PerpetualTrading \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath ios/build \
  clean build

# Check if build was successful
if [ -d "ios/build/Build/Products/Debug-iphonesimulator/PerpetualTrading.app" ]; then
    echo -e "${GREEN}✓${NC} Build successful!"
    echo "📱 App location: ios/build/Build/Products/Debug-iphonesimulator/PerpetualTrading.app"

    # Get app size
    APP_SIZE=$(du -sh ios/build/Build/Products/Debug-iphonesimulator/PerpetualTrading.app | cut -f1)
    echo "📦 App size: $APP_SIZE"
else
    echo -e "${RED}✗${NC} Build failed!"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  • Run the app: ./scripts/run-ios.sh"
echo "  • Run tests: ./scripts/test-ios.sh"
