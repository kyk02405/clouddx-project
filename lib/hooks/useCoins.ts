"use client";

import { useEffect, useState } from "react";
import { CoinData, CoinGeckoPrice, COIN_ID_MAP } from "@/lib/types/coingecko";

const SYMBOL_TO_NAME: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  BNB: "Binance Coin",
  SOL: "Solana",
  XRP: "Ripple",
  ADA: "Cardano",
  DOGE: "Dogecoin",
  AVAX: "Avalanche",
  MATIC: "Polygon",
  DOT: "Polkadot",
};

export function useCoins() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        setLoading(true);
        
        // Fetch prices
        const pricesRes = await fetch('/api/coins');
        if (!pricesRes.ok) throw new Error('Failed to fetch prices');
        const pricesData: CoinGeckoPrice = await pricesRes.json();

        // Fetch chart data for each coin
        const coinsWithCharts = await Promise.all(
          Object.entries(COIN_ID_MAP).map(async ([symbol, coinId]) => {
            try {
              const chartRes = await fetch(`/api/coins/${coinId}/chart`);
              if (!chartRes.ok) throw new Error(`Failed to fetch chart for ${symbol}`);
              const chartData = await chartRes.json();
              
              const priceInfo = pricesData[coinId];
              if (!priceInfo) {
                console.warn(`No price data for ${symbol}`);
                return null;
              }

              // Extract sparkline data - handle empty arrays
              let sparklineData: number[] = [];
              if (chartData.prices && Array.isArray(chartData.prices) && chartData.prices.length > 0) {
                // Take last 48 data points or all if less
                const dataPoints = Math.min(48, chartData.prices.length);
                sparklineData = chartData.prices
                  .slice(-dataPoints)
                  .map((p: [number, number]) => p[1]);
              } else {
                // Fallback: generate simple mock data based on change
                const basePrice = priceInfo.usd;
                const change = priceInfo.usd_24h_change || 0;
                sparklineData = Array.from({ length: 48 }, (_, i) => {
                  const progress = i / 47;
                  return basePrice * (1 - change / 100 * (1 - progress));
                });
              }

              return {
                id: coinId,
                symbol,
                name: SYMBOL_TO_NAME[symbol] || symbol,
                price: priceInfo.usd,
                change24h: priceInfo.usd_24h_change || 0,
                volume24h: priceInfo.usd_24h_vol || 0,
                marketCap: priceInfo.usd_market_cap || 0,
                sparklineData,
              } as CoinData;
            } catch (err) {
              console.error(`Error fetching data for ${symbol}:`, err);
              return null;
            }
          })
        );

        // Filter out null and coins without essential data
        const validCoins = coinsWithCharts.filter(
          (c): c is CoinData => c !== null && c.price !== undefined && c.symbol !== undefined
        );
        
        if (validCoins.length === 0) {
          setError('코인 데이터를 불러올 수 없습니다');
        } else {
          setCoins(validCoins);
          setError(null);
        }
      } catch (err) {
        console.error('Error in useCoins:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch coins');
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();

    // Refresh every 10 seconds
    const interval = setInterval(fetchCoins, 10000);

    return () => clearInterval(interval);
  }, []);

  return { coins, loading, error };
}
