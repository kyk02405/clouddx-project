"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Wallet, PieChart, ArrowUpRight, BarChart3, ListChecks } from "lucide-react";
import Footer from "@/components/Footer";
import AssetAllocationChart from "@/components/AssetAllocationChart";
import { ScrollArea } from "@/components/ui/scroll-area";

const mockPositions = [
    { symbol: "BTC", name: "Bitcoin", amount: "0.45", value: 42400, displayValue: "$42,400", avgPrice: "$38,500", pnl: "+10.1%", isPositive: true, color: "#F7931A" },
    { symbol: "ETH", name: "Ethereum", amount: "5.2", value: 12168, displayValue: "$12,168", avgPrice: "$2,150", pnl: "+8.9%", isPositive: true, color: "#627EEA" },
    { symbol: "SOL", name: "Solana", amount: "125", value: 12312, displayValue: "$12,312", avgPrice: "$105.2", pnl: "-6.4%", isPositive: false, color: "#14F195" },
    { symbol: "NVDA", name: "Nvidia", amount: "15", value: 13245, displayValue: "$13,245", avgPrice: "$750.4", pnl: "+17.6%", isPositive: true, color: "#76B900" },
];

export default function PortfolioAssetPage() {
    return (
        <ScrollArea className="h-full bg-zinc-50 dark:bg-zinc-950">
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
                                    <div className="text-3xl font-black text-black dark:text-white">$79,245.50</div>
                                </div>
                            </div>
                        </div>
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

                    <TabsContent value="overview" className="space-y-8">
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {/* Summary Cards */}
                            <div className="lg:col-span-2 grid gap-4 grid-cols-1 sm:grid-cols-2">
                                <Card className="border-zinc-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-900/50">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-semibold text-zinc-500">Daily Profit</CardTitle>
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                                            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">+$1,982.20</div>
                                        <p className="text-xs text-zinc-500 mt-2 font-medium">
                                            전일 대비 <span className="text-emerald-500">+2.5%</span> 상승
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
                                        <div className="text-3xl font-bold">Nvidia</div>
                                        <p className="text-xs text-emerald-500 mt-2 font-bold uppercase tracking-tight">
                                            Profit Rate: +17.6%
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="sm:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-none bg-black dark:bg-white text-white dark:text-black">
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-bold">Tutum AI 인사이트</h3>
                                                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 font-medium">
                                                    귀하의 포트폴리오는 현재 기술주 비중이 높습니다.
                                                    자산 다각화를 고려해 보세요.
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
                                    <AssetAllocationChart data={mockPositions.map(p => ({
                                        symbol: p.symbol,
                                        name: p.name,
                                        value: p.value,
                                        color: p.color
                                    }))} />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="details">
                        <Card className="border-zinc-200 dark:border-zinc-800 shadow-none overflow-hidden bg-white dark:bg-zinc-900/50">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto text-black dark:text-white">
                                    <Table className="w-full">
                                        <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400 uppercase text-[10px] font-black tracking-widest">
                                            <TableRow className="hover:bg-transparent border-b border-zinc-100 dark:border-zinc-800">
                                                <TableHead className="px-8 py-6">Asset</TableHead>
                                                <TableHead className="px-8 py-6 text-right">Holdings</TableHead>
                                                <TableHead className="px-8 py-6 text-right">Market Value</TableHead>
                                                <TableHead className="px-8 py-6 text-right">Avg Price</TableHead>
                                                <TableHead className="px-8 py-6 text-right">PNL / Rate</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mockPositions.map((pos) => (
                                                <TableRow key={pos.symbol} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all border-b border-zinc-100 dark:border-zinc-800 last:border-0 text-black dark:text-white">
                                                    <TableCell className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm border border-zinc-100 dark:border-zinc-800" style={{ backgroundColor: `${pos.color}15`, color: pos.color }}>
                                                                {pos.symbol}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-zinc-900 dark:text-zinc-50">{pos.name}</div>
                                                                <div className="text-xs text-zinc-400 font-medium">{pos.symbol} Network</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-8 py-6 text-right font-bold text-zinc-700 dark:text-zinc-300">{pos.amount} <span className="text-[10px] text-zinc-400 ml-1">{pos.symbol}</span></TableCell>
                                                    <TableCell className="px-8 py-6 text-right font-black text-lg">{pos.displayValue}</TableCell>
                                                    <TableCell className="px-8 py-6 text-right font-medium text-zinc-400">{pos.avgPrice}</TableCell>
                                                    <TableCell className={`px-8 py-6 text-right font-black ${pos.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-center gap-1">
                                                                {pos.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                                {pos.pnl}
                                                            </div>
                                                            <span className="text-[10px] opacity-60 font-medium">Unrealized</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            <Footer />
        </ScrollArea>
    );
}
