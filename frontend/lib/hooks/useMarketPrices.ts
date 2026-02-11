"use client";

/**
 * useMarketPrices - 사이드바용 실시간 시세 조회 훅
 *
 * 주식(KIS)과 코인(Upbit) 배치 API를 호출하여
 * 30초 간격으로 실시간 가격을 갱신합니다.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { allAssets } from "../mock-data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface MarketPrice {
    price: number;        // 현재가 (주식: USD/KRW 원본, 코인: KRW)
    changePercent: number; // 변동률 (%)
    isKRW: boolean;       // true면 이미 KRW, false면 USD
}

// allAssets에서 주식/코인 심볼 추출
const STOCK_SYMBOLS = allAssets
    .filter((a) => a.type === "주식")
    .map((a) => a.symbol);

const CRYPTO_SYMBOLS = allAssets
    .filter((a) => a.type === "코인")
    .map((a) => a.symbol);

export function useMarketPrices() {
    const [prices, setPrices] = useState<Record<string, MarketPrice>>({});
    const [loading, setLoading] = useState(true);
    const mountedRef = useRef(true);

    const fetchPrices = useCallback(async () => {
        try {
            const results: Record<string, MarketPrice> = {};

            // 주식 + 코인 배치 API 동시 호출
            const [stockRes, cryptoRes] = await Promise.allSettled([
                STOCK_SYMBOLS.length > 0
                    ? fetch(`${API_BASE_URL}/api/v1/market/prices/stocks?symbols=${STOCK_SYMBOLS.join(",")}`)
                    : null,
                CRYPTO_SYMBOLS.length > 0
                    ? fetch(`${API_BASE_URL}/api/v1/market/prices/crypto?tickers=${CRYPTO_SYMBOLS.join(",")}`)
                    : null,
            ]);

            // 주식 처리
            if (stockRes.status === "fulfilled" && stockRes.value?.ok) {
                const data = await stockRes.value.json();
                if (data.prices) {
                    for (const p of data.prices) {
                        if (p.error) continue;
                        const price = typeof p.price === "string" ? parseFloat(p.price) : p.price;
                        const change = typeof p.change === "string" ? parseFloat(p.change) : (p.change || 0);
                        const prevPrice = price - change;
                        const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;
                        // 6자리 숫자면 한국 주식 (KRW), 아니면 미국 주식 (USD)
                        const isKRW = /^\d{6}$/.test(p.code);

                        results[p.code] = { price, changePercent, isKRW };
                    }
                }
            }

            // 코인 처리 (Upbit는 KRW 반환)
            if (cryptoRes.status === "fulfilled" && cryptoRes.value?.ok) {
                const data = await cryptoRes.value.json();
                if (data.prices) {
                    for (const p of data.prices) {
                        if (p.error) continue;
                        const symbol = p.ticker?.replace("KRW-", "") || "";
                        results[symbol] = {
                            price: p.price,
                            changePercent: p.change_percent || 0,
                            isKRW: true,
                        };
                    }
                }
            }

            if (mountedRef.current && Object.keys(results).length > 0) {
                setPrices(results);
            }
        } catch (err) {
            console.error("시세 데이터 로드 실패:", err);
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        fetchPrices();

        const interval = setInterval(fetchPrices, 30000);
        return () => {
            mountedRef.current = false;
            clearInterval(interval);
        };
    }, [fetchPrices]);

    return { prices, loading };
}
