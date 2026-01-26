"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const dummyWatchlist = {
    crypto: [
        { symbol: "BTC", name: "Bitcoin", price: 45230, change: 2.5, value: "$45,230" },
        { symbol: "ETH", name: "Ethereum", price: 2340, change: 1.8, value: "$2,340" },
        { symbol: "SOL", name: "Solana", price: 98.5, change: -1.2, value: "$98.5" },
        { symbol: "ADA", name: "Cardano", price: 0.52, change: 0.5, value: "$0.52" },
    ],
    stocks: [
        { symbol: "AAPL", name: "Apple Inc.", price: 185.5, change: 2.3, value: "$185.50", market: "US" },
        { symbol: "TSLA", name: "Tesla Inc.", price: 242.8, change: 4.1, value: "$242.80", market: "US" },
        { symbol: "005930", name: "삼성전자", price: 73500, change: 1.8, value: "₩73,500", market: "KR" },
        { symbol: "000660", name: "SK하이닉스", price: 128000, change: 3.5, value: "₩128,000", market: "KR" },
    ],
};

export default function WatchlistPreview() {
    return (
        <section className="bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">Watchlist</h2>
                    <Button variant="outline">
                        + 추가
                    </Button>
                </div>

                <Tabs defaultValue="crypto" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="crypto">Crypto</TabsTrigger>
                        <TabsTrigger value="stocks">Stocks</TabsTrigger>
                    </TabsList>

                    {["crypto", "stocks"].map((type) => (
                        <TabsContent key={type} value={type}>
                            <Card>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border">
                                        {dummyWatchlist[type as keyof typeof dummyWatchlist].map((asset) => (
                                            <div
                                                key={asset.symbol}
                                                className="flex items-center justify-between p-4 transition hover:bg-muted/50"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Avatar>
                                                        <AvatarImage src={`https://logo.clearbit.com/${asset.symbol.toLowerCase()}.com`} />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {asset.symbol.substring(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-foreground">{asset.symbol}</span>
                                                            {asset.market && (
                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                                                                    {asset.market}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">{asset.name}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium text-foreground">{asset.value}</div>
                                                    <div
                                                        className={`text-sm ${asset.change > 0 ? "text-green-600" : "text-destructive"
                                                            }`}
                                                    >
                                                        {asset.change > 0 ? "+" : ""}
                                                        {asset.change}%
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </section>
    );
}
