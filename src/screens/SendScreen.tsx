import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useWalletStore} from '../store/walletStore';
import {walletService} from '../services/walletService';
import {formatCurrency} from '../utils/formatters';

export const SendScreen: React.FC = () => {
  const {assets, sendAsset} = useWalletStore();
  const [selectedAsset, setSelectedAsset] = useState('ETH');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const currentAsset = assets.find(a => a.symbol === selectedAsset);
  const parsedAmount = parseFloat(amount) || 0;
  const fee = 0.001; // Fixed fee for demo
  const total = parsedAmount;

  const handleSend = () => {
    if (!recipient.trim()) {
      Alert.alert('Error', 'Please enter recipient address');
      return;
    }

    if (!walletService.isValidAddress(recipient)) {
      Alert.alert('Error', 'Invalid recipient address');
      return;
    }

    if (parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!currentAsset || parsedAmount > currentAsset.balance) {
      Alert.alert('Error', `Insufficient ${selectedAsset} balance`);
      return;
    }

    Alert.alert(
      'Confirm Transaction',
      `Send ${parsedAmount} ${selectedAsset} to ${recipient.slice(0, 10)}...?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          onPress: () => {
            try {
              sendAsset(selectedAsset, recipient, parsedAmount);
              Alert.alert(
                'Success',
                `Sent ${parsedAmount} ${selectedAsset} successfully!`,
              );
              setRecipient('');
              setAmount('');
            } catch (error) {
              Alert.alert('Error', (error as Error).message);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} testID="send-screen">
      {/* Asset Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Asset</Text>
        <TouchableOpacity
          style={styles.assetButton}
          onPress={() => setShowAssetPicker(!showAssetPicker)}
          testID="asset-picker-button">
          <View>
            <Text style={styles.assetSymbol}>{selectedAsset}</Text>
            <Text style={styles.assetBalance}>
              Balance: {currentAsset?.balance.toFixed(4) || '0'}
            </Text>
          </View>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>

        {showAssetPicker && (
          <View style={styles.assetPicker}>
            {assets.map(asset => (
              <TouchableOpacity
                key={asset.symbol}
                style={styles.assetItem}
                onPress={() => {
                  setSelectedAsset(asset.symbol);
                  setShowAssetPicker(false);
                }}
                testID={`asset-${asset.symbol}`}>
                <View>
                  <Text style={styles.assetItemSymbol}>{asset.symbol}</Text>
                  <Text style={styles.assetItemName}>{asset.name}</Text>
                </View>
                <Text style={styles.assetItemBalance}>
                  {asset.balance.toFixed(4)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Recipient */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recipient Address</Text>
        <TextInput
          style={styles.input}
          value={recipient}
          onChangeText={setRecipient}
          placeholder="0x..."
          placeholderTextColor="#8E8E93"
          autoCapitalize="none"
          autoCorrect={false}
          testID="recipient-input"
        />
      </View>

      {/* Amount */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amount</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#8E8E93"
            testID="amount-input"
          />
          {currentAsset && (
            <TouchableOpacity
              style={styles.maxButton}
              onPress={() => setAmount(currentAsset.balance.toString())}>
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          )}
        </View>
        {currentAsset && parsedAmount > 0 && (
          <Text style={styles.usdValue}>
            ≈ {formatCurrency(parsedAmount * currentAsset.price)}
          </Text>
        )}
      </View>

      {/* Transaction Summary */}
      <View style={styles.section}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Transaction Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount:</Text>
            <Text style={styles.summaryValue}>
              {parsedAmount || 0} {selectedAsset}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Network Fee:</Text>
            <Text style={styles.summaryValue}>
              {fee} {selectedAsset}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.summaryRowTotal]}>
            <Text style={styles.summaryLabelTotal}>Total:</Text>
            <Text style={styles.summaryValueTotal}>
              {total + fee} {selectedAsset}
            </Text>
          </View>
        </View>
      </View>

      {/* Send Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.sendButton, !recipient.trim() && styles.disabledButton]}
          onPress={handleSend}
          disabled={!recipient.trim()}
          testID="send-button">
          <Text style={styles.sendButtonText}>Send {selectedAsset}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  assetBalance: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 4,
  },
  chevron: {
    color: '#8E8E93',
    fontSize: 14,
  },
  assetPicker: {
    marginTop: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  assetItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetItemSymbol: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  assetItemName: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  assetItemBalance: {
    color: '#FFF',
    fontSize: 14,
  },
  inputContainer: {
    position: 'relative',
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
    top: 12,
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
  usdValue: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 14,
  },
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  summaryLabelTotal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryValueTotal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
