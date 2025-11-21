import {create} from 'zustand';
import {Asset, Position, Balance, MarginCall} from '../types';
import {mockPriceService} from '../services/mockPriceService';
import {tradingEngine} from '../services/tradingEngine';

interface TradingState {
  assets: Asset[];
  positions: Position[];
  balance: Balance;
  marginCalls: MarginCall[];
  selectedAsset: string;
  isInitialized: boolean;

  // Actions
  initialize: () => void;
  cleanup: () => void;
  setSelectedAsset: (symbol: string) => void;
  updateAssets: () => void;
  updatePositions: () => void;
  updateBalance: () => void;
  addMarginCall: (marginCall: MarginCall) => void;
  clearMarginCalls: () => void;
  reset: () => void;
}

export const useTradingStore = create<TradingState>((set, get) => ({
  assets: [],
  positions: [],
  balance: {total: 0, available: 0, marginUsed: 0},
  marginCalls: [],
  selectedAsset: 'BTC',
  isInitialized: false,

  initialize: () => {
    if (get().isInitialized) return;

    // Start price service
    mockPriceService.start();

    // Subscribe to updates
    mockPriceService.subscribe(() => {
      get().updateAssets();
    });

    tradingEngine.subscribeToPositions(() => {
      get().updatePositions();
    });

    tradingEngine.subscribeToBalance(() => {
      get().updateBalance();
    });

    tradingEngine.subscribeToMarginCalls(marginCall => {
      get().addMarginCall(marginCall);
    });

    // Initial data load
    get().updateAssets();
    get().updatePositions();
    get().updateBalance();

    set({isInitialized: true});
  },

  cleanup: () => {
    mockPriceService.stop();
    tradingEngine.cleanup();
    set({isInitialized: false});
  },

  setSelectedAsset: (symbol: string) => {
    set({selectedAsset: symbol});
  },

  updateAssets: () => {
    const prices = mockPriceService.getAllPrices();
    const assets: Asset[] = Object.entries(prices).map(([symbol, price]) => ({
      symbol,
      name: symbol,
      price,
      change24h: (Math.random() - 0.5) * 10, // Mock 24h change
    }));

    set({assets});
  },

  updatePositions: () => {
    const positions = tradingEngine.getPositions();
    set({positions});
  },

  updateBalance: () => {
    const balance = tradingEngine.getBalance();
    set({balance});
  },

  addMarginCall: (marginCall: MarginCall) => {
    set(state => ({
      marginCalls: [...state.marginCalls, marginCall],
    }));
  },

  clearMarginCalls: () => {
    set({marginCalls: []});
  },

  reset: () => {
    mockPriceService.reset();
    tradingEngine.reset();
    get().updateAssets();
    get().updatePositions();
    get().updateBalance();
    get().clearMarginCalls();
  },
}));
