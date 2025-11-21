# Perpetual Trading MVP

A React Native mobile application for perpetual trading with long/short positions and up to 100x leverage. This MVP includes mock price feeds, balance management, margin calls, and comprehensive E2E testing.

## Features

### Core Trading Features
- **Perpetual Trading**: Trade with long or short positions
- **High Leverage**: Support for 1x to 100x leverage
- **Real-time Price Updates**: Mock price feed with simulated market movements
- **Position Management**: Track open, closed, and liquidated positions
- **Margin Calls**: Automatic margin call detection and warnings
- **Liquidation**: Automatic position liquidation when price reaches liquidation level
- **P&L Tracking**: Real-time unrealized profit and loss calculation

### Technical Features
- **React Native 0.73**: Latest stable version
- **TypeScript**: Full type safety
- **Zustand**: State management
- **React Navigation**: Tab-based navigation
- **Detox**: E2E testing with screenshot capture
- **Mock Data**: Simulated prices and balances for testing

## Prerequisites

### Required
- **macOS**: This setup is designed for Mac
- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Java**: JDK 11 or higher
- **Android Studio**: With Android SDK
- **Android Emulator**: Configured AVD

### Environment Setup

1. **Install Node.js**
   ```bash
   brew install node
   ```

2. **Install Java**
   ```bash
   brew install openjdk@11
   ```

3. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK (API Level 34)
   - Configure ANDROID_HOME:
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```

4. **Create Android Virtual Device (AVD)**
   - Open Android Studio > AVD Manager
   - Create a new AVD:
     - Device: Pixel 3a (or similar)
     - System Image: API Level 34 (Android 14)
     - AVD Name: `Pixel_3a_API_34`

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd mobile

# Install dependencies
npm install
```

## Usage

### Build the App

```bash
./scripts/build.sh
```

This script will:
- Install dependencies if needed
- Clean previous builds
- Build the debug APK
- Display build information

### Run the App

```bash
./scripts/run.sh
```

This script will:
- Start the Android emulator if not running
- Start the Metro bundler
- Build and install the app
- Launch the app on the emulator

### Run Tests

```bash
./scripts/test.sh
```

This script will:
- Start the Android emulator if needed
- Build the app and test APK
- Run E2E tests with Detox
- Capture screenshots (saved to `artifacts/` directory)
- Display test results

#### Test Options

```bash
# Skip build and run tests only
./scripts/test.sh --no-build

# Build only, skip tests
./scripts/test.sh --build-only

# Use custom configuration
./scripts/test.sh --config android.emu.release
```

## Project Structure

```
mobile/
├── android/                 # Android native code
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/        # Kotlin/Java code
│   │   │   ├── res/         # Resources
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   ├── build.gradle
│   └── gradle.properties
├── src/
│   ├── components/          # Reusable components
│   ├── screens/             # Screen components
│   │   ├── TradingScreen.tsx
│   │   └── PositionsScreen.tsx
│   ├── services/            # Business logic
│   │   ├── mockPriceService.ts
│   │   └── tradingEngine.ts
│   ├── store/               # State management
│   │   └── tradingStore.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   └── utils/               # Utility functions
│       └── formatters.ts
├── e2e/                     # E2E tests
│   ├── perpetualTrading.test.ts
│   ├── marginCall.test.ts
│   └── jest.config.js
├── scripts/                 # Build/run/test scripts
│   ├── build.sh
│   ├── run.sh
│   └── test.sh
├── App.tsx                  # Root component
├── index.js                 # App entry point
├── package.json
├── tsconfig.json
└── .detoxrc.js             # Detox configuration
```

## Trading Mechanics

### Opening a Position

1. Select an asset (BTC, ETH, SOL, etc.)
2. Enter position size
3. Choose leverage (1x - 100x)
4. Tap LONG or SHORT button

**Margin Calculation:**
```
Required Margin = (Size × Entry Price) / Leverage
```

**Example:**
- Asset: BTC at $45,000
- Size: 1 BTC
- Leverage: 10x
- Required Margin: $4,500

### Liquidation

Positions are automatically liquidated when the price reaches the liquidation price.

**Liquidation Price Calculation:**

For LONG positions:
```
Liquidation Price = Entry Price × (1 - ((1 - Maintenance Margin) / Leverage))
```

