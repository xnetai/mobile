import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {useWalletStore} from '../store/walletStore';
import {formatCurrency, formatPercentage} from '../utils/formatters';

export const HomeScreen: React.FC = () => {
  const {wallet, assets, totalBalance, transactions} = useWalletStore();

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <ScrollView style={styles.container} testID="home-screen">
      {/* Wallet Header */}
      <View style={styles.header}>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>My Wallet</Text>
          <Text style={styles.walletAddress} testID="wallet-address">
            {formatAddress(wallet?.address || '')}
          </Text>
        </View>
      </View>

      {/* Total Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceValue} testID="total-balance">
          {formatCurrency(totalBalance)}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} testID="send-button">
          <View style={styles.actionIcon}>
            <Text style={styles.actionIconText}>📤</Text>
          </View>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} testID="receive-button">
          <View style={styles.actionIcon}>
            <Text style={styles.actionIconText}>📥</Text>
          </View>
          <Text style={styles.actionText}>Receive</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} testID="buy-button">
          <View style={styles.actionIcon}>
            <Text style={styles.actionIconText}>💰</Text>
          </View>
          <Text style={styles.actionText}>Buy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} testID="swap-button">
          <View style={styles.actionIcon}>
            <Text style={styles.actionIconText}>🔄</Text>
          </View>
          <Text style={styles.actionText}>Swap</Text>
        </TouchableOpacity>
      </View>

      {/* Assets List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assets</Text>
        <View style={styles.assetsList}>
          {assets.map(asset => (
            <TouchableOpacity
              key={asset.symbol}
              style={styles.assetItem}
              testID={`asset-${asset.symbol}`}>
              <View style={styles.assetLeft}>
                <View style={styles.assetIcon}>
                  <Text style={styles.assetIconText}>
                    {asset.symbol.charAt(0)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                  <Text style={styles.assetName}>{asset.name}</Text>
                </View>
              </View>

              <View style={styles.assetRight}>
                <Text style={styles.assetBalance}>
                  {asset.balance.toFixed(4)}
                </Text>
                <View style={styles.assetValueRow}>
                  <Text style={styles.assetValue}>
                    {formatCurrency(asset.valueUSD)}
                  </Text>
                  <Text
                    style={[
                      styles.assetChange,
                      {color: asset.change24h >= 0 ? '#00C853' : '#FF3B30'},
                    ]}>
                    {formatPercentage(asset.change24h)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsList}>
            {recentTransactions.map(tx => (
              <View key={tx.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIcon,
                      {
                        backgroundColor:
                          tx.type === 'send'
                            ? '#FF3B3020'
                            : tx.type === 'receive'
                            ? '#00C85320'
                            : '#007AFF20',
                      },
                    ]}>
                    <Text style={styles.transactionIconText}>
                      {tx.type === 'send'
                        ? '📤'
                        : tx.type === 'receive'
                        ? '📥'
                        : '💱'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.transactionType}>
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}{' '}
                      {tx.asset}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color:
                          tx.type === 'send' ? '#FF3B30' : '#00C853',
                      },
                    ]}>
                    {tx.type === 'send' ? '-' : '+'}
                    {tx.amount.toFixed(4)}
                  </Text>
                  <Text style={styles.transactionStatus}>
                    {tx.status === 'confirmed' ? '✓' : '⏳'} {tx.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  walletInfo: {
    alignItems: 'center',
  },
  walletLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 4,
  },
  walletAddress: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#1C1C1E',
    margin: 20,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  assetsList: {
    gap: 12,
  },
  assetItem: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  assetSymbol: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  assetName: {
    color: '#8E8E93',
    fontSize: 12,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetBalance: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  assetValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assetValue: {
    color: '#8E8E93',
    fontSize: 12,
  },
  assetChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 18,
  },
  transactionType: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    color: '#8E8E93',
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionStatus: {
    color: '#8E8E93',
    fontSize: 11,
  },
});
