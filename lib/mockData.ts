import { CoinData } from './types';

export const MOCK_COINS: CoinData[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 96435.21,
    change24h: 1.39,
    volume24h: 35000000000,
    marketCap: 1900000000,
    sparklineData: [95000, 95200, 94800, 95500, 96000, 96200, 96435]
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3325.31,
    change24h: -0.02,
    volume24h: 15000000000,
    marketCap: 400000000,
    sparklineData: [3350, 3340, 3330, 3320, 3335, 3328, 3325]
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'Binance Coin',
    price: 935.66,
    change24h: -1.12,
    volume24h: 1200000000,
    marketCap: 140000000,
    sparklineData: [950, 945, 940, 938, 936, 937, 935]
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    price: 145.03,
    change24h: -0.25,
    volume24h: 4500000000,
    marketCap: 65000000,
    sparklineData: [146, 147, 145, 144, 145, 145.5, 145.03]
  },
  {
    id: 'ripple',
    symbol: 'XRP',
    name: 'Ripple',
    price: 2.12,
    change24h: -2.12,
    volume24h: 3200000000,
    marketCap: 120000000,
    sparklineData: [2.2, 2.18, 2.15, 2.12, 2.13, 2.11, 2.12]
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.409,
    change24h: -2.90,
    volume24h: 450000000,
    marketCap: 14500000,
    sparklineData: [0.42, 0.415, 0.41, 0.408, 0.409, 0.407, 0.409]
  },
  {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    price: 0.145,
    change24h: -1.77,
    volume24h: 1100000000,
    marketCap: 21000000,
    sparklineData: [0.15, 0.148, 0.146, 0.145, 0.147, 0.144, 0.145]
  },
  {
    id: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 14.47,
    change24h: -1.80,
    volume24h: 320000000,
    marketCap: 5800000,
    sparklineData: [15, 14.8, 14.6, 14.5, 14.4, 14.45, 14.47]
  },
  {
    id: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    price: 2.22,
    change24h: -2.23,
    volume24h: 120000000,
    marketCap: 3200000,
    sparklineData: [2.3, 2.28, 2.25, 2.22, 2.23, 2.21, 2.22]
  }
];
