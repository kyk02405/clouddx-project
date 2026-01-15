"use client";

import CoinItem from "./CoinItem";
import { useCoins } from "@/lib/hooks/useCoins";

export default function CoinList() {
  const { coins, loading, error } = useCoins();

  if (error) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">오류: {error}</p>
      </div>
    );
  }

  if (loading && coins.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            실시간 시세
          </h2>
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-20 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          실시간 시세
        </h2>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {coins.length}개 코인
          </p>
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {coins.map((coin) => (
        <CoinItem key={coin.symbol} coin={coin} />
      ))}
    </div>
  );
}
