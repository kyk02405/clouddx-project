"use client";

import CoinItem, { Coin } from "./CoinItem";

// Mock data for demonstration
const mockCoins: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", price: 43250.50, change24h: 2.34, volume24h: 28500000000, marketCap: 846000000000 },
  { symbol: "ETH", name: "Ethereum", price: 2280.75, change24h: -1.22, volume24h: 14200000000, marketCap: 274000000000 },
  { symbol: "BNB", name: "Binance Coin", price: 315.20, change24h: 3.45, volume24h: 1200000000, marketCap: 48500000000 },
  { symbol: "SOL", name: "Solana", price: 98.45, change24h: 5.67, volume24h: 2100000000, marketCap: 42000000000 },
  { symbol: "XRP", name: "Ripple", price: 0.58, change24h: -0.85, volume24h: 1800000000, marketCap: 31000000000 },
  { symbol: "ADA", name: "Cardano", price: 0.48, change24h: 1.92, volume24h: 450000000, marketCap: 17000000000 },
  { symbol: "DOGE", name: "Dogecoin", price: 0.085, change24h: -2.15, volume24h: 780000000, marketCap: 12000000000 },
  { symbol: "AVAX", name: "Avalanche", price: 35.60, change24h: 4.28, volume24h: 680000000, marketCap: 13000000000 },
  { symbol: "MATIC", name: "Polygon", price: 0.82, change24h: 2.76, volume24h: 420000000, marketCap: 7600000000 },
  { symbol: "DOT", name: "Polkadot", price: 6.85, change24h: -1.45, volume24h: 290000000, marketCap: 9200000000 },
];

export default function CoinList() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          실시간 시세
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {mockCoins.length}개 코인
        </p>
      </div>
      
      {mockCoins.map((coin) => (
        <CoinItem key={coin.symbol} coin={coin} />
      ))}
    </div>
  );
}
