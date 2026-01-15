"use client";

import { useState, useEffect } from "react";

export function useLocalWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("covaex_watchlist");
      if (stored) {
        try {
          setWatchlist(JSON.parse(stored));
        } catch {
          setWatchlist([]);
        }
      }
    }
  }, []);

  // Save to localStorage when watchlist changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("covaex_watchlist", JSON.stringify(watchlist));
    }
  }, [watchlist]);

  const toggleWatchlist = (symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  const isInWatchlist = (symbol: string) => watchlist.includes(symbol);

  return {
    watchlist,
    toggleWatchlist,
    isInWatchlist,
  };
}
