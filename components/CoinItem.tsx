"use client";

import Link from "next/link";
import { HeartIcon } from "./Icons";
import { useLocalWatchlist } from "@/lib/hooks/useLocalWatchlist";
import LightweightSparkline from "./Sparkline";
import { CoinData } from "@/lib/types/coingecko";

interface CoinItemProps {
  coin: CoinData;
}

export default function CoinItem({ coin }: CoinItemProps) {
  const { isInWatchlist, toggleWatchlist } = useLocalWatchlist();
  const isPositive = (coin.change24h ?? 0) >= 0;

  // Skip rendering if essential data is missing
  if (!coin.price || !coin.symbol) {
    return null;
  }

  return (
    <Link href={`/coin/${coin.symbol}`}>
      <div className="group flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer">
        <div className="flex items-center space-x-4 flex-1">
          {/* Symbol & Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {coin.symbol}
              </h3>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                {coin.name}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              ${coin.price?.toLocaleString() ?? 'N/A'}
            </p>
          </div>

          {/* Sparkline Chart */}
          <div className="hidden md:flex items-center justify-center min-w-[120px]">
            <LightweightSparkline 
              data={coin.sparklineData} 
              width={100} 
              height={40}
            />
          </div>

          {/* Change 24h */}
          <div className="text-right min-w-[80px]">
            <p
              className={`text-sm font-medium ${
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {(coin.change24h ?? 0).toFixed(2)}%
            </p>
          </div>

          {/* Heart Icon */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWatchlist(coin.symbol);
            }}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isInWatchlist(coin.symbol)
                ? "text-red-500 hover:text-red-600"
                : "text-zinc-400 hover:text-red-500"
            }`}
          >
            <HeartIcon
              className="w-5 h-5"
              filled={isInWatchlist(coin.symbol)}
            />
          </button>
        </div>
      </div>
    </Link>
  );
}
