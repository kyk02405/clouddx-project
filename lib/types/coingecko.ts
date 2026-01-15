// CoinGecko API types
export interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol: number;
    usd_market_cap: number;
  };
}

export interface CoinGeckoMarketChart {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

// Internal types
export interface CoinData {
  id: string; // CoinGecko ID
  symbol: string;
  name: string;
  price?: number; // Optional: API 호출 실패 시 undefined
  change24h?: number;
  volume24h?: number;
  marketCap?: number;
  sparklineData: number[]; // 최소 빈 배열
}

// CoinGecko ID mapping
export const COIN_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  DOT: 'polkadot',
};

export const TRACKED_COINS = Object.values(COIN_ID_MAP);
