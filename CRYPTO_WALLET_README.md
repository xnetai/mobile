# Crypto Wallet MVP - Phantom-Style Trading App

A complete React Native crypto wallet MVP with spot and perpetuals trading capabilities, similar to Phantom wallet.

## Features

### 🔐 Wallet Management
- **Create Wallet**: Generate a new wallet with a 12-word mnemonic phrase
- **Import Wallet**: Restore wallet from existing mnemonic
- **Secure Storage**: Wallet addresses and public keys management
- **Multi-Asset Support**: ETH, BTC, SOL, and USDC

### 💰 Portfolio Management
- **Portfolio Overview**: Total balance across all assets in USD
- **Asset Balances**: View individual token balances and values
- **24h Price Changes**: Real-time price tracking and percentage changes
- **Transaction History**: Track all sends, receives, and trades

### 📈 Spot Trading
- **Buy/Sell Crypto**: Trade crypto assets for USDC
- **Market Prices**: Real-time pricing with 24h high/low
- **Fee Calculation**: Transparent 0.1% trading fee
- **Order Confirmation**: Preview trades before execution

### 💹 Perpetuals Trading
- **Leverage Trading**: Up to 100x leverage on positions
- **Long/Short Positions**: Take positions in both directions
- **Position Management**: Track open positions with P&L
- **Liquidation Protection**: Monitor liquidation prices and margin ratios
- **Real-time Updates**: Live price feeds and position value updates

### 💸 Send & Receive
- **Send Assets**: Transfer crypto to any address
- **Receive Assets**: Display wallet address with QR code placeholder
- **Address Validation**: Verify recipient addresses before sending
- **Transaction Fees**: Clear fee display for all transactions

## Tech Stack

- **React Native**: 0.73.6
- **React Navigation**: Stack + Bottom Tabs
- **State Management**: Zustand
- **Language**: TypeScript
- **Dependencies**:
  - @react-navigation/native: ^6.1.9
  - @react-navigation/bottom-tabs: ^6.5.11
  - @react-navigation/stack: ^6.3.20
  - react-native-gesture-handler: ^2.14.1
  - zustand: ^4.4.7

## Project Structure

```
src/
├── screens/
│   ├── WalletSetupScreen.tsx    # Create/import wallet flow
│   ├── HomeScreen.tsx            # Portfolio overview
│   ├── SpotTradingScreen.tsx    # Buy/sell crypto
│   ├── TradingScreen.tsx        # Perpetuals trading
│   ├── PositionsScreen.tsx      # Open positions
│   ├── SendScreen.tsx           # Send assets
│   └── ReceiveScreen.tsx        # Receive assets
├── services/
│   ├── walletService.ts         # Wallet creation/import
│   ├── tradingEngine.ts         # Perpetuals logic
│   └── mockPriceService.ts      # Price feed simulation
├── store/
│   ├── walletStore.ts           # Wallet state management
│   └── tradingStore.ts          # Trading state management
├── types/
│   └── index.ts                 # TypeScript interfaces
└── utils/
    └── formatters.ts            # Number/currency formatters
```

## Navigation Structure

```
App
├── WalletSetup (if not initialized)
└── MainTabs
    ├── Home (Portfolio)
    ├── Spot Trading
    ├── Perpetuals
    └── Positions
    ├── Send (Modal)
    └── Receive (Modal)
```

## Installation & Setup

### Prerequisites
- Node.js >= 18
- React Native development environment
- Android Studio (for Android) or Xcode (for iOS)

### Install Dependencies
```bash
npm install
```

### iOS Setup
```bash
cd ios
pod install
cd ..
```

### Run the App

#### Android
```bash
npm run android
# or
./scripts/run-android.sh
```

#### iOS
```bash
npm run ios
# or
./scripts/run-ios.sh
```

## Branches

- **native**: Base branch with crypto wallet MVP
- **claude/android-native-01VdXvFeCEnsAVEbLtZJiYA4**: Android-specific development
- **claude/ios-native-01VdXvFeCEnsAVEbLtZJiYA4**: iOS-specific development
- **claude/crypto-wallet-mvp-01VdXvFeCEnsAVEbLtZJiYA4**: Main development branch

## Key Features Implementation

### Wallet Creation Flow
1. User chooses to create or import wallet
2. For new wallets, a 12-word mnemonic is generated
3. User must save the mnemonic before proceeding
4. Wallet address and public key are derived
5. Default assets are initialized with balances

### Spot Trading Flow
1. Select asset to trade (BTC, ETH, SOL)
2. Choose buy or sell
3. Enter amount
4. View total cost/proceeds in USDC
5. Confirm trade
6. Balance is updated and transaction recorded

### Perpetuals Trading Flow
1. Select trading pair (BTC-USD, ETH-USD, SOL-USD)
2. Set position size and leverage (1x-100x)
3. Choose long or short
4. System calculates required margin
5. Position opens with liquidation price set
6. Real-time P&L updates on the Positions screen

### Send/Receive Flow
- **Send**: Select asset → Enter recipient → Enter amount → Confirm
- **Receive**: Select asset → Show QR code → Copy address

## Security Notes

⚠️ **This is an MVP implementation for demonstration purposes**

For production use, you should:
1. Use proper cryptographic libraries:
   - `@ethersproject/wallet` for Ethereum
   - `@solana/web3.js` for Solana
   - `bip39` for mnemonic generation
   - `bip32` for key derivation
2. Implement secure key storage (iOS Keychain, Android Keystore)
3. Add biometric authentication
4. Implement proper transaction signing
5. Add network communication for real blockchain interactions
6. Implement proper error handling and recovery
7. Add comprehensive testing

## Mock Data

The app currently uses mock data for:
- Wallet addresses (randomly generated)
- Asset prices (simulated with random updates)
- Initial balances (default values)
- Transactions (local state only)

## Future Enhancements

- [ ] Real blockchain integration (Ethereum, Solana, etc.)
- [ ] Hardware wallet support
- [ ] Multi-wallet management
- [ ] Token swap functionality
- [ ] NFT support
- [ ] DeFi integrations
- [ ] Price alerts
- [ ] Advanced charting
- [ ] Staking/farming
- [ ] Address book
- [ ] Fiat on/off ramps
- [ ] Push notifications
- [ ] Dark/light theme toggle

## Testing

```bash
# Run unit tests
npm test

# Run e2e tests (Android)
npm run test:e2e:android

# Run e2e tests (iOS)
npm run test:e2e:ios
```

## Build

```bash
# Android
npm run build:android

# iOS
npm run build:ios
```

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
