"use client";

/**
 * useCoins - 코인 데이터를 가져오는 커스텀 훅
 *
 * Upbit API를 통해 실시간 코인 시세를 조회합니다.
 * 30초 간격으로 자동 갱신됩니다.
 */

import { useState, useEffect, useCallback } from "react";
import { CoinData } from "../types";
import { MOCK_COINS } from "../mock-data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Upbit에서 지원하는 코인 심볼 목록
const TRACKED_TICKERS = ["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "DOT"];

// 심볼 -> 이름 매핑 (Upbit API는 이름을 한글로 반환하므로 영문 이름 유지)
const COIN_NAMES: Record<string, { id: string; name: string }> = {
  "BTC": { id: "bitcoin", name: "Bitcoin" },
  "ETH": { id: "ethereum", name: "Ethereum" },
  "SOL": { id: "solana", name: "Solana" },
  "XRP": { id: "ripple", name: "Ripple" },
  "DOGE": { id: "dogecoin", name: "Dogecoin" },
  "ADA": { id: "cardano", name: "Cardano" },
  "AVAX": { id: "avalanche-2", name: "Avalanche" },
  "DOT": { id: "polkadot", name: "Polkadot" },
  "BNB": { id: "binancecoin", name: "Binance Coin" },
};

export function useCoins() {
  const [coins, setCoins] = useState<CoinData[]>(MOCK_COINS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoins = useCallback(async () => {
    try {
      const tickerParam = TRACKED_TICKERS.join(",");
      const response = await fetch(`${API_BASE_URL}/api/v1/market/prices/crypto?tickers=${tickerParam}`);

      if (!response.ok) {
        throw new Error("코인 시세 조회 실패");
      }

      const data = await response.json();

      if (data.prices && data.prices.length > 0) {
        const updatedCoins: CoinData[] = data.prices
          .filter((p: any) => !p.error)
          .map((p: any) => {
            // 티커에서 심볼 추출 (KRW-BTC -> BTC)
            const symbol = p.ticker?.replace("KRW-", "") || "";
            const coinInfo = COIN_NAMES[symbol] || { id: symbol.toLowerCase(), name: symbol };

            // 이전 데이터에서 sparkline 가져오기 (히스토리 데이터는 별도 API 필요)
            const prevCoin = coins.find(c => c.symbol === symbol);
            const sparklineData = prevCoin?.sparklineData || [p.price];

            // sparkline 업데이트 (최근 7개 유지)
            const newSparkline = [...sparklineData, p.price].slice(-7);

            return {
              id: coinInfo.id,
              symbol: symbol,
              name: coinInfo.name,
              price: p.price,
              change24h: p.change_percent || 0,
              volume24h: p.volume || 0,
              marketCap: 0, // Upbit API에서 marketCap은 제공하지 않음
              sparklineData: newSparkline,
            };
          });

        if (updatedCoins.length > 0) {
          setCoins(updatedCoins);
          setError(null);
        }
      }
    } catch (err) {
      console.error("코인 데이터 로드 실패:", err);
      setError("코인 데이터를 불러오지 못했습니다. Mock 데이터를 표시합니다.");
      // 에러 시 mock 데이터 유지
    } finally {
      setLoading(false);
    }
  }, [coins]);

  useEffect(() => {
    // 초기 로드
    fetchCoins();

    // 30초마다 자동 갱신
    const interval = setInterval(fetchCoins, 30000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 수동 새로고침 함수
  const refresh = useCallback(() => {
    setLoading(true);
    fetchCoins();
  }, [fetchCoins]);

  return { coins, loading, error, refresh };
}
