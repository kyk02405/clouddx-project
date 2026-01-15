"use client";

interface KeywordBlock {
  title: string;
  coins: {
    symbol: string;
    price: string;
    change: number;
  }[];
}

const mockKeywordBlocks: KeywordBlock[] = [
  {
    title: "🔥 급상승",
    coins: [
      { symbol: "SOL", price: "$98.45", change: 5.67 },
      { symbol: "AVAX", price: "$35.60", change: 4.28 },
      { symbol: "BNB", price: "$315.20", change: 3.45 },
      { symbol: "MATIC", price: "$0.82", change: 2.76 },
      { symbol: "BTC", price: "$43,250", change: 2.34 },
    ],
  },
  {
    title: "📊 거래량",
    coins: [
      { symbol: "BTC", price: "$43,250", change: 2.34 },
      { symbol: "ETH", price: "$2,280", change: -1.22 },
      { symbol: "SOL", price: "$98.45", change: 5.67 },
      { symbol: "XRP", price: "$0.58", change: -0.85 },
      { symbol: "BNB", price: "$315.20", change: 3.45 },
    ],
  },
  {
    title: "⭐ 인기",
    coins: [
      { symbol: "BTC", price: "$43,250", change: 2.34 },
      { symbol: "ETH", price: "$2,280", change: -1.22 },
      { symbol: "DOGE", price: "$0.085", change: -2.15 },
      { symbol: "SOL", price: "$98.45", change: 5.67 },
      { symbol: "ADA", price: "$0.48", change: 1.92 },
    ],
  },
  {
    title: "🆕 신규",
    coins: [
      { symbol: "AVAX", price: "$35.60", change: 4.28 },
      { symbol: "MATIC", price: "$0.82", change: 2.76 },
      { symbol: "DOT", price: "$6.85", change: -1.45 },
      { symbol: "SOL", price: "$98.45", change: 5.67 },
      { symbol: "ADA", price: "$0.48", change: 1.92 },
    ],
  },
];

export default function KeywordBlocks() {
  return (
    <div className="space-y-4">
      {mockKeywordBlocks.map((block, idx) => (
        <div
          key={idx}
          className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            {block.title}
          </h3>
          <div className="space-y-2">
            {block.coins.map((coin, coinIdx) => (
              <div
                key={coinIdx}
                className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {coin.symbol}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {coin.price}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      coin.change >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {coin.change >= 0 ? "+" : ""}
                    {coin.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
