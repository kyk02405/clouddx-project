"use client";

import { useEffect, useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface AssetData {
    topMovers: Array<{ symbol: string; name: string; price: number; change: number; volume: string; market?: string }>;
    volatility: Array<{ symbol: string; name: string; price: number; volatility: number; range: string; market?: string }>;
}

interface MarketData {
    crypto: AssetData;
    stocks: AssetData;
    trendKeywords: Array<{ keyword: string; count: number; trend: string }>;
}

export default function MarketSnapshot() {
    const [data, setData] = useState<MarketData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/public/market")
            .then((res) => res.json())
            .then(setData)
            .catch(() => setError("시장 데이터를 불러올 수 없습니다"));
    }, []);

    if (error) {
        return (
            <section className="px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <Card className="border-destructive/50 bg-destructive/10">
                        <CardContent className="flex items-center justify-center p-6 text-destructive">
                            {error}
                        </CardContent>
                    </Card>
                </div>
            </section>
        );
    }

    if (!data) {
        return (
            <section className="px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <h2 className="mb-6 text-2xl font-bold text-foreground">Market Snapshot</h2>
                    <div className="grid gap-6 md:grid-cols-3">
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="market" className="bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <h2 className="mb-6 text-2xl font-bold text-foreground">Market Snapshot</h2>

                <Tabs defaultValue="crypto" className="w-full">
                    <TabsList className="mb-6 grid w-full max-w-[400px] grid-cols-2">
                        <TabsTrigger value="crypto">Crypto</TabsTrigger>
                        <TabsTrigger value="stocks">Stocks</TabsTrigger>
                    </TabsList>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Top Movers - Shared Content Structure for both tabs to avoid duplication if preferred, 
                but separating for clarity as they map to different data keys */}
                        {["crypto", "stocks"].map((type) => {
                            const currentData = data[type as keyof MarketData] as AssetData;
                            if (!currentData) return null;

                            return (
                                <TabsContent key={type} value={type} className="col-span-2 mt-0">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Top Movers</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {currentData.topMovers.map((asset) => (
                                                        <div key={asset.symbol} className="flex items-center justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">{asset.symbol}</span>
                                                                    {asset.market && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            {asset.market}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    ${asset.price.toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                variant={asset.change > 0 ? "default" : "destructive"}
                                                                className={asset.change > 0 ? "bg-green-600 hover:bg-green-700" : ""}
                                                            >
                                                                {asset.change > 0 ? "+" : ""}
                                                                {asset.change}%
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Volatility</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {currentData.volatility.map((asset) => (
                                                        <div key={asset.symbol}>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">{asset.symbol}</span>
                                                                    {asset.market && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            {asset.market}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-orange-500 font-medium">
                                                                    {asset.volatility}%
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                Range: {asset.range}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            );
                        })}

                        {/* Trend Keywords - Fixed position outside tabs if it's shared, or inside if specific */}
                        {/* Since API returns shared trendKeywords, we place it outside the tab content flow or duplicate visually.
                Here I'll place it as a separate card that stays visible or make it part of the grid layout.
                Given the previous layout had 3 columns (Movers, Volatility, Trends), 
                I will adapt the layout: 
                Left 2 cols: Tabs (Movers + Volatility)
                Right 1 col: Trends (Static)
            */}
                        <div className="hidden md:block">
                            {/* This placeholder keeps the grid structure if we want trend keywords to be side-by-side with tabs content.
                   However, TabsContent wraps the first two cards. Use absolute positioning or flex?
                   Better approach: Grid wrapper outside.
               */}
                        </div>
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle>Trend Keywords</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {data.trendKeywords.map((item) => (
                                        <Badge key={item.keyword} variant="outline" className="cursor-pointer hover:bg-accent">
                                            {item.keyword}
                                            <span className="ml-1 text-xs text-muted-foreground">
                                                ({item.count})
                                            </span>
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </Tabs>
            </div>
        </section>
    );
}

