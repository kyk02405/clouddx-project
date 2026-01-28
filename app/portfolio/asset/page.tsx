"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Wallet, PieChart, ArrowUpRight, BarChart3, ListChecks, Plus } from "lucide-react";
import Footer from "@/components/Footer";
import AssetAllocationChart from "@/components/AssetAllocationChart";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddAssetModal from "@/components/AddAssetModal";
import { useAsset } from "@/context/AssetContext";

// Color palette for charts
const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1", "#14B8A6"];

export default function PortfolioAssetPage() {
    const { holdings } = useAsset();
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

    return (
        <ScrollArea className="h-full bg-zinc-50 dark:bg-zinc-950">
            <main className="mx-auto w-full max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
                {/* Main Page Header (Shared) */}
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-none">
                                Premium
                            </Badge>
                            <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">Portfolio Management</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">나의 자산</h1>
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400 font-medium">실시간 통합 자산 관리 및 포트폴리오 분석</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                            <span className="text-xs text-zinc-400 font-medium block mb-1">Last updated: Just now</span>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-sm font-medium text-zinc-500">Total Balance</div>
                                    <div className="text-3xl font-black text-black dark:text-white">${totalEvaluation.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 h-11 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span>자산 추가</span>
                        </Button>
                    </div>
                </header>

                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800">
                        <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:shadow-sm">
                            <BarChart3 className="h-4 w-4" />
                            자산 개요 (차트)
                        </TabsTrigger>
                        <TabsTrigger value="details" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:shadow-sm">
                            <ListChecks className="h-4 w-4" />
                            자산 상세 내역
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab (Original Design with Dynamic Data) */}
                    <TabsContent value="overview" className="space-y-8">
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
                                            {totalProfit >= 0 ? "+" : ""}${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </div>
                                        <p className="text-xs text-zinc-500 mt-2 font-medium">
                                            수익률 <span className={`${profitRate >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                {profitRate >= 0 ? "+" : ""}{profitRate.toFixed(2)}%
                                            </span>
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="border-zinc-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-900/50">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-semibold text-zinc-500">Best Performer</CardTitle>
                                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                            <ArrowUpRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold truncate">{bestPerformer?.name || "-"}</div>
                                        <p className={`text-xs mt-2 font-bold uppercase tracking-tight ${bestPerformer?.profitPercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                            Profit Rate: {bestPerformer ? (bestPerformer.profitPercent >= 0 ? "+" : "") + bestPerformer.profitPercent.toFixed(1) + "%" : "-"}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="sm:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-none bg-black dark:bg-white text-white dark:text-black">
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-bold">Tutum AI 인사이트</h3>
                                                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 font-medium">
                                                    현재 포트폴리오의 자산 배분이 {chartData.length > 3 ? "양호합니다." : "집중되어 있습니다."}
                                                    {totalProfit < 0 ? " 시장 변동성에 유의하세요." : " 안정적인 수익을 기록 중입니다."}
                                                </p>
                                            </div>
                                            <Badge className="w-fit bg-emerald-500 text-black dark:bg-emerald-400 dark:text-white border-none font-bold">
                                                Safe
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Chart Card */}
                            <Card className="border-zinc-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-900/50">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">자산 비중</CardTitle>
                                    <CardDescription className="font-medium">현재 보유 자산의 할당 비율</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AssetAllocationChart data={chartData} />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Details Tab (New Design Requested by User) */}
                    <TabsContent value="details">
                        <div className="space-y-6">
                            {/* Inner Header for Details Tab */}
                            <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
                                <div className="flex flex-col gap-1 mb-8">
                                    <span className="text-zinc-400 text-sm font-medium">총 자산</span>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-4xl font-bold tracking-tight text-white">
                                            {totalAssetWithCash.toLocaleString()} <span className="text-sm font-normal text-zinc-500">KRW</span>
                                        </h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-zinc-800 pt-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-400">투자</span>
                                            <span className="font-semibold text-white">{totalEvaluation.toLocaleString()}원</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-400">원금</span>
                                            <span className="text-zinc-500">{totalInvested.toLocaleString()}원</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-400">총 수익</span>
                                            <div className={`font-semibold ${totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                {totalProfit > 0 ? "+" : ""}{totalProfit.toLocaleString()}원
                                                <span className="ml-1 text-xs">
                                                    ({profitRate > 0 ? "+" : ""}{profitRate.toFixed(2)}%)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-400">현금</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-white">{mockCash.toLocaleString()}원</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Table */}
                            <div className="flex items-center justify-between mb-4 mt-8">
                                <h3 className="text-lg font-bold text-white">투자 종목 <span className="text-zinc-500 text-sm font-normal ml-2">총 {holdings.length}개</span></h3>
                            </div>

                            <Card className="border-zinc-800 bg-zinc-900/50 shadow-none overflow-hidden">
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-zinc-900/50 border-b border-zinc-800">
                                            <TableRow className="hover:bg-transparent border-zinc-800">
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
                                                <TableRow key={asset.symbol} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                                    <TableCell className="py-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${asset.profit >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                                                                {asset.symbol[0]}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm text-zinc-200">{asset.name}</div>
                                                                <div className="text-xs text-zinc-500">{asset.symbol}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <div className="font-semibold text-sm text-zinc-200">{asset.value.toLocaleString()}원</div>
                                                        <div className="text-xs text-zinc-500">
                                                            {(totalEvaluation > 0 ? (asset.value / totalEvaluation) * 100 : 0).toFixed(1)}%
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4 text-sm text-zinc-300">
                                                        {asset.amount.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right py-4 text-sm text-zinc-300">
                                                        {asset.averagePrice.toLocaleString()}원
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <div className="text-sm font-medium text-zinc-200">{asset.currentPrice.toLocaleString()}원</div>
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
                                <h3 className="text-lg font-bold text-white">현금</h3>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full px-4"
                                >
                                    현금 추가
                                </Button>
                            </div>

                            <Card className="border-zinc-800 bg-zinc-900/50 shadow-none overflow-hidden mb-12">
                                <CardContent className="p-0">
                                    <Table>
                                        <TableBody>
                                            <TableRow className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                                <TableCell className="py-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-400 font-bold text-[10px]">
                                                            ₩
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm text-zinc-200">원</div>
                                                            <div className="text-xs text-zinc-500">KRW</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="font-semibold text-sm text-zinc-200">{mockCash.toLocaleString()}원</div>
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
                                            <TableRow className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors last:border-0">
                                                <TableCell className="py-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-400 font-bold text-[10px]">
                                                            $
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm text-zinc-200">달러</div>
                                                            <div className="text-xs text-zinc-500">USD</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="font-semibold text-sm text-zinc-200">$0.00</div>
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
