"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface HoldingAsset {
    id?: string;
    symbol: string;
    name: string;
    amount: number;
    averagePrice: number;
    currentPrice: number;
    change: number;
    changePercent: number;
    value: number;
    profit: number;
    profitPercent: number;
}

interface AssetContextType {
    holdings: HoldingAsset[];
    isLoading: boolean;
    error: string | null;
    fetchHoldings: () => Promise<void>;
    addHoldings: (newHoldings: any[]) => Promise<void>;
    updateAsset: (assetId: string, data: { average_price?: number; quantity?: number }) => Promise<void>;
    deleteAsset: (assetId: string) => Promise<void>;
    resetHoldings: () => void;
    refreshPrices: () => void;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

// Mock data for initial guest mode experience
const mockHoldings: HoldingAsset[] = [
    {
        symbol: "BTC",
        name: "Bitcoin",
        amount: 0.45,
        averagePrice: 38500,
        currentPrice: 42400,
        change: 3900,
        changePercent: 10.13,
        value: 19080,
        profit: 1755,
        profitPercent: 10.13,
    },
    {
        symbol: "ETH",
        name: "Ethereum",
        amount: 5.2,
        averagePrice: 2150,
        currentPrice: 2340,
        change: 190,
        changePercent: 8.84,
        value: 12168,
        profit: 988,
        profitPercent: 8.84,
    },
    {
        symbol: "SOL",
        name: "Solana",
        amount: 125,
        averagePrice: 105.2,
        currentPrice: 98.5,
        change: -6.7,
        changePercent: -6.37,
        value: 12312.5,
        profit: -837.5,
        profitPercent: -6.37,
    },
    {
        symbol: "NVDA",
        name: "Nvidia",
        amount: 15,
        averagePrice: 750.4,
        currentPrice: 882.5,
        change: 132.1,
        changePercent: 17.6,
        value: 13237.5,
        profit: 1981.5,
        profitPercent: 17.6,
    },
];

export function AssetProvider({ children }: { children: React.ReactNode }) {
    const [holdings, setHoldings] = useState<HoldingAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchHoldings = useCallback(async () => {
        if (!user?.id) {
            setHoldings(mockHoldings);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/assets?user_id=${user.id}`);
            if (!response.ok) throw new Error("자산 정보를 불러오는데 실패했습니다.");
            
            const data = await response.json();
            
            if (data.assets && data.assets.length > 0) {
                const mappedAssets = data.assets.map((a: any) => {
                    const quantity = a.quantity || 0;
                    const avgPrice = a.average_price || 0;
                    const currentPrice = a.current_price || a.average_price || avgPrice;

                    return {
                        id: a.id,
                        symbol: a.symbol,
                        name: a.name || a.symbol,
                        amount: quantity,
                        averagePrice: avgPrice,
                        currentPrice: currentPrice,
                        change: (currentPrice - avgPrice) * quantity,
                        changePercent: avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0,
                        value: currentPrice * quantity,
                        profit: (currentPrice - avgPrice) * quantity,
                        profitPercent: avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0,
                    };
                });
                setHoldings(mappedAssets);
            } else {
                setHoldings([]);
            }
        } catch (err: any) {
            console.error("❌ Fetch assets error:", err);
            setError(err.message);
            // 에러 시 mock 데이터로 대체하지 않고 빈 배열 처리 (운영 기준)
            setHoldings([]);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchHoldings();
    }, [fetchHoldings]);

    const addHoldings = async (newHoldings: any[]) => {
        if (!user?.id) {
            console.warn("User not logged in, skipping server sync");
            return;
        }

        try {
            // 백엔드 Bulk API 형식으로 변환
            const bulkData = {
                assets: newHoldings.map(h => ({
                    symbol: h.symbol,
                    name: h.name || h.symbol,
                    asset_type: h.type === "currency" ? "cash" : (h.type || "crypto"),
                    quantity: Number(h.quantity),
                    average_price: Number(h.price),
                    current_price: Number(h.price), // 초기 수익률 계산을 위해 현재가에 평단가 대입
                    currency: h.currency || "KRW"
                }))
            };

            const response = await fetch(`${API_BASE_URL}/api/v1/assets/bulk?user_id=${user.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bulkData)
            });

            if (!response.ok) throw new Error("자산 등록 실패");

            // 등록 성공 후 데이터 다시 불러오기
            await fetchHoldings();
            
        } catch (err) {
            console.error("❌ Add holdings error:", err);
            throw err;
        }
    };

