// Mock 관심종목 데이터
export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  type: "stock" | "crypto" | "etf";
  logo?: string;
}

export const mockWatchlist: WatchlistItem[] = [
  { symbol: "005930", name: "삼성전자", price: 152500, change: 400, changePercent: 0.26, currency: "KRW", type: "stock" },
  { symbol: "TSLA", name: "테슬라", price: 449.06, change: -0.32, changePercent: -0.07, currency: "USD", type: "stock" },
  { symbol: "AAPL", name: "애플", price: 248.04, change: -0.29, changePercent: -0.12, currency: "USD", type: "stock" },
  { symbol: "NVDA", name: "엔비디아", price: 187.67, change: 2.87, changePercent: 1.55, currency: "USD", type: "stock" },
  { symbol: "360750", name: "TIGER 미국S&P500", price: 24810, change: -437, changePercent: -1.72, currency: "KRW", type: "etf" },
  { symbol: "SCHD", name: "Schwab 미국 배당", price: 29.14, change: -0.03, changePercent: -0.10, currency: "USD", type: "etf" },
  { symbol: "TQQQ", name: "나스닥100 3배", price: 54.38, change: 0.48, changePercent: 0.89, currency: "USD", type: "etf" },
];

// Mock 보유 자산 데이터
export interface HoldingAsset {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  currency: string;
  type: "stock" | "crypto" | "etf";
  account: string;
}

export const mockHoldings: HoldingAsset[] = [
  {
    symbol: "TSLA",
    name: "테슬라",
    quantity: 10,
    avgPrice: 290085,
    currentPrice: 648874,
    currency: "KRW",
    type: "stock",
    account: "기본계좌",
  },
];

// 총 자산 요약 데이터
export interface AssetSummary {
  totalAssets: number;
  investment: number;
  cash: number;
  principal: number;
  totalProfit: number;
  totalProfitPercent: number;
  dailyProfit: number;
  dailyProfitPercent: number;
  currency: string;
}

export const mockAssetSummary: AssetSummary = {
  totalAssets: 6488738,
  investment: 6488738,
  cash: 0,
  principal: 2900849,
  totalProfit: 3587889,
  totalProfitPercent: 123.68,
  dailyProfit: -4335,
  dailyProfitPercent: -0.07,
  currency: "KRW",
};

// 거래 내역
export interface Transaction {
  type: "buy" | "sell";
  symbol: string;
  quantity: number;
  price: number;
  date: string;
  broker: string;
}

export const mockTransactions: Transaction[] = [
  { type: "buy", symbol: "TSLA", quantity: 10, price: 290085, date: "2023-06-03 22:30", broker: "미래에셋" },
];
