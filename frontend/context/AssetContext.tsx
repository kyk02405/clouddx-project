"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
    currency?: string;
    type?: string;
}

interface AssetContextType {
    holdings: HoldingAsset[];
    addHoldings: (newHoldings: HoldingAsset[]) => Promise<void>;
    resetHoldings: () => void;
    refreshPrices: () => void;
    isLoading: boolean;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

// Mock data (fallback)
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
        currency: "USD",
        type: "crypto"
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
        currency: "USD",
        type: "crypto"
    },
    {
        symbol: "005930",
        name: "삼성전자",
        amount: 100,
        averagePrice: 72000,
        currentPrice: 74500,
        change: 2500,
        changePercent: 3.47,
        value: 7450000,
        profit: 250000,
        profitPercent: 3.47,
        currency: "KRW",
        type: "stock"
    }
];

export function AssetProvider({ children }: { children: React.ReactNode }) {
    const { token, user } = useAuth();
    const [holdings, setHoldings] = useState<HoldingAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Fetch holdings from Backend
    const fetchHoldings = useCallback(async () => {
        if (!token) {
            setHoldings(mockHoldings);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/v1/assets/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const fetchedAssets = data.assets.map((a: any) => ({
                    symbol: a.symbol,
                    name: a.name,
                    amount: a.quantity,
                    averagePrice: a.average_price,
                    currentPrice: a.current_price || a.average_price,
                    change: (a.current_price || a.average_price) - a.average_price,
                    changePercent: a.profit_percent || 0,
                    value: (a.current_price || a.average_price) * a.quantity,
                    profit: a.profit || 0,
                    profitPercent: a.profit_percent || 0,
                    currency: a.currency || "KRW", // Default to KRW if missing
                    type: a.asset_type || "stock"
                }));
                setHoldings(fetchedAssets.length > 0 ? fetchedAssets : []);
            }
        } catch (error) {
            console.error("Failed to fetch holdings:", error);
            setHoldings(mockHoldings);
        } finally {
            setIsLoading(false);
        }
    }, [token, API_URL]);

    useEffect(() => {
        fetchHoldings();
    }, [fetchHoldings]);

    const addHoldings = async (newHoldings: HoldingAsset[]) => {
        if (!token) {
            // Unauthenticated: Fallback to local storage (existing logic)
            setHoldings((prev) => {
                const existingMap = new Map(prev.map((h) => [h.symbol, h]));
                newHoldings.forEach((newItem) => {
                    if (existingMap.has(newItem.symbol)) {
                        const existingItem = existingMap.get(newItem.symbol)!;
                        const totalCost = (existingItem.amount * existingItem.averagePrice) + (newItem.amount * newItem.averagePrice);
                        const totalAmount = existingItem.amount + newItem.amount;
                        const newAvgPrice = totalAmount > 0 ? totalCost / totalAmount : 0;

                        existingMap.set(newItem.symbol, {
                            ...existingItem,
                            amount: totalAmount,
                            averagePrice: newAvgPrice,
                            value: totalAmount * existingItem.currentPrice,
                            profit: (existingItem.currentPrice - newAvgPrice) * totalAmount,
                            profitPercent: newAvgPrice > 0 ? ((existingItem.currentPrice - newAvgPrice) / newAvgPrice) * 100 : 0,
                            currency: newItem.currency || existingItem.currency,
                            type: newItem.type || existingItem.type
                        });
                    } else {
                        existingMap.set(newItem.symbol, newItem);
                    }
                });
                return Array.from(existingMap.values());
            });
            return;
        }

        // Authenticated: Persist to DB
        try {
            const bulkData = {
                assets: newHoldings.map(h => ({
                    symbol: h.symbol,
                    name: h.name,
                    asset_type: h.type || "stock",
                    quantity: h.amount,
                    average_price: h.averagePrice,
                    currency: h.currency || "KRW"
                }))
            };

            const response = await fetch(`${API_URL}/api/v1/assets/bulk`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(bulkData)
            });

            if (response.ok) {
                await fetchHoldings(); // Refresh from DB
            }
        } catch (error) {
            console.error("Failed to save holdings to DB:", error);
        }
    };

    const resetHoldings = () => {
        setHoldings(mockHoldings);
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
        <AssetContext.Provider value={{ holdings, addHoldings, resetHoldings, refreshPrices, isLoading }}>
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