    const updateAsset = async (assetId: string, data: { average_price?: number; quantity?: number }) => {
        if (!user?.id) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/assets/${assetId}?user_id=${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("자산 수정 실패");

            await fetchHoldings();
        } catch (err) {
            console.error("❌ Update asset error:", err);
            throw err;
        }
    };

    const deleteAsset = async (assetId: string) => {
        if (!user?.id) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/assets/${assetId}?user_id=${user.id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("자산 삭제 실패");

            // 삭제 성공 후 목록 갱신
            await fetchHoldings();
        } catch (err) {
            console.error("❌ Delete asset error:", err);
            throw err;
        }
    };

    const resetHoldings = () => {
        setHoldings(mockHoldings);
        localStorage.setItem("tutum_holdings", JSON.stringify(mockHoldings));
    };

    const refreshPrices = useCallback(async () => {
        if (holdings.length === 0) return;

        try {
            // 코인과 주식 심볼 분리
            const cryptoSymbols: string[] = [];
            const stockSymbols: string[] = [];

            holdings.forEach(asset => {
                // 코인 심볼 패턴 (알파벳 대문자 2-5자)
                if (/^[A-Z]{2,5}$/.test(asset.symbol) && !asset.symbol.match(/^\d/)) {
                    // 주식 티커와 구분하기 위해 일반적인 코인 심볼 확인
                    const cryptoList = ["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "DOT", "BNB", "MATIC", "LINK"];
                    if (cryptoList.includes(asset.symbol)) {
                        cryptoSymbols.push(asset.symbol);
                    } else {
                        stockSymbols.push(asset.symbol);
                    }
                } else if (asset.symbol.match(/^\d{6}$/)) {
                    // 국내 주식 (6자리 숫자)
                    stockSymbols.push(asset.symbol);
                } else {
                    // 해외 주식
                    stockSymbols.push(asset.symbol);
                }
            });

            const priceMap: Record<string, number> = {};

            // 코인 시세 조회
            if (cryptoSymbols.length > 0) {
                try {
                    const cryptoResponse = await fetch(
                        `${API_BASE_URL}/api/v1/market/prices/crypto?tickers=${cryptoSymbols.join(",")}`
                    );
                    if (cryptoResponse.ok) {
                        const cryptoData = await cryptoResponse.json();
                        cryptoData.prices?.forEach((p: any) => {
                            if (!p.error) {
                                const symbol = p.ticker?.replace("KRW-", "") || "";
                                priceMap[symbol] = p.price;
                            }
                        });
                    }
                } catch (e) {
                    console.warn("코인 시세 조회 실패:", e);
                }
            }

            // 주식 시세 조회
            if (stockSymbols.length > 0) {
                try {
                    const stockResponse = await fetch(
                        `${API_BASE_URL}/api/v1/market/prices/stocks?symbols=${stockSymbols.join(",")}`
                    );
                    if (stockResponse.ok) {
                        const stockData = await stockResponse.json();
                        stockData.prices?.forEach((p: any) => {
                            if (!p.error && p.price) {
                                priceMap[p.code] = p.price;
                            }
                        });
                    }
                } catch (e) {
                    console.warn("주식 시세 조회 실패:", e);
                }
            }

            // 시세 업데이트
            if (Object.keys(priceMap).length > 0) {
                setHoldings((prev) => prev.map(asset => {
                    const newPrice = priceMap[asset.symbol];
                    if (newPrice && newPrice > 0) {
                        return {
                            ...asset,
                            currentPrice: newPrice,
                            change: newPrice - asset.averagePrice,
                            changePercent: asset.averagePrice > 0 ? ((newPrice - asset.averagePrice) / asset.averagePrice) * 100 : 0,
                            value: asset.amount * newPrice,
                            profit: (newPrice - asset.averagePrice) * asset.amount,
                            profitPercent: asset.averagePrice > 0 ? ((newPrice - asset.averagePrice) / asset.averagePrice) * 100 : 0
                        };
                    }
                    return asset;
                }));
            }
        } catch (err) {
            console.error("시세 갱신 실패:", err);
        }
    }, [holdings]);

    return (
        <AssetContext.Provider value={{ holdings, isLoading, error, fetchHoldings, addHoldings, updateAsset, deleteAsset, resetHoldings, refreshPrices }}>
            {children}
        </AssetContext.Provider>
    );
}

export function useAsset() {
    const context = useContext(AssetContext);
    if (context === undefined) {
        throw new Error("useAsset must be used within an AssetProvider");
    }
    return context;
}
