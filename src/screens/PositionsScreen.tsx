import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useTradingStore} from '../store/tradingStore';
import {tradingEngine} from '../services/tradingEngine';
import {Position, PositionStatus} from '../types';
import {
  formatCurrency,
  formatPercentage,
  formatTimestamp,
  getColorForPnL,
} from '../utils/formatters';

export const PositionsScreen: React.FC = () => {
  const {positions} = useTradingStore();

  const handleClosePosition = (position: Position) => {
    Alert.alert(
      'Close Position',
      `Are you sure you want to close this ${position.side} position on ${position.asset}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Close',
          style: 'destructive',
          onPress: () => {
            const result = tradingEngine.closePosition(position.id);
            if (result.success) {
              Alert.alert(
                'Success',
                `Position closed. P&L: ${formatCurrency(result.pnl || 0)}`,
              );
            } else {
              Alert.alert('Error', result.message || 'Failed to close position');
            }
          },
        },
      ],
    );
  };

  const renderPosition = ({item}: {item: Position}) => {
    const isOpen = item.status === PositionStatus.OPEN;
    const pnlColor = getColorForPnL(item.unrealizedPnL);

    return (
      <View
        style={styles.positionCard}
        testID={`position-${item.id}`}>
        <View style={styles.positionHeader}>
          <View>
            <Text style={styles.positionAsset}>{item.asset}</Text>
            <View style={styles.positionBadge}>
              <Text
                style={[
                  styles.positionSide,
                  {
                    color: item.side === 'LONG' ? '#00C853' : '#FF3B30',
                  },
                ]}>
                {item.side}
              </Text>
              <Text style={styles.positionLeverage}>{item.leverage}x</Text>
            </View>
          </View>
          <View style={styles.positionStatus}>
            <Text
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === PositionStatus.OPEN
                      ? '#00C85333'
                      : item.status === PositionStatus.LIQUIDATED
                      ? '#FF3B3033'
                      : '#8E8E9333',
                  color:
                    item.status === PositionStatus.OPEN
                      ? '#00C853'
                      : item.status === PositionStatus.LIQUIDATED
                      ? '#FF3B30'
                      : '#8E8E93',
                },
              ]}
              testID={`position-status-${item.id}`}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.positionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Entry Price:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(item.entryPrice)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Price:</Text>
            <Text style={styles.detailValue} testID={`position-price-${item.id}`}>
              {formatCurrency(item.currentPrice)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size:</Text>
            <Text style={styles.detailValue}>{item.size}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Margin:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(item.margin)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Liquidation Price:</Text>
            <Text style={[styles.detailValue, {color: '#FF3B30'}]}>
              {formatCurrency(item.liquidationPrice)}
            </Text>
          </View>
        </View>

        <View style={styles.pnlSection}>
          <View style={styles.pnlRow}>
            <Text style={styles.pnlLabel}>Unrealized P&L:</Text>
            <View>
              <Text
                style={[styles.pnlValue, {color: pnlColor}]}
                testID={`position-pnl-${item.id}`}>
                {formatCurrency(item.unrealizedPnL)}
              </Text>
              <Text style={[styles.pnlPercentage, {color: pnlColor}]}>
                {formatPercentage(item.unrealizedPnLPercentage)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.timestamp}>
          Opened: {formatTimestamp(item.openedAt)}
        </Text>

        {isOpen && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => handleClosePosition(item)}
            testID={`close-position-${item.id}`}>
            <Text style={styles.closeButtonText}>Close Position</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container} testID="positions-screen">
      {positions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No positions</Text>
        </View>
      ) : (
        <FlatList
          data={positions}
          keyExtractor={item => item.id}
          renderItem={renderPosition}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  positionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  positionAsset: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  positionBadge: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  positionSide: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  positionLeverage: {
    color: '#8E8E93',
    fontSize: 14,
  },
  positionStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  positionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  detailValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pnlSection: {
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  pnlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pnlLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  pnlValue: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  pnlPercentage: {
    fontSize: 14,
    textAlign: 'right',
    marginTop: 4,
  },
  timestamp: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 12,
  },
  closeButton: {
    backgroundColor: '#FF3B30',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
