"use client";

import { useEffect, useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";

interface AssetData {
    topMovers: Array<{ symbol: string; name: string; price: number; change: number; volume: string; market?: string }>;
    volatility: Array<{ symbol: string; name: string; price: number; volatility: number; range: string; market?: string }>;
}

interface MarketData {
    crypto: AssetData;
    stocks: AssetData;
    trendKeywords: Array<{ keyword: string; count: number; trend: string }>;
}

export default function MarketSnapshot() {
    const [data, setData] = useState<MarketData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"crypto" | "stocks">("crypto");

    useEffect(() => {
        fetch("/api/public/market")
            .then((res) => res.json())
            .then(setData)
            .catch(() => setError("시장 데이터를 불러올 수 없습니다"));
    }, []);

    if (error) {
        return (
            <section className="px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-center text-red-400">
                        {error}
                    </div>
                </div>
            </section>
        );
    }

    if (!data) {
        return (
            <section className="px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <h2 className="mb-6 text-2xl font-bold text-white">Market Snapshot</h2>
                    <div className="grid gap-6 md:grid-cols-3">
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                    </div>
                </div>
            </section>
        );
    }

    const currentData = activeTab === "crypto" ? data.crypto : data.stocks;

    return (
        <section id="market" className="bg-gray-950 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <h2 className="mb-6 text-2xl font-bold text-white">Market Snapshot</h2>

                {/* Tabs */}
                <div className="mb-6 flex gap-4 border-b border-gray-800">
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

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Top Movers */}
                    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-white">Top Movers</h3>
                        <div className="space-y-3">
                            {currentData.topMovers.map((asset) => (
                                <div key={asset.symbol} className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white">{asset.symbol}</span>
                                            {asset.market && (
                                                <span className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
                                                    {asset.market}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            ${asset.price.toLocaleString()}
                                        </div>
                                    </div>
                                    <div
                                        className={`rounded px-2 py-1 text-sm font-medium ${asset.change > 0
                                                ? "bg-green-900/30 text-green-400"
                                                : "bg-red-900/30 text-red-400"
                                            }`}
                                    >
                                        {asset.change > 0 ? "+" : ""}
                                        {asset.change}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Volatility */}
                    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-white">Volatility</h3>
                        <div className="space-y-3">
                            {currentData.volatility.map((asset) => (
                                <div key={asset.symbol}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white">{asset.symbol}</span>
                                            {asset.market && (
                                                <span className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
                                                    {asset.market}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-orange-400">{asset.volatility}%</div>
                                    </div>
                                    <div className="text-xs text-gray-500">{asset.range}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trend Keywords */}
                    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-white">Trend Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.trendKeywords.map((item) => (
                                <div
                                    key={item.keyword}
                                    className="flex items-center gap-1 rounded-full bg-blue-900/30 px-3 py-1 text-sm text-blue-300"
                                >
                                    <span>{item.keyword}</span>
                                    <span className="text-xs text-gray-400">({item.count})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

