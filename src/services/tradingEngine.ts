import {
  Position,
  PositionSide,
  PositionStatus,
  Order,
  OrderType,
  Balance,
  MarginCall,
} from '../types';
import {mockPriceService} from './mockPriceService';

const MAINTENANCE_MARGIN_RATIO = 0.05; // 5% maintenance margin
const INITIAL_BALANCE = 10000; // $10,000 starting balance

class TradingEngine {
  private positions: Map<string, Position> = new Map();
  private balance: Balance = {
    total: INITIAL_BALANCE,
    available: INITIAL_BALANCE,
    marginUsed: 0,
  };
  private positionListeners: (() => void)[] = [];
  private balanceListeners: (() => void)[] = [];
  private marginCallListeners: ((marginCall: MarginCall) => void)[] = [];
  private priceUnsubscribe: (() => void) | null = null;

  constructor() {
    // Subscribe to price updates
    this.priceUnsubscribe = mockPriceService.subscribe(update => {
      this.updatePositions(update.symbol, update.price);
    });
  }

  openPosition(order: Order): {success: boolean; message?: string; position?: Position} {
    const currentPrice = mockPriceService.getCurrentPrice(order.asset);

    if (currentPrice === 0) {
      return {success: false, message: 'Invalid asset'};
    }

    const entryPrice = order.type === OrderType.MARKET ? currentPrice : order.price || currentPrice;
    const margin = (order.size * entryPrice) / order.leverage;

    if (margin > this.balance.available) {
      return {success: false, message: 'Insufficient balance'};
    }

    const liquidationPrice = this.calculateLiquidationPrice(
      entryPrice,
      order.leverage,
      order.side,
    );

    const position: Position = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      asset: order.asset,
      side: order.side,
      entryPrice,
      currentPrice: entryPrice,
      size: order.size,
      leverage: order.leverage,
      margin,
      liquidationPrice,
      unrealizedPnL: 0,
      unrealizedPnLPercentage: 0,
      status: PositionStatus.OPEN,
      openedAt: Date.now(),
    };

    this.positions.set(position.id, position);
    this.balance.available -= margin;
    this.balance.marginUsed += margin;

    this.notifyPositionListeners();
    this.notifyBalanceListeners();

    return {success: true, position};
  }

  closePosition(positionId: string): {success: boolean; message?: string; pnl?: number} {
    const position = this.positions.get(positionId);

    if (!position || position.status !== PositionStatus.OPEN) {
      return {success: false, message: 'Position not found or already closed'};
    }

    const currentPrice = mockPriceService.getCurrentPrice(position.asset);
    const pnl = this.calculatePnL(position, currentPrice);

    position.status = PositionStatus.CLOSED;
    position.closedAt = Date.now();
    position.unrealizedPnL = pnl;

    // Return margin + PnL to available balance
    this.balance.available += position.margin + pnl;
    this.balance.marginUsed -= position.margin;
    this.balance.total += pnl;

    this.notifyPositionListeners();
    this.notifyBalanceListeners();

    return {success: true, pnl};
  }

  private updatePositions(symbol: string, price: number) {
    let hasUpdates = false;
    const marginCalls: MarginCall[] = [];

    this.positions.forEach(position => {
      if (position.asset === symbol && position.status === PositionStatus.OPEN) {
        position.currentPrice = price;
        const pnl = this.calculatePnL(position, price);
        position.unrealizedPnL = pnl;
        position.unrealizedPnLPercentage = (pnl / position.margin) * 100;

        hasUpdates = true;

        // Check for liquidation
        const shouldLiquidate = this.checkLiquidation(position);

        if (shouldLiquidate) {
          this.liquidatePosition(position);
        } else {
          // Check for margin call warning
          const marginRatio = this.calculateMarginRatio(position);

          if (marginRatio < MAINTENANCE_MARGIN_RATIO * 2) {
            // Warn when margin ratio is less than 2x maintenance margin
            marginCalls.push({
              positionId: position.id,
              asset: position.asset,
              currentPrice: price,
              liquidationPrice: position.liquidationPrice,
              marginRatio,
              timestamp: Date.now(),
            });
          }
        }
      }
    });

    if (hasUpdates) {
      this.notifyPositionListeners();
      this.notifyBalanceListeners();
    }

    marginCalls.forEach(mc => this.notifyMarginCallListeners(mc));
  }

  private calculatePnL(position: Position, currentPrice: number): number {
    const priceDiff = position.side === PositionSide.LONG
      ? currentPrice - position.entryPrice
      : position.entryPrice - currentPrice;

    return priceDiff * position.size;
  }

  private calculateLiquidationPrice(
    entryPrice: number,
    leverage: number,
    side: PositionSide,
  ): number {
    // Liquidation occurs when losses equal (1 - maintenance margin ratio) of margin
    const maxLossRatio = (1 - MAINTENANCE_MARGIN_RATIO) / leverage;

    if (side === PositionSide.LONG) {
      return entryPrice * (1 - maxLossRatio);
    } else {
      return entryPrice * (1 + maxLossRatio);
    }
  }

  private calculateMarginRatio(position: Position): number {
    const equity = position.margin + position.unrealizedPnL;
    const positionValue = position.currentPrice * position.size;
    return equity / positionValue;
  }

  private checkLiquidation(position: Position): boolean {
    if (position.side === PositionSide.LONG) {
      return position.currentPrice <= position.liquidationPrice;
    } else {
      return position.currentPrice >= position.liquidationPrice;
    }
  }

  private liquidatePosition(position: Position) {
    position.status = PositionStatus.LIQUIDATED;
    position.closedAt = Date.now();

    // Lose the margin
    this.balance.marginUsed -= position.margin;
    this.balance.total -= position.margin;

    console.warn(`Position ${position.id} liquidated at ${position.currentPrice}`);
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getOpenPositions(): Position[] {
    return Array.from(this.positions.values()).filter(
      p => p.status === PositionStatus.OPEN,
    );
  }

  getBalance(): Balance {
    return {...this.balance};
  }

  subscribeToPositions(callback: () => void): () => void {
    this.positionListeners.push(callback);
    return () => {
      this.positionListeners = this.positionListeners.filter(cb => cb !== callback);
    };
  }

  subscribeToBalance(callback: () => void): () => void {
    this.balanceListeners.push(callback);
    return () => {
      this.balanceListeners = this.balanceListeners.filter(cb => cb !== callback);
    };
  }

  subscribeToMarginCalls(callback: (marginCall: MarginCall) => void): () => void {
    this.marginCallListeners.push(callback);
    return () => {
      this.marginCallListeners = this.marginCallListeners.filter(cb => cb !== callback);
    };
  }

  private notifyPositionListeners() {
    this.positionListeners.forEach(listener => listener());
  }

  private notifyBalanceListeners() {
    this.balanceListeners.forEach(listener => listener());
  }

  private notifyMarginCallListeners(marginCall: MarginCall) {
    this.marginCallListeners.forEach(listener => listener(marginCall));
  }

  reset() {
    this.positions.clear();
    this.balance = {
      total: INITIAL_BALANCE,
      available: INITIAL_BALANCE,
      marginUsed: 0,
    };
    this.notifyPositionListeners();
    this.notifyBalanceListeners();
  }

  cleanup() {
    if (this.priceUnsubscribe) {
      this.priceUnsubscribe();
    }
  }
}

export const tradingEngine = new TradingEngine();