For SHORT positions:
```
Liquidation Price = Entry Price × (1 + ((1 - Maintenance Margin) / Leverage))
```

Where Maintenance Margin = 5%

### Margin Calls

The system monitors positions and triggers margin call warnings when:
- Margin ratio falls below 2x the maintenance margin requirement
- This gives traders advance warning before liquidation

## Testing

### E2E Test Suites

#### Perpetual Trading Tests
- Display trading screen with balance
- Asset selection
- Opening LONG positions
- Opening SHORT positions
- Position details display
- Closing positions
- High leverage trading (100x)
- Insufficient balance handling
- Real-time price updates
- Real-time P&L updates

#### Margin Call Tests
- Position approaching liquidation price tracking
- Position status display
- Multiple positions with different assets
- Margin calculation for different leverages
- Closing multiple positions

### Screenshot Capture

Tests automatically capture screenshots at key moments:
- When tests pass (final state)
- When tests fail (for debugging)
- At important steps (position opening, closing, etc.)

Screenshots are saved to the `artifacts/` directory.

## Mock Data

### Initial Prices
- BTC: $45,000
- ETH: $2,500
- SOL: $105
- BNB: $320
- ADA: $0.52
- DOT: $7.80
- MATIC: $0.85
- AVAX: $38

### Starting Balance
- Total: $10,000
- Available: $10,000
- Margin Used: $0

### Price Simulation
Prices update every 1 second with 0.2% volatility, simulating realistic market movements.

## Development

### Start Metro Bundler

```bash
npm start
```

### Run on Android

```bash
npm run android
```

### Lint Code

```bash
npm run lint
```

### Run Unit Tests

```bash
npm test
```

## Troubleshooting

### Emulator Won't Start
```bash
# List available AVDs
$ANDROID_HOME/emulator/emulator -list-avds

# Start specific AVD
$ANDROID_HOME/emulator/emulator -avd Pixel_3a_API_34
```

### Build Errors
```bash
# Clean build
cd android && ./gradlew clean

# Rebuild
./scripts/build.sh
```

### Metro Bundler Issues
```bash
# Kill existing Metro instances
lsof -ti:8081 | xargs kill -9

# Clear cache and restart
npm start -- --reset-cache
```

### Detox Test Failures
```bash
# Rebuild Detox framework
npm run build:e2e

# Run tests with verbose output
npm run test:e2e -- --loglevel trace
```

## Configuration

### Detox Configuration
Edit `.detoxrc.js` to customize:
- Test runner settings
- Device configurations
- Screenshot settings
- Artifact paths

### Android Configuration
Edit `android/app/build.gradle` to modify:
- SDK versions
- Build variants
- Dependencies

### Environment Variables
Create a `.env` file for custom configuration:
```bash
ANDROID_HOME=/path/to/android/sdk
AVD_NAME=Pixel_3a_API_34
```

## Performance Considerations

### Build Times
- Clean build: ~2-3 minutes
- Incremental build: ~30-60 seconds

### Test Execution
- Full E2E test suite: ~5-10 minutes
- Individual test: ~30-60 seconds

### APK Size
- Debug APK: ~40-50 MB
- Release APK: ~20-30 MB (with optimization)

## Known Limitations

1. **Mock Data Only**: Prices and balances are simulated
2. **Android Only**: iOS support not included in this MVP
3. **No Persistence**: Data resets on app restart
4. **No Real API**: No connection to actual trading platforms
5. **Limited Order Types**: Only market orders supported
6. **Basic UI**: Minimal design focused on functionality

## Future Enhancements

### Trading Features
- Limit orders
- Stop-loss and take-profit
- Order history
- Trade history
- Portfolio analytics

### Technical Improvements
- Real API integration
- Data persistence (AsyncStorage/SQLite)
- iOS support
- Advanced charting
- Push notifications for margin calls
- Biometric authentication

## License

This is an MVP/demo project for educational purposes.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review test logs in `artifacts/`
3. Check Metro logs in `metro.log` or `metro-test.log`
4. Review emulator logs with: `adb logcat`

---

Built with React Native ⚛️ | Powered by TypeScript 💙 | Tested with Detox 🧪
