import {create} from 'zustand';
import {Wallet, WalletAsset, Transaction} from '../types';
import {walletService} from '../services/walletService';

interface WalletStore {
  wallet: Wallet | null;
  assets: WalletAsset[];
  transactions: Transaction[];
  totalBalance: number;
  isInitialized: boolean;

  // Actions
  createWallet: () => Wallet;
  importWallet: (mnemonic: string) => Wallet;
  clearWallet: () => void;
  addAsset: (asset: WalletAsset) => void;
  updateAssetPrice: (symbol: string, price: number, change24h: number) => void;
  addTransaction: (transaction: Transaction) => void;
  sendAsset: (symbol: string, to: string, amount: number) => Transaction;
  receiveAsset: (symbol: string, from: string, amount: number) => Transaction;
  buyAsset: (symbol: string, amount: number, price: number) => void;
  sellAsset: (symbol: string, amount: number, price: number) => void;
  calculateTotalBalance: () => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallet: null,
  assets: [],
  transactions: [],
  totalBalance: 0,
  isInitialized: false,

  createWallet: () => {
    const wallet = walletService.createWallet();

    // Initialize with some default assets (mock data)
    const defaultAssets: WalletAsset[] = [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        balance: 10,
        price: 3500,
        valueUSD: 35000,
        change24h: 2.5,
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: 0.5,
        price: 65000,
        valueUSD: 32500,
        change24h: 1.2,
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        balance: 100,
        price: 150,
        valueUSD: 15000,
        change24h: -0.8,
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        balance: 10000,
        price: 1,
        valueUSD: 10000,
        change24h: 0,
      },
    ];

    set({
      wallet,
      assets: defaultAssets,
      isInitialized: true,
    });

    get().calculateTotalBalance();
    return wallet;
  },

  importWallet: (mnemonic: string) => {
    const wallet = walletService.importWallet(mnemonic);

    // Initialize with default assets
    const defaultAssets: WalletAsset[] = [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        balance: 5,
        price: 3500,
        valueUSD: 17500,
        change24h: 2.5,
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        balance: 5000,
        price: 1,
        valueUSD: 5000,
        change24h: 0,
      },
    ];

    set({
      wallet,
      assets: defaultAssets,
      isInitialized: true,
    });

    get().calculateTotalBalance();
    return wallet;
  },

  clearWallet: () => {
    set({
      wallet: null,
      assets: [],
      transactions: [],
      totalBalance: 0,
      isInitialized: false,
    });
  },

  addAsset: (asset: WalletAsset) => {
    set(state => ({
      assets: [...state.assets, asset],
    }));
    get().calculateTotalBalance();
  },

  updateAssetPrice: (symbol: string, price: number, change24h: number) => {
    set(state => ({
      assets: state.assets.map(asset =>
        asset.symbol === symbol
          ? {
              ...asset,
              price,
              change24h,
              valueUSD: asset.balance * price,
            }
          : asset,
      ),
    }));
    get().calculateTotalBalance();
  },

  addTransaction: (transaction: Transaction) => {
    set(state => ({
      transactions: [transaction, ...state.transactions],
    }));
  },

  sendAsset: (symbol: string, to: string, amount: number) => {
    const {wallet, assets} = get();
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    const asset = assets.find(a => a.symbol === symbol);
    if (!asset || asset.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Update asset balance
    set(state => ({
      assets: state.assets.map(a =>
        a.symbol === symbol
          ? {
              ...a,
              balance: a.balance - amount,
              valueUSD: (a.balance - amount) * a.price,
            }
          : a,
      ),
    }));

    // Create transaction record
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'send',
      asset: symbol,
      amount,
      from: wallet.address,
      to,
      timestamp: Date.now(),
      status: 'confirmed',
      fee: 0.001,
    };

    get().addTransaction(transaction);
    get().calculateTotalBalance();

    return transaction;
  },

  receiveAsset: (symbol: string, from: string, amount: number) => {
    const {wallet, assets} = get();
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    // Update asset balance
    const existingAsset = assets.find(a => a.symbol === symbol);
    if (existingAsset) {
      set(state => ({
        assets: state.assets.map(a =>
          a.symbol === symbol
            ? {
                ...a,
                balance: a.balance + amount,
                valueUSD: (a.balance + amount) * a.price,
              }
            : a,
        ),
      }));
    }

    // Create transaction record
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'receive',
      asset: symbol,
      amount,
      from,
      to: wallet.address,
      timestamp: Date.now(),
      status: 'confirmed',
    };

    get().addTransaction(transaction);
    get().calculateTotalBalance();

    return transaction;
  },

  buyAsset: (symbol: string, amount: number, price: number) => {
    const {wallet, assets} = get();
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    const total = amount * price;
    const usdcAsset = assets.find(a => a.symbol === 'USDC');

    if (!usdcAsset || usdcAsset.balance < total) {
      throw new Error('Insufficient USDC balance');
    }

    // Deduct USDC
    set(state => ({
      assets: state.assets.map(a =>
        a.symbol === 'USDC'
          ? {
              ...a,
              balance: a.balance - total,
              valueUSD: (a.balance - total) * a.price,
            }
          : a.symbol === symbol
          ? {
              ...a,
              balance: a.balance + amount,
              valueUSD: (a.balance + amount) * a.price,
            }
          : a,
      ),
    }));

    // Create transaction record
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'trade',
      asset: symbol,
      amount,
      from: wallet.address,
      to: wallet.address,
      timestamp: Date.now(),
      status: 'confirmed',
      fee: total * 0.001, // 0.1% fee
    };

    get().addTransaction(transaction);
    get().calculateTotalBalance();
  },

  sellAsset: (symbol: string, amount: number, price: number) => {
    const {wallet, assets} = get();
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    const asset = assets.find(a => a.symbol === symbol);
    if (!asset || asset.balance < amount) {
      throw new Error('Insufficient balance');
    }

    const total = amount * price;

    // Add USDC and deduct asset
    set(state => ({
      assets: state.assets.map(a =>
        a.symbol === 'USDC'
          ? {
              ...a,
              balance: a.balance + total,
              valueUSD: (a.balance + total) * a.price,
            }
          : a.symbol === symbol
          ? {
              ...a,
              balance: a.balance - amount,
              valueUSD: (a.balance - amount) * a.price,
            }
          : a,
      ),
    }));

    // Create transaction record
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'trade',
      asset: symbol,
      amount,
      from: wallet.address,
      to: wallet.address,
      timestamp: Date.now(),
      status: 'confirmed',
      fee: total * 0.001, // 0.1% fee
    };

    get().addTransaction(transaction);
    get().calculateTotalBalance();
  },

  calculateTotalBalance: () => {
    const {assets} = get();
    const total = assets.reduce((sum, asset) => sum + asset.valueUSD, 0);
    set({totalBalance: total});
  },
}));
