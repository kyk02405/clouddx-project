"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Wallet, PieChart, ArrowUpRight, BarChart3, ListChecks, Plus, Loader2, LayoutGrid } from "lucide-react";
import Footer from "@/components/Footer";
import AssetAllocationChart from "@/components/AssetAllocationChart";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddAssetModal from "@/components/AddAssetModal";
import { useAsset } from "@/context/AssetContext";
import PersonalizedNewsCarousel from "@/components/PersonalizedNewsCarousel";
import PortfolioDashboardCharts from "@/components/PortfolioDashboardCharts";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Sparkline from "@/components/Sparkline";

// Crafted Boutique Color Palette
const COLORS = [
    "#10B981", // Sage (Positive)
    "#F43F5E", // Soft Rose (Negative)
    "#6366F1", // Indigo
    "#F59E0B", // Amber
    "#8B5CF6", // Violet
    "#06B6D4", // Cyan
    "#EC4899", // Pink
    "#3B82F6"  // Blue
];

export default function PortfolioAssetPage() {
    const { holdings, isLoading, error } = useAsset();
    const [showAddModal, setShowAddModal] = useState(false);

    // Calculate Totals for Header & Overview
    const totalEvaluation = holdings.reduce((acc, curr) => acc + curr.value, 0);
    const totalInvested = holdings.reduce((acc, curr) => acc + (curr.amount * curr.averagePrice), 0);
    const totalProfit = totalEvaluation - totalInvested;
    const profitRate = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    // Logic for Daily Profit (Mock logic using current 'change' values)
    const dailyProfitRaw = holdings.reduce((acc, curr) => acc + (curr.change * curr.amount), 0);
    const dailyProfitPercent = totalInvested > 0 ? (dailyProfitRaw / totalInvested) * 100 : 0;

    // Logic for Best Performer
    const bestPerformer = [...holdings].sort((a, b) => b.profitPercent - a.profitPercent)[0];

    // Logic for Chart Data
    const chartData = holdings.map((h, i) => ({
        symbol: h.symbol,
        name: h.name,
        value: h.value,
        color: COLORS[i % COLORS.length]
    })).sort((a, b) => b.value - a.value);

    // Mock Cash for Details View
    const mockCash = 69235;
    const totalAssetWithCash = totalEvaluation + mockCash;

    // Keywords for news filtering
    const assetKeywords = holdings.map(h => h.name || h.symbol);

    return (
        <ScrollArea className="h-full bg-background">
            <main className="mx-auto w-full max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8 mb-20">
                {/* Main Page Header (Shared) */}
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
                                Premium
                            </Badge>
                            <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">Portfolio Management</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-foreground">나의 자산</h1>
                        <p className="mt-2 text-muted-foreground font-medium">실시간 통합 자산 관리 및 포트폴리오 분석</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                            <span className="text-xs text-muted-foreground font-medium block mb-1">Last updated: Just now</span>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-sm font-medium text-muted-foreground">Total Balance</div>
                                    <div className="text-3xl font-black text-foreground">{totalEvaluation.toLocaleString()}원</div>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="bg-[#34D399] hover:bg-[#10B981] text-zinc-900 font-bold px-6 h-11 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span>자산 추가</span>
                        </Button>
                    </div>
                </header>

                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="bg-muted p-1 border border-border">
                        <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <BarChart3 className="h-4 w-4" />
                            <span>현황</span>
                        </TabsTrigger>
                        <TabsTrigger value="details" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <LayoutGrid className="h-4 w-4" />
                            <span>상세 내역</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab (Original Design with Dynamic Data) */}
                    <TabsContent value="overview" className="space-y-8">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                                <p className="text-zinc-500 font-medium">자산 정보를 불러오는 중입니다...</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl">
                                <p className="font-bold">에러 발생</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        ) : (
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {/* Summary Cards */}
                                <div className="lg:col-span-2 grid gap-4 grid-cols-1 sm:grid-cols-2">
                                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-900/50">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-semibold text-zinc-500">Total Profit</CardTitle>
                                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                                                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className={`text-3xl font-bold ${totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"}`}>
                                                {totalProfit >= 0 ? "+" : ""}{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}원
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-2 font-medium">
                                                수익률 <span className={`${profitRate >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                    {profitRate >= 0 ? "+" : ""}{profitRate.toFixed(2)}%
                                                </span>
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-900/50">
                                        <CardHeader className="pb-2">
                                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                최고 수익률
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-3xl font-black truncate text-foreground">{bestPerformer?.name || "-"}</div>
                                                    <p className={`text-xs mt-2 font-black uppercase tracking-tight ${bestPerformer?.profitPercent >= 0 ? "text-primary" : "text-destructive"}`}>
                                                        +{bestPerformer ? bestPerformer.profitPercent.toFixed(1) + "%" : "-"}
                                                    </p>
                                                </div>
                                                <div className="w-[120px] h-[50px] opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <Sparkline 
                                                        data={[
                                                            { date: '2024-01-01', value: 100 },
                                                            { date: '2024-01-02', value: 105 },
                                                            { date: '2024-01-03', value: 102 },
                                                            { date: '2024-01-04', value: 108 },
                                                            { date: '2024-01-05', value: 115 },
                                                            { date: '2024-01-06', value: 112 },
                                                            { date: '2024-01-07', value: 125 },
                                                        ]}
                                                        isPositive={true}
                                                        color="#10B981"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="sm:col-span-2 border-none shadow-xl bg-white dark:bg-white/10 text-zinc-900 dark:text-white relative overflow-hidden group transition-all duration-500">
                                        <CardContent className="pt-6 relative z-10">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                <div className="flex items-start gap-5">
                                                    <div className="flex-shrink-0 bg-zinc-100 dark:bg-white/5 p-1 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-inner overflow-hidden w-[120px] h-[120px] flex items-center justify-center">
                                                        <DotLottieReact
                                                            src="https://lottie.host/7355ea35-b73f-4aef-a187-6aaf2c8c40f4/gcBPqH0jIx.lottie"
                                                            loop
                                                            autoplay
                                                            className="w-[200px] h-[200px]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black">tutum AI 인사이트</h3>
                                                        <p className="text-sm text-zinc-500 dark:text-zinc-200 mt-2 font-medium leading-relaxed max-w-[550px]">
                                                            현재 포트폴리오의 자산 배분이 {chartData.length > 3 ? "매우 이상적이며 안정적입니다." : "특정 분야에 집중되어 있습니다."}
                                                            {totalProfit < 0 ? " 시장 변동성에 대비한 리밸런싱을 추천드립니다." : " 실시간 모니터링을 통해 본인의 수익을 극대화하세요."}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className="w-fit bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-none font-black px-5 py-1.5 rounded-full text-[10px] uppercase tracking-widest animate-pulse hover:bg-emerald-500/20 pointer-events-none">
                                                    Safe Signal
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Personalized News Feed */}
                                    <div className="sm:col-span-2 mt-10">
                                        <PersonalizedNewsCarousel keywords={assetKeywords} />
                                    </div>
                                </div>

    
                                {/* Chart Card */}
                                <Card className="border-border shadow-none bg-card">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-black uppercase tracking-tight">자산 배분 현황</CardTitle>
                                        <CardDescription className="text-xs font-semibold text-muted-foreground">현재 보유 자산의 할당 비중</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <AssetAllocationChart data={chartData} />
                                    </CardContent>
                                </Card>

                                {/* Additional Dashboard Charts */}
                                <div className="lg:col-span-3">
                                    <PortfolioDashboardCharts data={chartData} />
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Details Tab (New Design Requested by User) */}
                    <TabsContent value="details">
                        <div className="space-y-6">
                            {/* Inner Header for Details Tab */}
                            <div className="bg-card p-10 rounded-2xl border border-border">
                                <div className="flex flex-col gap-1 mb-10">
                                    <span className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">총 자산 평가액</span>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-5xl font-black tracking-tighter text-foreground">
                                            {totalAssetWithCash.toLocaleString()} <span className="text-base font-normal text-muted-foreground uppercase">KRW</span>
                                        </h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-border pt-10">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium uppercase tracking-tight">총 투자 원금</span>
                                            <span className="font-black text-foreground">{totalEvaluation.toLocaleString()}원</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium uppercase tracking-tight">매수 금액</span>
                                            <span className="text-muted-foreground">{totalInvested.toLocaleString()}원</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-t border-border/50 pt-4">
                                            <span className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">누적 실현 손익</span>
                                            <div className={`text-lg font-black ${totalProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                                                {totalProfit > 0 ? "+" : ""}{totalProfit.toLocaleString()}원
                                                <span className="ml-2 text-xs opacity-70">
                                                    ({profitRate > 0 ? "+" : ""}{profitRate.toFixed(2)}%)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium uppercase tracking-tight">보유 현금</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-foreground">{mockCash.toLocaleString()}원</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Table Section */}
                            <div className="flex items-center justify-between mb-4 mt-12 pb-2 border-b-2 border-foreground/10">
                                <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">보유 자산 내역 <span className="text-muted-foreground text-xs font-normal ml-3">({holdings.length} Assets)</span></h3>
                            </div>

                            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                                            <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                                                <TableHead className="text-xs text-zinc-500 py-4 pl-6">종목명</TableHead>
                                                <TableHead className="text-xs text-zinc-500 py-4 text-right">평가금액</TableHead>
                                                <TableHead className="text-xs text-zinc-500 py-4 text-right">보유량</TableHead>
                                                <TableHead className="text-xs text-zinc-500 py-4 text-right">평단가</TableHead>
                                                <TableHead className="text-xs text-zinc-500 py-4 text-right">현재가</TableHead>
                                                <TableHead className="text-xs text-zinc-500 py-4 text-right pr-6">일간 수익 / 수익률</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {holdings.map((asset) => (
                                                <TableRow key={asset.symbol} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                                    <TableCell className="py-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${asset.profit >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" : "bg-rose-500/10 text-rose-600 dark:text-rose-500"}`}>
                                                                {asset.symbol[0]}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-200">{asset.name}</div>
                                                                <div className="text-xs text-zinc-500">{asset.symbol}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-200">{asset.value.toLocaleString()}원</div>
                                                        <div className="text-xs text-zinc-500">
                                                            {(totalEvaluation > 0 ? (asset.value / totalEvaluation) * 100 : 0).toFixed(1)}%
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4 text-sm text-zinc-700 dark:text-zinc-300">
                                                        {asset.amount.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right py-4 text-sm text-zinc-700 dark:text-zinc-300">
                                                        {asset.averagePrice.toLocaleString()}원
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{asset.currentPrice.toLocaleString()}원</div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4 pr-6">
                                                        <div className={`font-semibold text-sm ${asset.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                            {asset.change > 0 ? "+" : ""}{(asset.change * asset.amount).toLocaleString()}원
                                                        </div>
                                                        <div className={`text-xs ${asset.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                            {asset.changePercent > 0 ? "+" : ""}{asset.changePercent.toFixed(2)}%
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {holdings.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                                                        등록된 자산이 없습니다. 자산을 추가해보세요.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Cash Section */}
                            <div className="flex items-center justify-between mb-4 mt-12">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">현금</h3>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full px-4"
                                >
                                    현금 추가
                                </Button>
                            </div>

                            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden mb-12">
                                <CardContent className="p-0">
                                    <Table>
                                        <TableBody>
                                            <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                                <TableCell className="py-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold text-[10px]">
                                                            ₩
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-200">원</div>
                                                            <div className="text-xs text-zinc-500">KRW</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-200">{mockCash.toLocaleString()}원</div>
                                                </TableCell>
                                                <TableCell className="text-right py-4 text-sm text-zinc-500">
                                                    -
                                                </TableCell>
                                                <TableCell className="text-right py-4 text-sm text-zinc-500">
                                                    -
                                                </TableCell>
                                                <TableCell className="text-right py-4 text-sm text-zinc-500">
                                                    -
                                                </TableCell>
                                                <TableCell className="text-right py-4 pr-6 text-sm text-zinc-500">
                                                    -
                                                </TableCell>
                                            </TableRow>
                                            <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors last:border-0">
                                                <TableCell className="py-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold text-[10px]">
                                                            원
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-200">달러</div>
                                                            <div className="text-xs text-zinc-500">USD</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-200">0원</div>
                                                </TableCell>
                                                <TableCell className="text-right py-4 text-sm text-zinc-500">
                                                    -
                                                </TableCell>
                                                <TableCell className="text-right py-4 text-sm text-zinc-500">
                                                    -
                                                </TableCell>
                                                <TableCell className="text-right py-4 text-sm text-zinc-500">
                                                    -
                                                </TableCell>
                                                <TableCell className="text-right py-4 pr-6 text-sm text-zinc-500">
                                                    -
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                <Footer />
            </main>

            {/* Add Asset Modal */}
            <AddAssetModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
        </ScrollArea>
    );
}
