"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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
    addHoldings: (newHoldings: HoldingAsset[]) => void;
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
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial load from local storage
    useEffect(() => {
        const stored = localStorage.getItem("covaex_holdings");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setHoldings(parsed);
                } else {
                    setHoldings(mockHoldings); // Fallback to mock if empty array
                }
            } catch (e) {
                console.error("Failed to parse holdings from localStorage", e);
                setHoldings(mockHoldings);
            }
        } else {
            setHoldings(mockHoldings);
        }
        setIsInitialized(true);
    }, []);

    // Persist to local storage whenever holdings change
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("covaex_holdings", JSON.stringify(holdings));
        }
    }, [holdings, isInitialized]);

    const addHoldings = (newHoldings: HoldingAsset[]) => {
        setHoldings((prev) => {
            // Merge logic: if asset exists, update average price and amount
            const existingMap = new Map(prev.map((h) => [h.symbol, h]));

            newHoldings.forEach((newItem) => {
                if (existingMap.has(newItem.symbol)) {
                    const existingItem = existingMap.get(newItem.symbol)!;

                    // Calculate new weighted moving average price
                    const totalCost = (existingItem.amount * existingItem.averagePrice) + (newItem.amount * newItem.averagePrice);
                    const totalAmount = existingItem.amount + newItem.amount;
                    const newAvgPrice = totalAmount > 0 ? totalCost / totalAmount : 0;

                    // For demo purposes, we keep the random current price logic or use the new item's current price if available
                    // Realistically, current price comes from an oracle, not the user input history

                    existingMap.set(newItem.symbol, {
                        ...existingItem,
                        amount: totalAmount,
                        averagePrice: newAvgPrice,
                        // Update values based on new amount
                        value: totalAmount * existingItem.currentPrice,
                        profit: (existingItem.currentPrice - newAvgPrice) * totalAmount,
                        profitPercent: newAvgPrice > 0 ? ((existingItem.currentPrice - newAvgPrice) / newAvgPrice) * 100 : 0
                    });
                } else {
                    existingMap.set(newItem.symbol, newItem);
                }
            });

            return Array.from(existingMap.values());
        });
    };

    const resetHoldings = () => {
        setHoldings(mockHoldings);
        localStorage.setItem("covaex_holdings", JSON.stringify(mockHoldings));
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
        <AssetContext.Provider value={{ holdings, addHoldings, resetHoldings, refreshPrices }}>
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
