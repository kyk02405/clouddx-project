export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price?: number;
  change24h?: number;
  volume24h?: number;
  marketCap?: number;
  sparklineData: number[];
}

export const TRACKED_COINS = [
  'bitcoin', 
  'ethereum', 
  'binancecoin', 
  'solana', 
  'ripple', 
  'cardano', 
  'dogecoin', 
  'avalanche-2', 
  'polkadot'
];

export const COIN_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'AVAX': 'avalanche-2',
  'DOT': 'polkadot',
};
