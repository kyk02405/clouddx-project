"use client";

import CoinItem, { Coin } from "./CoinItem";

// Generate mock sparkline data (30 days)
const generateSparklineData = (basePrice: number, trend: "up" | "down" | "volatile") => {
  const days = 30;
  const data: number[] = [];
  let price = basePrice * 0.9; // Start from 90% of current price
  
  for (let i = 0; i < days; i++) {
    if (trend === "up") {
      price += (Math.random() * 0.05 - 0.01) * basePrice; // Slightly upward trend
    } else if (trend === "down") {
      price += (Math.random() * 0.03 - 0.05) * basePrice; // Slightly downward trend
    } else {
      price += (Math.random() * 0.1 - 0.05) * basePrice; // Volatile
    }
    data.push(Math.max(price, 0));
  }
  
  return data;
};

// Mock data for demonstration
const mockCoins: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", price: 43250.50, change24h: 2.34, volume24h: 28500000000, marketCap: 846000000000, sparklineData: generateSparklineData(43250.50, "up") },
  { symbol: "ETH", name: "Ethereum", price: 2280.75, change24h: -1.22, volume24h: 14200000000, marketCap: 274000000000, sparklineData: generateSparklineData(2280.75, "down") },
  { symbol: "BNB", name: "Binance Coin", price: 315.20, change24h: 3.45, volume24h: 1200000000, marketCap: 48500000000, sparklineData: generateSparklineData(315.20, "up") },
  { symbol: "SOL", name: "Solana", price: 98.45, change24h: 5.67, volume24h: 2100000000, marketCap: 42000000000, sparklineData: generateSparklineData(98.45, "up") },
  { symbol: "XRP", name: "Ripple", price: 0.58, change24h: -0.85, volume24h: 1800000000, marketCap: 31000000000, sparklineData: generateSparklineData(0.58, "down") },
  { symbol: "ADA", name: "Cardano", price: 0.48, change24h: 1.92, volume24h: 450000000, marketCap: 17000000000, sparklineData: generateSparklineData(0.48, "up") },
  { symbol: "DOGE", name: "Dogecoin", price: 0.085, change24h: -2.15, volume24h: 780000000, marketCap: 12000000000, sparklineData: generateSparklineData(0.085, "volatile") },
  { symbol: "AVAX", name: "Avalanche", price: 35.60, change24h: 4.28, volume24h: 680000000, marketCap: 13000000000, sparklineData: generateSparklineData(35.60, "up") },
  { symbol: "MATIC", name: "Polygon", price: 0.82, change24h: 2.76, volume24h: 420000000, marketCap: 7600000000, sparklineData: generateSparklineData(0.82, "up") },
  { symbol: "DOT", name: "Polkadot", price: 6.85, change24h: -1.45, volume24h: 290000000, marketCap: 9200000000, sparklineData: generateSparklineData(6.85, "down") },
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
