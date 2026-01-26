"use client";

import { useState } from "react";
import WatchlistSidebar from "@/components/WatchlistSidebar";
import StockChart from "@/components/StockChart";

export default function ChartPage() {
  const [selectedSymbol, setSelectedSymbol] = useState("005930");

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Chart Area */}
      <div className="flex-1 overflow-hidden">
        <StockChart symbol={selectedSymbol} />
      </div>

      {/* Sidebar */}
      <div className="w-80">
        <WatchlistSidebar onSelectSymbol={setSelectedSymbol} />
      </div>
    </div>
  );
}
