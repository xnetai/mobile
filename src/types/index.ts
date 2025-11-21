export enum PositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export enum PositionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  LIQUIDATED = 'LIQUIDATED',
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
}

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export interface Position {
  id: string;
  asset: string;
  side: PositionSide;
  entryPrice: number;
  currentPrice: number;
  size: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercentage: number;
  status: PositionStatus;
  openedAt: number;
  closedAt?: number;
}

export interface Order {
  id: string;
  asset: string;
  side: PositionSide;
  type: OrderType;
  size: number;
  leverage: number;
  price?: number;
  createdAt: number;
}

export interface Balance {
  total: number;
  available: number;
  marginUsed: number;
}

export interface MarginCall {
  positionId: string;
  asset: string;
  currentPrice: number;
  liquidationPrice: number;
  marginRatio: number;
  timestamp: number;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}
