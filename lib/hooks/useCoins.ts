"use client";

import { useState, useEffect } from "react";
import { CoinData } from "../types";
import { MOCK_COINS } from "../mockData";

export function useCoins() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For testing: Use static mock data instead of API
    const loadMockData = () => {
      setLoading(true);
      try {
        setCoins(MOCK_COINS);
        setError(null);
      } catch (err) {
        console.error("Error loading mock data:", err);
        setError("Failed to load coin data");
      } finally {
        setLoading(false);
      }
    };

    loadMockData();

    // No interval polling for static data
    return () => {};
  }, []);

  return { coins, loading, error };
}
