import {PriceUpdate} from '../types';

const ASSETS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOT', 'MATIC', 'AVAX'];

const INITIAL_PRICES: Record<string, number> = {
  BTC: 45000,
  ETH: 2500,
  SOL: 105,
  BNB: 320,
  ADA: 0.52,
  DOT: 7.8,
  MATIC: 0.85,
  AVAX: 38,
};

class MockPriceService {
  private prices: Record<string, number> = {...INITIAL_PRICES};
  private listeners: ((update: PriceUpdate) => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private volatility = 0.002; // 0.2% volatility per update

  start() {
    if (this.intervalId) return;

    // Update prices every 1 second
    this.intervalId = setInterval(() => {
      ASSETS.forEach(symbol => {
        this.updatePrice(symbol);
      });
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updatePrice(symbol: string) {
    const currentPrice = this.prices[symbol];

    // Random walk with drift
    const change = (Math.random() - 0.5) * 2 * this.volatility;
    const newPrice = currentPrice * (1 + change);

    this.prices[symbol] = Math.max(newPrice, 0.01); // Prevent negative prices

    const update: PriceUpdate = {
      symbol,
      price: this.prices[symbol],
      timestamp: Date.now(),
    };

    this.notifyListeners(update);
  }

  getCurrentPrice(symbol: string): number {
    return this.prices[symbol] || 0;
  }

  getAllPrices(): Record<string, number> {
    return {...this.prices};
  }

  subscribe(callback: (update: PriceUpdate) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(update: PriceUpdate) {
    this.listeners.forEach(listener => listener(update));
  }

  // For testing: simulate dramatic price moves
  simulateCrash(symbol: string, percentage: number) {
    this.prices[symbol] = this.prices[symbol] * (1 - percentage);
    this.notifyListeners({
      symbol,
      price: this.prices[symbol],
      timestamp: Date.now(),
    });
  }

  simulatePump(symbol: string, percentage: number) {
    this.prices[symbol] = this.prices[symbol] * (1 + percentage);
    this.notifyListeners({
      symbol,
      price: this.prices[symbol],
      timestamp: Date.now(),
    });
  }

  reset() {
    this.prices = {...INITIAL_PRICES};
  }
}

export const mockPriceService = new MockPriceService();
