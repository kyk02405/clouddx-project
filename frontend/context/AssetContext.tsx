"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface HoldingAsset {
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
                    const currentPrice = a.current_price || avgPrice;
                    
                    return {
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

    const resetHoldings = () => {
        setHoldings(mockHoldings);
        localStorage.setItem("tutum_holdings", JSON.stringify(mockHoldings));
    };

    const refreshPrices = () => {
        // Mock price refresh - randomly fluctuate prices by +/- 2%
        setHoldings((prev) => prev.map(asset => {
            const fluctuation = 1 + (Math.random() * 0.04 - 0.02);
            const newPrice = asset.currentPrice * fluctuation;
            return {
                ...asset,
                currentPrice: newPrice,
                change: newPrice - asset.averagePrice,
                changePercent: asset.averagePrice > 0 ? ((newPrice - asset.averagePrice) / asset.averagePrice) * 100 : 0,
                value: asset.amount * newPrice,
                profit: (newPrice - asset.averagePrice) * asset.amount,
                profitPercent: asset.averagePrice > 0 ? ((newPrice - asset.averagePrice) / asset.averagePrice) * 100 : 0
            };
        }));
    };

    return (
        <AssetContext.Provider value={{ holdings, isLoading, error, fetchHoldings, addHoldings, resetHoldings, refreshPrices }}>
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
