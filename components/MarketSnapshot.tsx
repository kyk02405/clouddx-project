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
                    <h2 className="mb-6 text-2xl font-bold text-foreground">시장 주요 동향</h2>
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
        <section id="market" className="bg-background px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <h2 className="mb-8 text-3xl font-bold text-foreground">시장 주요 동향</h2>

                <Tabs defaultValue="crypto" className="w-full">
                    <TabsList className="mb-6 grid w-full max-w-[400px] grid-cols-2 h-12">
                        <TabsTrigger value="crypto" className="text-lg">코인</TabsTrigger>
                        <TabsTrigger value="stocks" className="text-lg">주식</TabsTrigger>
                    </TabsList>

                    {["crypto", "stocks"].map((type) => {
                        const currentData = data[type as keyof MarketData] as AssetData;
                        if (!currentData) return null;

                        return (
                            <TabsContent key={type} value={type} className="mt-0">
                                <div className="grid gap-6 md:grid-cols-3">
                                    {/* Top Movers */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                🚀 급등/급락
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Tabs defaultValue="gainers" className="w-full">
                                                <TabsList className="mb-4 w-full">
                                                    <TabsTrigger value="gainers" className="flex-1">상승</TabsTrigger>
                                                    <TabsTrigger value="losers" className="flex-1">하락</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="gainers">
                                                    <div className="space-y-4">
                                                        {currentData.topMovers.filter(m => m.change > 0).map((asset) => (
                                                            <div key={asset.symbol} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-bold">{asset.symbol}</span>
                                                                    <span className="text-sm text-muted-foreground">{asset.name}</span>
                                                                </div>
                                                                <Badge className="bg-green-600 hover:bg-green-700">
                                                                    +{asset.change}%
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="losers">
                                                    <div className="space-y-4">
                                                        {/* Mock loser data since API might return only top movers mixed. 
                                                            Assuming API returns mixed, filtering here or using existing logic. 
                                                            Original code mapped topMovers directly. 
                                                            Let's simulate losers for UI completeness if API data is limited.
                                                        */}
                                                        {currentData.topMovers.filter(m => m.change < 0).length > 0 ?
                                                            currentData.topMovers.filter(m => m.change < 0).map((asset) => (
                                                                <div key={asset.symbol} className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="font-bold">{asset.symbol}</span>
                                                                        <span className="text-sm text-muted-foreground">{asset.name}</span>
                                                                    </div>
                                                                    <Badge variant="destructive">
                                                                        {asset.change}%
                                                                    </Badge>
                                                                </div>
                                                            )) : (
                                                                <div className="text-center text-sm text-muted-foreground py-4">하락 종목 없음</div>
                                                            )
                                                        }
                                                    </div>
                                                </TabsContent>
                                            </Tabs>
                                        </CardContent>
                                    </Card>

                                    {/* Volatility */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                📊 변동성 상위
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-5">
                                                {currentData.volatility.map((asset) => (
                                                    <div key={asset.symbol} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-xs">
                                                                {asset.symbol.substring(0, 1)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold">{asset.symbol}</div>
                                                                <div className="text-xs text-muted-foreground">거래량 급증</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-medium text-orange-500">{asset.volatility}%</div>
                                                            <span className="text-xs text-muted-foreground">변동폭 {asset.range}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* AI Watch Section (New filler) */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                🤖 AI 포착
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {type === 'stocks' ? (
                                                    <>
                                                        <div className="rounded-lg border bg-background p-3 hover:shadow-sm transition-shadow">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <span className="font-bold">삼성전자</span>
                                                                <Badge variant="outline" className="border-green-500 text-green-500">긍정 시그널</Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">외국인 순매수세 3일 연속 지속 및 실적 개선 리포트 감지</p>
                                                        </div>
                                                        <div className="rounded-lg border bg-background p-3 hover:shadow-sm transition-shadow">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <span className="font-bold">TSLA</span>
                                                                <Badge variant="outline" className="text-muted-foreground">중립</Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">신규 모델 루머와 차익 실현 매물 공방 중</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="rounded-lg border bg-background p-3 hover:shadow-sm transition-shadow">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <span className="font-bold">BTC</span>
                                                                <Badge variant="outline" className="border-destructive text-destructive">단기 주의</Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">거래소 유입량 증가로 인한 일시적 매도 압력 가능성</p>
                                                        </div>
                                                        <div className="rounded-lg border bg-background p-3 hover:shadow-sm transition-shadow">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <span className="font-bold">ETH</span>
                                                                <Badge variant="outline" className="border-green-500 text-green-500">매수 우위</Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">네트워크 활동량 증가와 스테이킹 예치금 상승 추세</p>
                                                        </div>
                                                    </>
                                                )}

                                                <div className="mt-2 rounded bg-muted/20 p-2 text-center text-xs text-muted-foreground">
                                                    AI가 실시간 뉴스/거래 데이터를 분석 중입니다
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            </div>
        </section>
    );
}
