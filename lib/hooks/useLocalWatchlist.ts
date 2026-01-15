"use client";

import { useState, useEffect } from "react";

export function useLocalWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("covaex_watchlist");
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);

  const toggleWatchlist = (symbol: string) => {
    const next = watchlist.includes(symbol)
      ? watchlist.filter((s) => s !== symbol)
      : [...watchlist, symbol];
    
    setWatchlist(next);
    localStorage.setItem("covaex_watchlist", JSON.stringify(next));
  };

  const isInWatchlist = (symbol: string) => watchlist.includes(symbol);

  return { watchlist, toggleWatchlist, isInWatchlist };
}
