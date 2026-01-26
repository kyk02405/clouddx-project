"use client";

import { useState } from "react";

const dummyWatchlist = {
    crypto: [
        { symbol: "BTC", name: "Bitcoin", price: 45230, change: 2.5, value: "$45,230" },
        { symbol: "ETH", name: "Ethereum", price: 2340, change: 1.8, value: "$2,340" },
        { symbol: "SOL", name: "Solana", price: 98.5, change: -1.2, value: "$98.5" },
        { symbol: "ADA", name: "Cardano", price: 0.52, change: 0.5, value: "$0.52" },
    ],
    stocks: [
        { symbol: "AAPL", name: "Apple Inc.", price: 185.5, change: 2.3, value: "$185.50", market: "US" },
        { symbol: "TSLA", name: "Tesla Inc.", price: 242.8, change: 4.1, value: "$242.80", market: "US" },
        { symbol: "005930", name: "삼성전자", price: 73500, change: 1.8, value: "₩73,500", market: "KR" },
        { symbol: "000660", name: "SK하이닉스", price: 128000, change: 3.5, value: "₩128,000", market: "KR" },
    ],
};

export default function WatchlistPreview() {
    const [activeTab, setActiveTab] = useState<"crypto" | "stocks">("crypto");
    const watchlist = activeTab === "crypto" ? dummyWatchlist.crypto : dummyWatchlist.stocks;

    return (
        <section className="bg-gray-950 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Watchlist</h2>
                    <button className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-600 hover:text-white">
                        + 추가
                    </button>
                </div>

                {/* Tabs */}
                <div className="mb-4 flex gap-4 border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab("crypto")}
                        className={`border-b-2 px-4 pb-3 font-medium transition ${activeTab === "crypto"
                                ? "border-blue-500 text-white"
                                : "border-transparent text-gray-400 hover:text-gray-300"
                            }`}
                    >
                        Crypto
                    </button>
                    <button
                        onClick={() => setActiveTab("stocks")}
                        className={`border-b-2 px-4 pb-3 font-medium transition ${activeTab === "stocks"
                                ? "border-blue-500 text-white"
                                : "border-transparent text-gray-400 hover:text-gray-300"
                            }`}
                    >
                        Stocks
                    </button>
                </div>

                <div className="rounded-lg border border-gray-800 bg-gray-900">
                    <div className="divide-y divide-gray-800">
                        {watchlist.map((asset: any) => (
                            <div
                                key={asset.symbol}
                                className="flex items-center justify-between p-4 transition hover:bg-gray-800"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900/30 text-blue-400">
                                        {asset.symbol.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white">{asset.symbol}</span>
                                            {asset.market && (
                                                <span className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
                                                    {asset.market}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-400">{asset.name}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium text-white">{asset.value}</div>
                                    <div
                                        className={`text-sm ${asset.change > 0 ? "text-green-400" : "text-red-400"
                                            }`}
                                    >
                                        {asset.change > 0 ? "+" : ""}
                                        {asset.change}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
