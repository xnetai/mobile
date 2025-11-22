import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useWalletStore} from '../store/walletStore';

export const ReceiveScreen: React.FC = () => {
  const {wallet, assets} = useWalletStore();
  const [selectedAsset, setSelectedAsset] = useState('ETH');
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const currentAsset = assets.find(a => a.symbol === selectedAsset);

  const handleCopyAddress = () => {
    // In a real app, use Clipboard API
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  return (
    <ScrollView style={styles.container} testID="receive-screen">
      {/* Asset Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Asset</Text>
        <TouchableOpacity
          style={styles.assetButton}
          onPress={() => setShowAssetPicker(!showAssetPicker)}
          testID="asset-picker-button">
          <View>
            <Text style={styles.assetSymbol}>{selectedAsset}</Text>
            <Text style={styles.assetName}>{currentAsset?.name}</Text>
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
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* QR Code Placeholder */}
      <View style={styles.qrSection}>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrIcon}>📱</Text>
          <Text style={styles.qrText}>QR Code</Text>
          <Text style={styles.qrSubtext}>
            Scan to receive {selectedAsset}
          </Text>
        </View>
      </View>

      {/* Wallet Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Wallet Address</Text>
        <View style={styles.addressCard}>
          <Text style={styles.addressText} testID="wallet-address">
            {wallet?.address || ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyAddress}
          testID="copy-button">
          <Text style={styles.copyButtonText}>📋 Copy Address</Text>
        </TouchableOpacity>
      </View>

      {/* Warning */}
      <View style={styles.section}>
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Important</Text>
            <Text style={styles.warningText}>
              Only send {selectedAsset} to this address. Sending other assets
              may result in permanent loss.
            </Text>
          </View>
        </View>
      </View>

      {/* Network Info */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Network:</Text>
            <Text style={styles.infoValue}>Ethereum Mainnet</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Minimum Deposit:</Text>
            <Text style={styles.infoValue}>0.001 {selectedAsset}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expected Arrival:</Text>
            <Text style={styles.infoValue}>12-24 confirmations</Text>
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
  assetName: {
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
  qrSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#FFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  qrText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  qrSubtext: {
    color: '#666',
    fontSize: 12,
  },
  addressCard: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  addressText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: '#332800',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningText: {
    color: '#FFD700',
    fontSize: 14,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
