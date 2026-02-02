"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { MOCK_COINS } from "../../../lib/mockData";

export default function CoinDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  // Find coin from mock data
  const coin = MOCK_COINS.find(
    (c) => c.symbol.toLowerCase() === symbol.toLowerCase()
  );

  if (!coin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            코인을 찾을 수 없습니다
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            요청하신 코인 ({symbol})을 찾을 수 없습니다.
          </p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = (coin.change24h ?? 0) >= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 mb-6"
      >
        ← 뒤로 가기
      </Link>

      {/* Coin Header */}
      <div className="glass rounded-3xl p-8 shadow-2xl shadow-blue-500/10 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {coin.name}
            </h1>
            <p className="text-xl text-zinc-500 dark:text-zinc-400">
              {coin.symbol}
            </p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              ${coin.price?.toLocaleString()}
            </p>
            <p
              className={`text-2xl font-semibold ${
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {coin.change24h?.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass rounded-2xl p-6 shadow-lg">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
            시가총액
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            ${coin.marketCap?.toLocaleString()}
          </p>
        </div>
        <div className="glass rounded-2xl p-6 shadow-lg">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
            24시간 거래량
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            ${coin.volume24h?.toLocaleString()}
          </p>
        </div>
        <div className="glass rounded-2xl p-6 shadow-lg">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
            24시간 변동률
          </p>
          <p
            className={`text-2xl font-bold ${
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}
            {coin.change24h?.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="glass rounded-3xl p-8 shadow-2xl shadow-blue-500/10 mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
          가격 차트
        </h2>
        <div className="h-96 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <p className="text-zinc-500 dark:text-zinc-400">
            차트는 추후 업데이트 예정입니다
          </p>
        </div>
      </div>

      {/* Trading Section Placeholder */}
      <div className="glass rounded-3xl p-8 shadow-2xl shadow-blue-500/10">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
          거래
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center py-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <p className="text-zinc-500 dark:text-zinc-400 font-semibold">
              매수 주문
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">
              로그인 후 이용 가능합니다
            </p>
          </div>
          <div className="text-center py-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <p className="text-zinc-500 dark:text-zinc-400 font-semibold">
              매도 주문
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">
              로그인 후 이용 가능합니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
