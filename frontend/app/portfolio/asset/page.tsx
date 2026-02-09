"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Wallet, PieChart, ArrowUpRight, BarChart3, ListChecks, Plus, Loader2, LayoutGrid, ChevronDown, Clock, Trophy, Settings2, GripVertical, Check, ChevronLeft, ChevronRight, Activity, ShieldAlert, PieChart as PieChartIcon, Lightbulb, Sparkles, Trash2, Pencil, X, Calendar } from "lucide-react";
import Footer from "@/components/Footer";
import AssetAllocationChart from "@/components/AssetAllocationChart";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddAssetModal from "@/components/AddAssetModal";
import { useAsset, HoldingAsset } from "@/context/AssetContext";
import PersonalizedNewsCarousel from "@/components/PersonalizedNewsCarousel";
import PortfolioDashboardCharts from "@/components/PortfolioDashboardCharts";
import PortfolioHeatmap from "@/components/PortfolioHeatmap";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Sparkline from "@/components/Sparkline";
import { useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import SellAssetDialog from "@/components/SellAssetDialog";
import AIInsightsModal from "@/components/AIInsightsModal";

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
    const { holdings, isLoading, error, updateAsset, deleteAsset } = useAsset();
    const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{ average_price: string; quantity: string }>({ average_price: '', quantity: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [performanceMetric, setPerformanceMetric] = useState<'best' | 'worst' | 'longest'>('best');
    const [profitPeriod, setProfitPeriod] = useState<'all' | 'weekly' | 'monthly' | 'yearly' | 'loss'>('all');
    const [isEditMode, setIsEditMode] = useState(false);
    const [widgetOrder, setWidgetOrder] = useState<string[]>(['trends', 'heatmap', 'risk', 'sector', 'idea']);
    const [sellAsset, setSellAsset] = useState<HoldingAsset | null>(null);
    const [showAIInsights, setShowAIInsights] = useState(false);
    const [sellHistoryFilter, setSellHistoryFilter] = useState<'all' | 'profit' | 'loss'>('all');
    const [sellHistorySort, setSellHistorySort] = useState<'latest' | 'oldest' | 'amount'>('latest');

    // Persistence: Load layout settings
    useEffect(() => {
        const savedOrder = localStorage.getItem('tutum_dashboard_order');
        if (savedOrder) {
            try {
                const parsed = JSON.parse(savedOrder) as string[];
                // If the saved order has legacy keys (different count or specific keys), reset to default
                const currentKeys = ['trends', 'heatmap', 'risk', 'sector', 'idea'];
                const hasLegacyKeys = parsed.some(key => !currentKeys.includes(key)) || parsed.length !== currentKeys.length;
                
                if (hasLegacyKeys) {
                    localStorage.removeItem('tutum_dashboard_order');
                } else {
                    setWidgetOrder(parsed);
                }
            } catch (e) {
                console.error("Failed to parse dashboard order", e);
            }
        }
    }, []);

    // Persistence: Save layout settings
    useEffect(() => {
        if (widgetOrder.length > 0) {
            localStorage.setItem('tutum_dashboard_order', JSON.stringify(widgetOrder));
        }
    }, [widgetOrder]);
    const handleStartEdit = (asset: HoldingAsset) => {
        if (!asset.id) return;
        setEditingAssetId(asset.id);
        setEditValues({
            average_price: asset.averagePrice.toString(),
            quantity: asset.amount.toString()
        });
    };

    const handleSaveEdit = async () => {
        if (!editingAssetId) return;
        try {
            await updateAsset(editingAssetId, {
                average_price: Number(editValues.average_price),
                quantity: Number(editValues.quantity)
            });
            setEditingAssetId(null);
        } catch (err) {
            alert("수정 중 오류가 발생했습니다.");
        }
    };

    const moveWidget = (id: string, direction: 'left' | 'right') => {
        const index = widgetOrder.indexOf(id);
        if (index === -1) return;

        const newOrder = [...widgetOrder];
        const nextIndex = direction === 'left' ? index - 1 : index + 1;

        if (nextIndex >= 0 && nextIndex < widgetOrder.length) {
            [newOrder[index], newOrder[nextIndex]] = [newOrder[nextIndex], newOrder[index]];
            setWidgetOrder(newOrder);
        }
    };

    // Calculate Totals for Header & Overview
    const totalEvaluation = holdings.reduce((acc, curr) => acc + curr.value, 0);
    const totalInvested = holdings.reduce((acc, curr) => acc + (curr.amount * curr.averagePrice), 0);
    const totalProfit = totalEvaluation - totalInvested;
    const profitRate = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    // Logic for Daily Profit (Mock logic using current 'change' values)
    const dailyProfitRaw = holdings.reduce((acc, curr) => acc + (curr.change * curr.amount), 0);
    const dailyProfitPercent = totalInvested > 0 ? (dailyProfitRaw / totalInvested) * 100 : 0;

    // Calculate real unrealized losses (Sum of only negative positions)
    const unrealizedLosses = holdings.reduce((acc, curr) => {
        const profit = curr.value - (curr.amount * curr.averagePrice);
        return profit < 0 ? acc + profit : acc;
    }, 0);
    const lossRate = totalInvested > 0 ? (unrealizedLosses / totalInvested) * 100 : 0;

    // Multi-period Profit Logic (Mocking with realistic ratios)
    const getProfitData = () => {
        switch(profitPeriod) {
            case 'all': return { label: '총 손익 (전체)', value: totalProfit, rate: profitRate };
            case 'weekly': return { label: '이번 주 수익', value: totalProfit * 0.12, rate: profitRate * 0.1 };
            case 'monthly': return { label: '이번 달 수익', value: totalProfit * 0.45, rate: profitRate * 0.4 };
            case 'yearly': return { label: '이번 년도 수익', value: totalProfit * 0.85, rate: profitRate * 0.8 };
            case 'loss': return { label: '총 손실 (평가손)', value: unrealizedLosses, rate: lossRate };
            default: return { label: '오늘의 수익', value: dailyProfitRaw, rate: dailyProfitPercent };
        }
    };
    const currentProfit = getProfitData();

    // Performance Metrics Logic
    const sortedByProfit = [...holdings].sort((a, b) => b.profitPercent - a.profitPercent);
    const topGainer = sortedByProfit[0];
    const topLoser = sortedByProfit[sortedByProfit.length - 1];
    
    // Mock for longest held (In real app, fetch from transaction history)
    const longestHeld = holdings.length > 0 ? holdings[0] : null;

    const currentPerformanceAsset = 
        performanceMetric === 'best' ? topGainer : 
        performanceMetric === 'worst' ? topLoser : 
        longestHeld;

    const metricTitle = 
        performanceMetric === 'best' ? "최고 수익률" : 
        performanceMetric === 'worst' ? "최저 수익률" : 
        "최장 보유 종목";

    const metricIcon = 
        performanceMetric === 'best' ? <Trophy className="h-3 w-3 text-primary" /> : 
        performanceMetric === 'worst' ? <TrendingDown className="h-3 w-3 text-destructive" /> : 
        <Clock className="h-3 w-3 text-indigo-500" />;

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
            <main className="mx-auto w-full max-w-[1800px] px-4 py-4 md:py-8 sm:px-6 lg:px-8 mb-8 md:mb-12 pb-24 md:pb-32">
                {/* Main Page Header (Shared) */}
                <header className="mb-4 md:mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-8">
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
                                    <div className="text-sm md:text-base font-bold text-muted-foreground">총 자산</div>
                                    <div className="text-3xl md:text-5xl font-black text-foreground tracking-tighter">{Math.floor(totalEvaluation).toLocaleString()}원</div>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 h-11 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span>자산 추가</span>
                        </Button>
                    </div>
                </header>
                <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
                    <TabsList className="bg-muted p-1 border border-border">
                        <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <BarChart3 className="h-4 w-4" />
                            <span>현황</span>
                        </TabsTrigger>
                        <TabsTrigger value="details" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <LayoutGrid className="h-4 w-4" />
                            <span>상세 내역</span>
                        </TabsTrigger>
                        <TabsTrigger value="sell-history" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <TrendingDown className="h-4 w-4" />
                            <span>매도 내역</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab (Interactive Canvas Design) */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-black text-foreground">대시보드</h2>
                            </div>
                            {isEditMode && (
                                <Badge variant="outline" className="animate-pulse bg-primary/5 text-primary border-primary/20 flex items-center gap-1.5 py-1 px-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span className="text-[10px] font-bold">편집 중...</span>
                                </Badge>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                                <p className="text-zinc-500 font-medium">자산 정보를 불러오는 중입니다...</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl">
                                <p className="font-bold">에러 발생</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        ) : (
                            <div className="space-y-4 md:space-y-6">
                                {/* 1. Top Fixed Grid (Matches Diagram) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Row 1: Earnings & Performance */}
                                    <div className="lg:col-span-1 h-[180px]">
                                        <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-900/50">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-xs md:text-sm font-black uppercase tracking-widest text-zinc-500">{currentProfit.label}</CardTitle>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted">
                                                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 p-1.5 shadow-2xl">
                                                        <DropdownMenuItem onClick={() => setProfitPeriod('all')} className="text-sm font-bold py-2 px-3 rounded-lg">전체 기간</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setProfitPeriod('weekly')} className="text-sm font-bold py-2 px-3 rounded-lg">이번 주 수익</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setProfitPeriod('monthly')} className="text-sm font-bold py-2 px-3 rounded-lg">이번 달 수익</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setProfitPeriod('yearly')} className="text-sm font-bold py-2 px-3 rounded-lg">이번 년도 수익</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setProfitPeriod('loss')} className="text-sm font-bold py-2 px-3 rounded-lg text-rose-500 hover:text-rose-600">총 손실 보기</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </CardHeader>
                                            <CardContent>
                                                <AnimatePresence mode="wait">
                                                    <motion.div 
                                                        key={profitPeriod}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <div className={`text-3xl font-black ${currentProfit.value >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"}`}>
                                                            {currentProfit.value >= 0 ? "+" : ""}{Math.floor(currentProfit.value).toLocaleString()}원
                                                        </div>
                                                        <p className="text-[12px] text-zinc-500 mt-1 font-bold">
                                                            수익률 <span className={`${currentProfit.rate >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                                {currentProfit.rate >= 0 ? "+" : ""}{currentProfit.rate.toFixed(2)}%
                                                            </span>
                                                        </p>
                                                    </motion.div>
                                                </AnimatePresence>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="lg:col-span-1 h-[160px]">
                                        <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-900/50 group">
                                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                                <CardDescription className="text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-3">
                                                    {metricIcon}
                                                    {metricTitle}
                                                </CardDescription>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted">
                                                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 p-1.5 shadow-2xl">
                                                        <DropdownMenuItem onClick={() => setPerformanceMetric('best')} className="text-sm font-bold py-2 px-3 rounded-lg">최고 수익률</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setPerformanceMetric('worst')} className="text-sm font-bold py-2 px-3 rounded-lg">최저 수익률</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setPerformanceMetric('longest')} className="text-sm font-bold py-2 px-3 rounded-lg">최장 보유 종목</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xl font-black truncate text-foreground leading-tight">
                                                            {holdings.length > 0 ? (currentPerformanceAsset?.name || currentPerformanceAsset?.symbol) : "-"}
                                                        </div>
                                                        <p className={`text-[10px] mt-1 font-black uppercase tracking-tight ${currentPerformanceAsset && currentPerformanceAsset.profitPercent >= 0 ? "text-primary" : "text-destructive"}`}>
                                                            {currentPerformanceAsset 
                                                                ? (currentPerformanceAsset.profitPercent >= 0 ? "+" : "") + currentPerformanceAsset.profitPercent.toFixed(1) + "%" 
                                                                : "-"}
                                                        </p>
                                                    </div>
                                                    <div className="w-[60px] h-[30px]">
                                                        <Sparkline 
                                                            data={[{ date: '2024-02-01', value: 10 }, { date: '2024-02-02', value: 15 }, { date: '2024-02-03', value: 12 }, { date: '2024-02-04', value: 18 }]}
                                                            isPositive={currentPerformanceAsset ? currentPerformanceAsset.profitPercent >= 0 : true}
                                                            color={currentPerformanceAsset && currentPerformanceAsset.profitPercent >= 0 ? "#10B981" : "#F43F5E"}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Asset Allocation: Spans 2 Rows (Tall) */}
                                    <div className="md:col-span-2 lg:col-span-2 lg:row-span-2 h-[500px] md:h-[600px]">
                                        <Card className="h-full border-border shadow-none bg-card flex flex-col overflow-hidden">
                                            <CardHeader className="py-4 px-6 border-b border-border/50 flex flex-row items-center justify-between flex-shrink-0">
                                                <CardTitle className="text-sm md:text-base font-black uppercase tracking-widest text-muted-foreground">자산 배분 분석 (QUOTA)</CardTitle>
                                                <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent className="flex-1 p-4 md:p-6 flex items-center justify-center">
                                                <div className="w-full h-full min-h-[300px] md:min-h-[350px]">
                                                    <AssetAllocationChart data={chartData} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Row 2 Left Column: AI Analysis (Wider) */}
                                    <div className="md:col-span-2 lg:col-span-2 h-auto min-h-[154px]">
                                        <Card className="h-full border-none shadow-xl bg-white dark:bg-zinc-900/40 text-zinc-900 dark:text-white relative overflow-hidden group transition-all duration-500 cursor-pointer hover:shadow-2xl" onClick={() => setShowAIInsights(true)}>
                                            <CardContent className="p-6 h-full flex items-center">
                                                <div className="flex items-center gap-8 w-full">
                                                    <div className="flex-shrink-0 bg-zinc-100 dark:bg-white/5 p-1 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-inner overflow-hidden w-[100px] h-[100px] flex items-center justify-center">
                                                        <DotLottieReact
                                                            src="https://lottie.host/7355ea35-b73f-4aef-a187-6aaf2c8c40f4/gcBPqH0jIx.lottie"
                                                            loop autoplay
                                                            className="w-[140px] h-[140px]"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <Badge className="w-fit bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none font-black px-3 py-0.5 rounded-full text-[9px] uppercase tracking-widest mb-3">
                                                            AI Analysis
                                                        </Badge>
                                                        <h3 className="text-xl font-black mb-1">포트폴리오 리벨런싱 권고</h3>
                                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-tight line-clamp-2">
                                                            {chartData.length > 3 ? "분산 투자가 잘 이루어져 있습니다." : "특정 자산 집중도가 높습니다."} 안정성을 위해 채권형 자산 비중 확대를 추천합니다.
                                                        </p>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="mt-3 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 p-0 h-auto font-bold"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowAIInsights(true);
                                                            }}
                                                        >
                                                            자세히 보기 <ArrowUpRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Row 3: News (3 cols) & Secondary Insight (1 col) */}
                                    <div className="md:col-span-2 lg:col-span-3 h-[240px]">
                                        <div className="w-full h-full rounded-2xl border border-border/40 overflow-hidden bg-white/30 dark:bg-zinc-900/20">
                                            <PersonalizedNewsCarousel keywords={assetKeywords} />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-1 h-auto min-h-[240px]">
                                        <Card className="h-full border-2 border-emerald-500/20 shadow-none bg-emerald-50/10 dark:bg-emerald-950/5 flex flex-col justify-center items-center text-center p-6 space-y-4">
                                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600">
                                                <TrendingUp className="h-6 w-6" />
                                            </div>
                                             <div>
                                                <h4 className="text-lg font-black text-foreground mb-2 uppercase tracking-tight">Market Health</h4>
                                                <p className="text-base text-muted-foreground font-bold leading-tight">포트폴리오가 시장 수익률을<br/> 상회하고 있습니다.</p>
                                             </div>
                                             <Badge className="bg-emerald-500 text-white font-black text-sm px-4 py-1">GOOD</Badge>
                                        </Card>
                                    </div>
                                </div>

                                {/* Canvas Mode Toggle & Separator */}
                                <div className="flex items-center gap-4 py-8">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-border" />
                                    <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-border/50 bg-muted/30 backdrop-blur-sm">
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Canvas Mode</span>
                                        </div>
                                        <div className="h-3 w-[1px] bg-border mx-1" />
                                        <button 
                                            onClick={() => setIsEditMode(!isEditMode)}
                                            className={`w-10 h-5 rounded-full relative transition-colors duration-300 shadow-inner ${isEditMode ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${isEditMode ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-border to-border" />
                                </div>

                                {/* 2. Bottom Dynamic Grid (Canvas) - Forced 2-cols on mobile for smaller cards */}
                                <div className="grid gap-3 md:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    <AnimatePresence mode="popLayout" initial={false}>
                                    {widgetOrder.map((widgetId, index) => {
                                        const renderWidgetControls = (id: string) => (
                                            isEditMode && (
                                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center bg-popover border border-border rounded-full p-1 shadow-xl z-[30] gap-1 scale-90 group-hover:scale-100 transition-transform origin-bottom">
                                                    <Button 
                                                        disabled={index === 0}
                                                        onClick={() => moveWidget(id, 'left')}
                                                        variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted"
                                                    >
                                                        <ChevronLeft className="h-3 w-3" />
                                                    </Button>
                                                    <div className="h-3 w-[1px] bg-border mx-1" />
                                                    <Button 
                                                        disabled={index === widgetOrder.length - 1}
                                                        onClick={() => moveWidget(id, 'right')}
                                                        variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted"
                                                    >
                                                        <ChevronRight className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )
                                        );

                                        const springConfig = { type: "spring" as const, stiffness: 300, damping: 30 };

                                        if (widgetId === 'trends') return (
                                            <motion.div 
                                                key="trends" 
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={springConfig}
                                                className="col-span-2 lg:col-span-2 xl:col-span-2 h-[220px] md:h-[450px] relative z-10 group"
                                            >
                                                {renderWidgetControls('trends')}
                                                <div className={`h-full transition-all duration-300 ${isEditMode ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background rounded-2xl' : ''}`}>
                                                    <PortfolioDashboardCharts data={chartData} />
                                                </div>
                                            </motion.div>
                                        );

                                        if (widgetId === 'idea') return (
                                            <motion.div 
                                                key="idea" 
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={springConfig}
                                                className="col-span-1 lg:col-span-1 xl:col-span-1 h-[220px] md:h-[450px] relative z-10 group"
                                            >
                                                {renderWidgetControls('idea')}
                                                <Card className={`h-full border-2 border-primary/20 shadow-none bg-white dark:bg-zinc-900 group transition-all duration-300 ${isEditMode ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background' : ''}`}>
                                                    <CardHeader className="p-3 md:p-4 pb-2 md:pb-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 md:gap-3">
                                                                <div className="p-1.5 md:p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                                                                    <Lightbulb className="h-4 w-4 md:h-5 md:w-5" />
                                                                </div>
                                                                <CardTitle className="text-[10px] md:text-base font-black uppercase tracking-widest text-zinc-500 truncate">인사이트</CardTitle>
                                                            </div>
                                                            <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-amber-400 animate-pulse" />
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="flex flex-col h-[calc(100%-60px)] md:h-[calc(100%-80px)] p-3 md:p-6 pt-0">
                                                        <div className="space-y-3 md:space-y-4 flex-1 overflow-hidden">
                                                            <div className="p-2 md:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                                                <h4 className="text-[10px] md:text-base font-black text-foreground mb-1 leading-tight truncate">배당 수익 최적화</h4>
                                                                <p className="hidden md:block text-xs md:text-sm text-muted-foreground font-bold leading-relaxed">보유하신 기술주 비중을 줄이고 고배당 ETF로 갈아타시면 연 4%의 추가 현금 흐름을 기대할 수 있습니다.</p>
                                                                <p className="md:hidden text-[9px] text-muted-foreground font-bold leading-tight line-clamp-2">고배당 ETF 교체로 수익률 개선 추천</p>
                                                            </div>
                                                            <div className="p-2 md:p-4 bg-primary/5 rounded-xl border border-primary/10">
                                                                <h4 className="text-[10px] md:text-base font-black text-primary mb-1 leading-tight truncate">신규 투자 아이디어</h4>
                                                                <p className="hidden md:block text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-bold leading-relaxed">최근 원자재 가격 하락에 따른 금(Gold) 자산 분할 매수를 추천드립니다.</p>
                                                                <p className="md:hidden text-[9px] text-zinc-600 dark:text-zinc-400 font-bold leading-tight truncate">금(Gold) 자산 분할 매수 추천</p>
                                                            </div>
                                                        </div>
                                                        <Button className="w-full text-[9px] md:text-xs font-black uppercase tracking-widest h-8 md:h-12 mt-2 md:mt-4 shrink-0">실행</Button>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );

                                        if (widgetId === 'risk') return (
                                            <motion.div 
                                                key="risk" 
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={springConfig}
                                                className="col-span-1 h-[220px] md:h-[450px] relative z-10 group"
                                            >
                                                {renderWidgetControls('risk')}
                                                <Card className={`h-full border-border shadow-none bg-card transition-all duration-300 ${isEditMode ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background' : ''}`}>
                                                    <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
                                                    <CardTitle className="text-[10px] md:text-base font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 md:gap-3">
                                                            <ShieldAlert className="h-4 w-4" />
                                                            <span className="truncate">리스크</span>
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="flex flex-col items-center justify-center p-2 md:p-6 pt-2 md:pt-4">
                                                        <div className="relative flex items-center justify-center w-20 h-20 md:w-32 md:h-32 mb-4 md:mb-6">
                                                            <svg className="w-full h-full transform -rotate-90">
                                                                <circle className="text-muted/20" strokeWidth="6 md:8" stroke="currentColor" fill="transparent" r="34 md:54" cx="40 md:64" cy="40 md:64" />
                                                                <circle className="text-emerald-500 transition-all duration-1000" strokeWidth="6 md:8" strokeDasharray="213 md:339" strokeDashoffset={213 * (1 - 0.72)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="34 md:54" cx="40 md:64" cy="40 md:64" />
                                                            </svg>
                                                            <div className="absolute flex flex-col items-center">
                                                                <span className="text-xl md:text-5xl font-black">72</span>
                                                                <span className="text-[8px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5 md:mt-1">Stable</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full space-y-2 md:space-y-4 px-2 md:px-4">
                                                            <div className="flex justify-between text-[8px] md:text-xs font-black uppercase tracking-wider">
                                                                <span className="text-muted-foreground">Volatility</span>
                                                                <span className="text-emerald-500">Low</span>
                                                            </div>
                                                            <div className="w-full h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500 w-[30%]" />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );

                                        if (widgetId === 'heatmap') return (
                                            <motion.div 
                                                key="heatmap" 
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={springConfig}
                                                className="col-span-1 h-[220px] md:h-[450px] relative z-10 group"
                                            >
                                                {renderWidgetControls('heatmap')}
                                                <div className={`h-full transition-all duration-300 ${isEditMode ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background rounded-2xl' : ''}`}>
                                                    <PortfolioHeatmap />
                                                </div>
                                            </motion.div>
                                        );

                                        if (widgetId === 'sector') return (
                                            <motion.div 
                                                key="sector" 
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={springConfig}
                                                className="col-span-1 h-[220px] md:h-[450px] relative z-10 group"
                                            >
                                                {renderWidgetControls('sector')}
                                                <Card className={`h-full border-border shadow-none bg-card transition-all duration-300 ${isEditMode ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background' : ''}`}>
                                                    <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
                                                        <CardTitle className="text-[10px] md:text-base font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 md:gap-3">
                                                            <Activity className="h-4 w-4 md:h-5 md:w-5" />
                                                            <span className="truncate">섹터</span>
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-3 md:p-6 pt-0 md:pt-2">
                                                        <div className="space-y-3 md:space-y-5">
                                                            {[
                                                                { name: '기술/IT', value: 45, color: 'bg-indigo-500' },
                                                                { name: '금융', value: 25, color: 'bg-emerald-500' },
                                                                { name: '소비재', value: 15, color: 'bg-amber-500' },
                                                                { name: '기타', value: 15, color: 'bg-zinc-400' },
                                                            ].map(sector => (
                                                                <div key={sector.name} className="space-y-1.5 md:space-y-2.5">
                                                                    <div className="flex justify-between items-center text-[9px] md:text-sm font-black uppercase tracking-tight">
                                                                        <span className="text-muted-foreground truncate">{sector.name}</span>
                                                                        <span className="text-foreground">{sector.value}%</span>
                                                                    </div>
                                                                    <div className="w-full h-2 md:h-3 bg-muted rounded-full overflow-hidden">
                                                                        <div className={`h-full ${sector.color}`} style={{ width: `${sector.value}%` }} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );

                                        return null;
                                    })}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Details Tab (New Design Requested by User) */}
                    <TabsContent value="details">
                        <div className="space-y-6">
                            {/* Inner Header for Details Tab */}
                             <div className="bg-card p-4 md:p-12 rounded-2xl md:rounded-3xl border-2 border-border shadow-lg overflow-hidden">
                                <div className="flex flex-col gap-2 mb-8">
                                    <span className="text-muted-foreground text-xs md:text-sm font-black uppercase tracking-[0.2em] mb-2">총 자산 평가액</span>
                                    <div className="flex items-baseline gap-2">
                                         <h2 className="text-2xl md:text-5xl font-black tracking-tighter text-foreground truncate">
                                            {totalAssetWithCash.toLocaleString()} <span className="text-xs md:text-base font-normal text-muted-foreground uppercase ml-1">KRW</span>
                                        </h2>
                                    </div>
                                </div>
 
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 border-t border-border/60 pt-8 md:pt-12">
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-center">
                                             <span className="text-muted-foreground font-bold uppercase tracking-tight text-sm md:text-base">총 투자 원금</span>
                                             <span className="font-black text-foreground text-lg md:text-xl">{Math.floor(totalEvaluation).toLocaleString()}원</span>
                                        </div>
                                        <div className="flex justify-between items-center text-base">
                                             <span className="text-muted-foreground font-bold uppercase tracking-tight text-xs md:text-base">매수 금액</span>
                                             <span className="text-muted-foreground font-bold text-sm md:text-base">{Math.floor(totalInvested).toLocaleString()}원</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-6 border-t border-border/40">
                                            <span className="text-muted-foreground font-black uppercase tracking-widest text-xs">누적 실현 손익</span>
                                            <div className={`text-xl font-black ${totalProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                                                {totalProfit > 0 ? "+" : ""}{Math.floor(totalProfit).toLocaleString()}원
                                                <span className="ml-2 text-xs opacity-80">
                                                    ({profitRate > 0 ? "+" : ""}{profitRate.toFixed(2)}%)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
 
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground font-bold uppercase tracking-tight text-base">보유 현금</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-foreground text-xl">{mockCash.toLocaleString()}원</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </div>

                            {/* Detailed Table Section */}
                             <div className="flex items-center justify-between mb-4 mt-8 md:mt-12 pb-2 border-b-2 border-foreground/10">
                                <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter text-foreground">보유 자산 내역 <span className="text-muted-foreground text-[10px] md:text-xs font-normal ml-2 md:ml-3">({holdings.length} Assets)</span></h3>
                             </div>
 
                             {/* Desktop Table: Hidden on Mobile */}
                             <Card className="hidden md:block border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden mx-0">
                                <CardContent className="p-0 overflow-hidden">
                                     <div className="overflow-x-auto w-full scrollbar-hide touch-pan-x">
                                         <Table className="min-w-[700px] w-full">
                                             <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                                                <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                                                    <TableHead className="text-sm font-bold text-zinc-500 py-6 pl-8">종목명</TableHead>
                                                    <TableHead className="text-sm font-bold text-zinc-500 py-6 text-right">평가금액</TableHead>
                                                    <TableHead className="text-sm font-bold text-zinc-500 py-6 text-right">보유량</TableHead>
                                                    <TableHead className="text-sm font-bold text-zinc-500 py-6 text-right">평단가</TableHead>
                                                    <TableHead className="text-sm font-bold text-zinc-500 py-6 text-right">현재가</TableHead>
                                                    <TableHead className="text-sm font-bold text-zinc-500 py-6 text-right">수수익 / 수익률</TableHead>
                                                    <TableHead className="text-sm font-bold text-zinc-500 py-6 text-center">매수 사유</TableHead>
                                                    <TableHead className="text-sm font-bold text-zinc-500 py-6 text-center pr-8">관리</TableHead>
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
                                                            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-200">{Math.floor(asset.value).toLocaleString()}원</div>
                                                            <div className="text-xs text-zinc-500">
                                                                {(totalEvaluation > 0 ? (asset.value / totalEvaluation) * 100 : 0).toFixed(1)}%
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-4 text-sm text-zinc-700 dark:text-zinc-300">
                                                            {editingAssetId === asset.id ? (
                                                                <Input 
                                                                    type="number"
                                                                    value={editValues.quantity}
                                                                    onChange={(e) => setEditValues(prev => ({ ...prev, quantity: e.target.value }))}
                                                                    className="h-8 w-24 ml-auto text-right"
                                                                />
                                                            ) : (
                                                                asset.amount.toLocaleString()
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right py-4 text-sm text-zinc-700 dark:text-zinc-300">
                                                            {editingAssetId === asset.id ? (
                                                                <Input 
                                                                    type="number"
                                                                    value={editValues.average_price}
                                                                    onChange={(e) => setEditValues(prev => ({ ...prev, average_price: e.target.value }))}
                                                                    className="h-8 w-32 ml-auto text-right"
                                                                />
                                                            ) : (
                                                                `${Math.floor(asset.averagePrice).toLocaleString()}원`
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right py-4">
                                                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{Math.floor(asset.currentPrice).toLocaleString()}원</div>
                                                        </TableCell>
                                                         <TableCell className="text-right py-6">
                                                            <div className={`font-black text-base ${asset.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                                {asset.change > 0 ? "+" : ""}{Math.floor(asset.change * asset.amount).toLocaleString()}원
                                                            </div>
                                                            <div className={`text-sm font-bold ${asset.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                                {asset.changePercent > 0 ? "+" : ""}{asset.changePercent.toFixed(2)}%
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center py-6">
                                                            {asset.buyReason ? (
                                                                <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                                                                    {asset.buyReason}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-xs text-zinc-400">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right py-4 pr-6">
                                                            <div className="flex justify-center gap-1">
                                                                {editingAssetId === asset.id ? (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                                                            onClick={handleSaveEdit}
                                                                        >
                                                                            <Check className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                                                                            onClick={() => setEditingAssetId(null)}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                                            onClick={() => handleStartEdit(asset)}
                                                                        >
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                                                                            onClick={() => setSellAsset(asset)}
                                                                            title="매도"
                                                                        >
                                                                            <TrendingDown className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                                            onClick={() => {
                                                                                if (asset.id && confirm(`${asset.name}을(를) 삭제하시겠습니까?`)) {
                                                                                    deleteAsset(asset.id);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {holdings.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                                                            등록된 자산이 없습니다. 자산을 추가해보세요.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Mobile Card List: Hidden on Desktop */}
                            <div className="md:hidden space-y-4">
                                {holdings.map((asset) => (
                                    <Card key={asset.symbol} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${asset.profit >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" : "bg-rose-500/10 text-rose-600 dark:text-rose-500"}`}>
                                                    {asset.symbol[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-200">{asset.name}</div>
                                                    <div className="text-xs text-zinc-500">{asset.symbol}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400"
                                                    onClick={() => handleStartEdit(asset)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400"
                                                    onClick={() => asset.id && confirm(`${asset.name}을(를) 삭제하시겠습니까?`) && deleteAsset(asset.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                                            <div>
                                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">평가금액</p>
                                                <p className="font-bold text-sm">{Math.floor(asset.value).toLocaleString()}원</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">수익 / 수익률</p>
                                                <p className={`font-bold text-sm ${asset.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                    {asset.change > 0 ? "+" : ""}{Math.floor(asset.change * asset.amount).toLocaleString()}원
                                                    <span className="ml-1 text-[10px]">({asset.changePercent > 0 ? "+" : ""}{asset.changePercent.toFixed(1)}%)</span>
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">보유량</p>
                                                <p className="text-sm font-medium">{asset.amount.toLocaleString()} <span className="text-[10px] text-zinc-500">{asset.symbol}</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">현재가</p>
                                                <p className="text-sm font-medium">{Math.floor(asset.currentPrice).toLocaleString()}원</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {holdings.length === 0 && (
                                    <div className="py-12 text-center text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                        등록된 자산이 없습니다.
                                    </div>
                                )}
                            </div>

                            {/* Cash Section Title */}
                            <div className="flex items-center justify-between mb-4 mt-8 md:mt-12">
                                <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter text-foreground">현금</h3>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 md:h-9 text-[10px] md:text-xs border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full px-4 font-black uppercase tracking-widest"
                                >
                                    현금 추가
                                </Button>
                            </div>

                            {/* Desktop Cash Table: Hidden on Mobile */}
                            <Card className="hidden md:block border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden mb-12">
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
                                                <TableCell className="text-right py-4 text-sm text-zinc-500">-</TableCell>
                                                <TableCell className="text-right py-4 text-sm text-zinc-500">-</TableCell>
                                                <TableCell className="text-right py-4 text-sm text-zinc-500">-</TableCell>
                                                <TableCell className="text-right py-4 pr-6 text-sm text-zinc-500">-</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Mobile Cash Card: Hidden on Desktop */}
                            <div className="md:hidden space-y-4 mb-12">
                               <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden p-4">
                                   <div className="flex justify-between items-center">
                                       <div className="flex items-center gap-3">
                                           <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold text-xs">
                                               ₩
                                           </div>
                                           <div>
                                               <div className="font-bold text-sm text-zinc-900 dark:text-zinc-200">원화</div>
                                               <div className="text-xs text-zinc-500">KRW</div>
                                           </div>
                                       </div>
                                       <div className="text-right">
                                           <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">보유 금액</p>
                                           <p className="font-bold text-sm">{mockCash.toLocaleString()}원</p>
                                       </div>
                                   </div>
                               </Card>
                               <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden p-4 opacity-70">
                                   <div className="flex justify-between items-center">
                                       <div className="flex items-center gap-3">
                                           <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold text-xs">
                                               $
                                           </div>
                                           <div>
                                               <div className="font-bold text-sm text-zinc-900 dark:text-zinc-200">달러</div>
                                               <div className="text-xs text-zinc-500">USD</div>
                                           </div>
                                       </div>
                                       <div className="text-right">
                                           <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">보유 금액</p>
                                           <p className="font-bold text-sm">0원</p>
                                       </div>
                                   </div>
                               </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Sell History Tab */}
                    <TabsContent value="sell-history">
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="flex items-center gap-4 overflow-x-auto pb-2">
                                <Card className="flex-shrink-0 w-[90px] h-[130px]">
                                    <CardContent className="p-3 h-full flex flex-col items-center justify-center text-center">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-2">
                                            <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mb-1">총 매도</p>
                                        <p className="text-lg font-black leading-tight">₩12.5M</p>
                                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5">+₩2.3M</p>
                                    </CardContent>
                                </Card>
                                <Card className="flex-shrink-0 w-[90px] h-[130px]">
                                    <CardContent className="p-3 h-full flex flex-col items-center justify-center text-center">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center mb-2">
                                            <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mb-1">최고 수익</p>
                                        <p className="text-sm font-black leading-tight">BTC</p>
                                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5">+16.67%</p>
                                    </CardContent>
                                </Card>
                                <Card className="flex-shrink-0 w-[90px] h-[130px]">
                                    <CardContent className="p-3 h-full flex flex-col items-center justify-center text-center">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mb-2">
                                            <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mb-1">매도 성향</p>
                                        <p className="text-xs font-black leading-tight">목표가</p>
                                        <p className="text-[9px] text-muted-foreground mt-0.5">45일 보유</p>
                                    </CardContent>
                                </Card>
                                <Card className="flex-shrink-0 w-[90px] h-[130px]">
                                    <CardContent className="p-3 h-full flex flex-col items-center justify-center text-center">
                                        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center mb-2">
                                            <Activity className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mb-1">총 거래</p>
                                        <p className="text-2xl font-black leading-tight">15</p>
                                        <p className="text-[9px] text-muted-foreground mt-0.5">이번 달</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Filters */}
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>월별</span>
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem>2026년 2월</DropdownMenuItem>
                                        <DropdownMenuItem>2026년 1월</DropdownMenuItem>
                                        <DropdownMenuItem>2025년 12월</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <span>필터: {sellHistoryFilter === 'all' ? '전체' : sellHistoryFilter === 'profit' ? '수익' : '손실'}</span>
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem onClick={() => setSellHistoryFilter('all')}>전체</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSellHistoryFilter('profit')}>수익만</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSellHistoryFilter('loss')}>손실만</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Compact Table */}
                            {(() => {
                                const mockSellHistory = [
                                    { id: '1', date: '2026-02-08', symbol: 'AAPL', name: 'Apple Inc.', qty: 10, price: 180000, profit: 300000, rate: 20, reason: '목표가 도달' },
                                    { id: '2', date: '2026-02-07', symbol: 'TSLA', name: 'Tesla Inc.', qty: 5, price: 200000, profit: -100000, rate: -9.09, reason: '손절' },
                                    { id: '3', date: '2026-02-05', symbol: 'BTC', name: 'Bitcoin', qty: 0.5, price: 70000000, profit: 5000000, rate: 16.67, reason: '리밸런싱' },
                                ];

                                let filtered = mockSellHistory;
                                if (sellHistoryFilter === 'profit') {
                                    filtered = filtered.filter(t => t.profit > 0);
                                } else if (sellHistoryFilter === 'loss') {
                                    filtered = filtered.filter(t => t.profit < 0);
                                }

                                return (
                                    <Card>
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-muted/50 border-b">
                                                        <tr>
                                                            <th className="text-left p-3 text-xs font-bold text-muted-foreground">날짜</th>
                                                            <th className="text-left p-3 text-xs font-bold text-muted-foreground">종목</th>
                                                            <th className="text-right p-3 text-xs font-bold text-muted-foreground">수량</th>
                                                            <th className="text-right p-3 text-xs font-bold text-muted-foreground">매도가</th>
                                                            <th className="text-right p-3 text-xs font-bold text-muted-foreground">실현손익</th>
                                                            <th className="text-left p-3 text-xs font-bold text-muted-foreground">사유</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filtered.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                                    매도 내역이 없습니다.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            filtered.map((tx) => (
                                                                <tr key={tx.id} className="border-b hover:bg-muted/30 transition-colors">
                                                                    <td className="p-3 text-sm">{tx.date}</td>
                                                                    <td className="p-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold text-sm">{tx.name}</span>
                                                                            <Badge variant="outline" className="text-xs">{tx.symbol}</Badge>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 text-right text-sm">{tx.qty}</td>
                                                                    <td className="p-3 text-right text-sm font-medium">₩{tx.price.toLocaleString()}</td>
                                                                    <td className="p-3 text-right">
                                                                        <div className={`font-bold text-sm ${tx.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                                            {tx.profit >= 0 ? '+' : ''}₩{tx.profit.toLocaleString()}
                                                                        </div>
                                                                        <div className={`text-xs ${tx.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                                            {tx.rate >= 0 ? '+' : ''}{tx.rate.toFixed(2)}%
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <Badge className="text-xs">{tx.reason}</Badge>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })()}
                        </div>
                    </TabsContent>
                </Tabs>

                <Footer />
            </main>

            {/* Add Asset Modal */}
            <AddAssetModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
            
            {/* Sell Asset Dialog */}
            <SellAssetDialog
                asset={sellAsset}
                open={!!sellAsset}
                onOpenChange={(open) => !open && setSellAsset(null)}
                onSellComplete={() => {
                    // Refresh holdings after sell
                    window.location.reload();
                }}
            />
            
            {/* AI Insights Modal */}
            <AIInsightsModal
                open={showAIInsights}
                onOpenChange={setShowAIInsights}
            />
        </ScrollArea>
    );
}
