import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import {useTradingStore} from '../store/tradingStore';
import {mockPriceService} from '../services/mockPriceService';
import {tradingEngine} from '../services/tradingEngine';
import {OrderType, PositionSide} from '../types';
import {formatCurrency, formatPercentage} from '../utils/formatters';

export const TradingScreen: React.FC = () => {
  const {assets, selectedAsset, setSelectedAsset, balance} = useTradingStore();
  const [size, setSize] = useState('1');
  const [leverage, setLeverage] = useState('10');
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const currentAsset = assets.find(a => a.symbol === selectedAsset);
  const currentPrice = currentAsset?.price || 0;

  const parsedSize = parseFloat(size) || 0;
  const parsedLeverage = Math.min(100, Math.max(1, parseFloat(leverage) || 1));

  const positionValue = parsedSize * currentPrice;
  const requiredMargin = positionValue / parsedLeverage;

  const handleTrade = (side: PositionSide) => {
    if (parsedSize <= 0) {
      Alert.alert('Error', 'Please enter a valid size');
      return;
    }

    if (parsedLeverage < 1 || parsedLeverage > 100) {
      Alert.alert('Error', 'Leverage must be between 1x and 100x');
      return;
    }

    if (requiredMargin > balance.available) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    const result = tradingEngine.openPosition({
      id: '',
      asset: selectedAsset,
      side,
      type: OrderType.MARKET,
      size: parsedSize,
      leverage: parsedLeverage,
      createdAt: Date.now(),
    });

    if (result.success) {
      Alert.alert(
        'Success',
        `${side} position opened for ${parsedSize} ${selectedAsset} at ${formatCurrency(currentPrice)}`,
      );
      setSize('1');
    } else {
      Alert.alert('Error', result.message || 'Failed to open position');
    }
  };

  return (
    <ScrollView style={styles.container} testID="trading-screen">
      {/* Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue} testID="balance-value">
          {formatCurrency(balance.available)}
        </Text>
        <View style={styles.balanceDetails}>
          <Text style={styles.balanceDetailText}>
            Total: {formatCurrency(balance.total)}
          </Text>
          <Text style={styles.balanceDetailText}>
            Margin Used: {formatCurrency(balance.marginUsed)}
          </Text>
        </View>
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
            data={assets}
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
                <Text
                  style={[
                    styles.assetItemChange,
                    {color: item.change24h >= 0 ? '#00C853' : '#FF3B30'},
                  ]}>
                  {formatPercentage(item.change24h)}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Order Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Place Order</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Size</Text>
          <TextInput
            style={styles.input}
            value={size}
            onChangeText={setSize}
            keyboardType="decimal-pad"
            placeholder="Enter size"
            placeholderTextColor="#8E8E93"
            testID="size-input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Leverage (1x - 100x)</Text>
          <TextInput
            style={styles.input}
            value={leverage}
            onChangeText={setLeverage}
            keyboardType="decimal-pad"
            placeholder="Enter leverage"
            placeholderTextColor="#8E8E93"
            testID="leverage-input"
          />
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Position Value:</Text>
            <Text style={styles.orderInfoValue}>
              {formatCurrency(positionValue)}
            </Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Required Margin:</Text>
            <Text style={styles.orderInfoValue} testID="required-margin">
              {formatCurrency(requiredMargin)}
            </Text>
          </View>
        </View>

        <View style={styles.tradeButtons}>
          <TouchableOpacity
            style={[styles.tradeButton, styles.longButton]}
            onPress={() => handleTrade(PositionSide.LONG)}
            testID="long-button">
            <Text style={styles.tradeButtonText}>LONG</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tradeButton, styles.shortButton]}
            onPress={() => handleTrade(PositionSide.SHORT)}
            testID="short-button">
            <Text style={styles.tradeButtonText}>SHORT</Text>
          </TouchableOpacity>
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
    marginBottom: 12,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceDetailText: {
    color: '#8E8E93',
    fontSize: 12,
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
  assetItemChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
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
  tradeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  tradeButton: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  longButton: {
    backgroundColor: '#00C853',
  },
  shortButton: {
    backgroundColor: '#FF3B30',
  },
  tradeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
