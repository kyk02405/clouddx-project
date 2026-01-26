"use client";

import { useState } from "react";
import { mockWatchlist, type WatchlistItem } from "@/lib/mockAssets";

export default function WatchlistSidebar({
  onSelectSymbol,
}: {
  onSelectSymbol: (symbol: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"popular" | "assets" | "watchlist">("popular");
  const [selectedSymbol, setSelectedSymbol] = useState("005930");

  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    onSelectSymbol(symbol);
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === "KRW") {
      return `${price.toLocaleString()}원`;
    }
    return `$${price.toFixed(2)}`;
  };

  const selectedItem = mockWatchlist.find((item) => item.symbol === selectedSymbol);

  return (
    <div className="flex h-full flex-col border-l border-gray-800 bg-gray-950">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {[
          { key: "popular", label: "인기" },
          { key: "assets", label: "자산" },
          { key: "watchlist", label: "관심" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeTab === tab.key
                ? "border-b-2 border-green-400 text-green-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Watchlist */}
      <div className="flex-1 overflow-y-auto">
        {mockWatchlist.map((item) => (
          <button
            key={item.symbol}
            onClick={() => handleSelectSymbol(item.symbol)}
            className={`w-full border-b border-gray-800/50 px-4 py-3 text-left transition hover:bg-gray-900 ${
              selectedSymbol === item.symbol ? "bg-gray-900" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{item.symbol}</span>
                  <span className="text-xs text-gray-500">{item.name}</span>
                </div>
                <div className="mt-1 text-sm text-gray-300">
                  {formatPrice(item.price, item.currency)}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-medium ${
                    item.change >= 0 ? "text-red-500" : "text-blue-500"
                  }`}
                >
                  {item.change >= 0 ? "+" : ""}
                  {item.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Item Detail */}
      {selectedItem && (
        <div className="border-t border-gray-800 bg-gray-900 p-4">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-white">
              {selectedItem.symbol}
              <span className="ml-2 text-sm font-normal text-gray-400">
                {selectedItem.name}
              </span>
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {formatPrice(selectedItem.price, selectedItem.currency)}
              </span>
              <span
                className={`text-sm font-medium ${
                  selectedItem.change >= 0 ? "text-red-500" : "text-blue-500"
                }`}
              >
                {selectedItem.change >= 0 ? "+" : ""}
                {selectedItem.change.toLocaleString()} ({selectedItem.change >= 0 ? "+" : ""}
                {selectedItem.changePercent.toFixed(2)}%)
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              장마감 직전 · 실시간 자동 갱신
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">시가</span>
              <span className="text-white">
                {formatPrice(selectedItem.price * 0.98, selectedItem.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">고가</span>
              <span className="text-red-400">
                {formatPrice(selectedItem.price * 1.02, selectedItem.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">저가</span>
              <span className="text-blue-400">
                {formatPrice(selectedItem.price * 0.96, selectedItem.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">52주 최고</span>
              <span className="text-white">
                {formatPrice(selectedItem.price * 1.5, selectedItem.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">52주 최저</span>
              <span className="text-white">
                {formatPrice(selectedItem.price * 0.6, selectedItem.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">PER</span>
              <span className="text-white">30.73</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
