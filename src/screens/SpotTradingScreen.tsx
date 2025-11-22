import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import {useWalletStore} from '../store/walletStore';
import {formatCurrency, formatPercentage} from '../utils/formatters';

export const SpotTradingScreen: React.FC = () => {
  const {assets, buyAsset, sellAsset} = useWalletStore();
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const currentAsset = assets.find(a => a.symbol === selectedAsset);
  const currentPrice = currentAsset?.price || 0;
  const usdcBalance = assets.find(a => a.symbol === 'USDC')?.balance || 0;

  const parsedAmount = parseFloat(amount) || 0;
  const total = parsedAmount * currentPrice;

  const tradableAssets = assets.filter(a => a.symbol !== 'USDC');

  const handleTrade = () => {
    if (parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      if (side === 'buy') {
        if (total > usdcBalance) {
          Alert.alert('Error', 'Insufficient USDC balance');
          return;
        }
        buyAsset(selectedAsset, parsedAmount, currentPrice);
        Alert.alert(
          'Success',
          `Bought ${parsedAmount} ${selectedAsset} for ${formatCurrency(total)}`,
        );
      } else {
        if (!currentAsset || parsedAmount > currentAsset.balance) {
          Alert.alert('Error', `Insufficient ${selectedAsset} balance`);
          return;
        }
        sellAsset(selectedAsset, parsedAmount, currentPrice);
        Alert.alert(
          'Success',
          `Sold ${parsedAmount} ${selectedAsset} for ${formatCurrency(total)}`,
        );
      }
      setAmount('');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <ScrollView style={styles.container} testID="spot-trading-screen">
      {/* Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>USDC Balance</Text>
        <Text style={styles.balanceValue} testID="usdc-balance">
          {formatCurrency(usdcBalance)}
        </Text>
        {currentAsset && side === 'sell' && (
          <Text style={styles.balanceDetail}>
            {selectedAsset} Balance: {currentAsset.balance.toFixed(4)}
          </Text>
        )}
      </View>

      {/* Buy/Sell Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, side === 'buy' && styles.toggleButtonActive]}
          onPress={() => setSide('buy')}
          testID="buy-toggle">
          <Text
            style={[
              styles.toggleText,
              side === 'buy' && styles.toggleTextActive,
            ]}>
            Buy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            side === 'sell' && styles.toggleButtonActive,
          ]}
          onPress={() => setSide('sell')}
          testID="sell-toggle">
          <Text
            style={[
              styles.toggleText,
              side === 'sell' && styles.toggleTextActive,
            ]}>
            Sell
          </Text>
        </TouchableOpacity>
      </View>

      {/* Asset Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Asset</Text>
        <TouchableOpacity
          style={styles.assetButton}
          onPress={() => setShowAssetPicker(!showAssetPicker)}
          testID="asset-picker-button">
          <View>
            <Text style={styles.assetSymbol}>{selectedAsset}</Text>
            <Text style={styles.assetPrice} testID="asset-price">
              {formatCurrency(currentPrice)}
            </Text>
          </View>
          {currentAsset && (
            <Text
              style={[
                styles.assetChange,
                {color: currentAsset.change24h >= 0 ? '#00C853' : '#FF3B30'},
              ]}>
              {formatPercentage(currentAsset.change24h)}
            </Text>
          )}
        </TouchableOpacity>

        {showAssetPicker && (
          <FlatList
            data={tradableAssets}
            scrollEnabled={false}
            keyExtractor={item => item.symbol}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.assetItem}
                onPress={() => {
                  setSelectedAsset(item.symbol);
                  setShowAssetPicker(false);
                }}
                testID={`asset-${item.symbol}`}>
                <View>
                  <Text style={styles.assetItemSymbol}>{item.symbol}</Text>
                  <Text style={styles.assetItemPrice}>
                    {formatCurrency(item.price)}
                  </Text>
                </View>
                <View style={styles.assetItemRight}>
                  <Text style={styles.assetItemBalance}>
                    {item.balance.toFixed(4)}
                  </Text>
                  <Text
                    style={[
                      styles.assetItemChange,
                      {color: item.change24h >= 0 ? '#00C853' : '#FF3B30'},
                    ]}>
                    {formatPercentage(item.change24h)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Order Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {side === 'buy' ? 'Buy' : 'Sell'} {selectedAsset}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Amount ({selectedAsset})</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#8E8E93"
            testID="amount-input"
          />
          {currentAsset && side === 'sell' && (
            <TouchableOpacity
              style={styles.maxButton}
              onPress={() => setAmount(currentAsset.balance.toString())}>
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Price:</Text>
            <Text style={styles.orderInfoValue}>
              {formatCurrency(currentPrice)}
            </Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Total (USDC):</Text>
            <Text style={styles.orderInfoValue} testID="total-value">
              {formatCurrency(total)}
            </Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Fee (0.1%):</Text>
            <Text style={styles.orderInfoValue}>
              {formatCurrency(total * 0.001)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.tradeButton,
            side === 'buy' ? styles.buyButton : styles.sellButton,
          ]}
          onPress={handleTrade}
          testID="trade-button">
          <Text style={styles.tradeButtonText}>
            {side === 'buy' ? 'BUY' : 'SELL'} {selectedAsset}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Market Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Overview</Text>
        <View style={styles.marketOverview}>
          <View style={styles.marketItem}>
            <Text style={styles.marketLabel}>24h High</Text>
            <Text style={styles.marketValue}>
              {formatCurrency(currentPrice * 1.05)}
            </Text>
          </View>
          <View style={styles.marketItem}>
            <Text style={styles.marketLabel}>24h Low</Text>
            <Text style={styles.marketValue}>
              {formatCurrency(currentPrice * 0.95)}
            </Text>
          </View>
          <View style={styles.marketItem}>
            <Text style={styles.marketLabel}>24h Change</Text>
            <Text
              style={[
                styles.marketValue,
                {
                  color:
                    currentAsset && currentAsset.change24h >= 0
                      ? '#00C853'
                      : '#FF3B30',
                },
              ]}>
              {currentAsset && formatPercentage(currentAsset.change24h)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  balanceCard: {
    backgroundColor: '#1C1C1E',
    padding: 20,
    margin: 16,
    borderRadius: 12,
  },
  balanceLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceDetail: {
    color: '#8E8E93',
    fontSize: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 0,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  assetButton: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetSymbol: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  assetPrice: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 4,
  },
  assetChange: {
    fontSize: 16,
    fontWeight: '600',
  },
  assetItem: {
    backgroundColor: '#2C2C2E',
    padding: 16,
    marginTop: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetItemSymbol: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  assetItemPrice: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  assetItemRight: {
    alignItems: 'flex-end',
  },
  assetItemBalance: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  assetItemChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
    position: 'relative',
  },
  inputLabel: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1C1C1E',
    color: '#FFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  maxButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  maxButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderInfoLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  orderInfoValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tradeButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#00C853',
  },
  sellButton: {
    backgroundColor: '#FF3B30',
  },
  tradeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  marketOverview: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  marketItem: {
    alignItems: 'center',
  },
  marketLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 6,
  },
  marketValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
