"use client";

/**
 * useCoins - 코인 데이터를 가져오는 커스텀 훅
 * 
 * 현재는 정적 Mock 데이터를 사용하며, 추후 실제 API 연동 시
 * 이 훅 내부만 수정하면 됩니다.
 */

import { useState, useEffect } from "react";
import { CoinData } from "../types";
import { MOCK_COINS } from "../mock-data";

export function useCoins() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mock 데이터 로드 (테스트용)
    const loadMockData = () => {
      setLoading(true);
      try {
        setCoins(MOCK_COINS);
        setError(null);
      } catch (err) {
        console.error("코인 데이터 로드 실패:", err);
        setError("코인 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadMockData();

    // 정적 데이터이므로 폴링 없음
    return () => { };
  }, []);

  return { coins, loading, error };
}
