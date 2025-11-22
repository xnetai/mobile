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

// Wallet Types
export interface Wallet {
  address: string;
  publicKey: string;
  mnemonic?: string; // Only stored during creation/import
  createdAt: number;
}

export interface WalletAsset {
  symbol: string;
  name: string;
  balance: number;
  valueUSD: number;
  price: number;
  change24h: number;
  logo?: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'trade' | 'swap';
  asset: string;
  amount: number;
  from: string;
  to: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  fee?: number;
}

export interface SpotOrder {
  id: string;
  asset: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  amount: number;
  price?: number;
  total: number;
  createdAt: number;
  status: 'pending' | 'filled' | 'cancelled';
}
