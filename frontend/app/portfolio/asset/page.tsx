"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Wallet, PieChart, ArrowUpRight, BarChart3, ListChecks, Plus, Loader2, LayoutGrid, ChevronDown, Clock, Trophy, Settings2, GripVertical, Check, ChevronLeft, ChevronRight, Activity, ShieldAlert, PieChart as PieChartIcon, Lightbulb, Sparkles } from "lucide-react";
import Footer from "@/components/Footer";
import AssetAllocationChart from "@/components/AssetAllocationChart";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddAssetModal from "@/components/AddAssetModal";
import { useAsset } from "@/context/AssetContext";
import PersonalizedNewsCarousel from "@/components/PersonalizedNewsCarousel";
import PortfolioDashboardCharts from "@/components/PortfolioDashboardCharts";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Sparkline from "@/components/Sparkline";
import { useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, Reorder, AnimatePresence } from "framer-motion";

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
    const [performanceMetric, setPerformanceMetric] = useState<'best' | 'worst' | 'longest'>('best');
    const [profitPeriod, setProfitPeriod] = useState<'all' | 'weekly' | 'monthly' | 'yearly' | 'loss'>('all');
    const [isEditMode, setIsEditMode] = useState(false);
    const [widgetOrder, setWidgetOrder] = useState<string[]>(['trends', 'risk', 'sector', 'idea']);

    // Persistence: Load layout settings
    useEffect(() => {
        const savedOrder = localStorage.getItem('tutum_dashboard_order');
        if (savedOrder) {
            try {
                const parsed = JSON.parse(savedOrder) as string[];
                // If the saved order has legacy keys (different count or specific keys), reset to default
                const currentKeys = ['trends', 'risk', 'sector', 'idea'];
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

                    {/* Overview Tab (Interactive Canvas Design) */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-black text-foreground">대시보드</h2>
                                <div className="h-4 w-[1px] bg-border mx-2" />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Canvas Mode</span>
                                    <button 
                                        onClick={() => setIsEditMode(!isEditMode)}
                                        className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isEditMode ? 'bg-primary' : 'bg-muted border border-border'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${isEditMode ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>
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
                                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                                <p className="text-zinc-500 font-medium">자산 정보를 불러오는 중입니다...</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl">
                                <p className="font-bold">에러 발생</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                {/* 1. Top Fixed Grid (Matches Diagram) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
                                    {/* Row 1: Earnings & Performance */}
                                    <div className="lg:col-span-1 h-[160px]">
                                        <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-900/50">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{currentProfit.label}</CardTitle>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted">
                                                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onClick={() => setProfitPeriod('all')} className="text-xs font-medium">전체 기간</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setProfitPeriod('weekly')} className="text-xs font-medium">이번 주 수익</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setProfitPeriod('monthly')} className="text-xs font-medium">이번 달 수익</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setProfitPeriod('yearly')} className="text-xs font-medium">이번 년도 수익</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setProfitPeriod('loss')} className="text-xs font-medium text-rose-500">총 손실 보기</DropdownMenuItem>
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
                                                        <div className={`text-2xl font-black ${currentProfit.value >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"}`}>
                                                            {currentProfit.value >= 0 ? "+" : ""}{currentProfit.value.toLocaleString()}원
                                                        </div>
                                                        <p className="text-[10px] text-zinc-500 mt-1 font-bold">
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
                                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    {metricIcon}
                                                    {metricTitle}
                                                </CardDescription>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted">
                                                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onClick={() => setPerformanceMetric('best')} className="text-xs font-medium">최고 수익률</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setPerformanceMetric('worst')} className="text-xs font-medium">최저 수익률</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setPerformanceMetric('longest')} className="text-xs font-medium">최장 보유 종목</DropdownMenuItem>
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
                                    <div className="lg:col-span-2 lg:row-span-2 h-[338px]">
                                        <Card className="h-full border-border shadow-none bg-card flex flex-col overflow-hidden">
                                            <CardHeader className="py-4 px-6 border-b border-border/50 flex flex-row items-center justify-between flex-shrink-0">
                                                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">자산 배분 분석 (QUOTA)</CardTitle>
                                                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent className="flex-1 p-6 flex items-center justify-center">
                                                <div className="w-full h-full min-h-[220px]">
                                                    <AssetAllocationChart data={chartData} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Row 2 Left Column: AI Analysis (Wider) */}
                                    <div className="lg:col-span-2 h-[154px]">
                                        <Card className="h-full border-none shadow-xl bg-white dark:bg-zinc-900/40 text-zinc-900 dark:text-white relative overflow-hidden group transition-all duration-500">
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
                                                        <Badge className="w-fit bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-none font-black px-3 py-0.5 rounded-full text-[9px] uppercase tracking-widest mb-3">
                                                            AI Analysis
                                                        </Badge>
                                                        <h3 className="text-xl font-black mb-1">포트폴리오 리벨런싱 권고</h3>
                                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-tight line-clamp-2">
                                                            {chartData.length > 3 ? "분산 투자가 잘 이루어져 있습니다." : "특정 자산 집중도가 높습니다."} 안정성을 위해 채권형 자산 비중 확대를 추천합니다.
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Row 3: News (3 cols) & Secondary Insight (1 col) */}
                                    <div className="lg:col-span-3 h-[240px]">
                                        <div className="w-full h-full rounded-2xl border border-border/40 overflow-hidden bg-white/30 dark:bg-zinc-900/20">
                                            <PersonalizedNewsCarousel keywords={assetKeywords} />
                                        </div>
                                    </div>
                                    <div className="lg:col-span-1 h-[240px]">
                                        <Card className="h-full border-2 border-emerald-500/20 shadow-none bg-emerald-50/10 dark:bg-emerald-950/5 flex flex-col justify-center items-center text-center p-6 space-y-4">
                                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600">
                                                <TrendingUp className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-foreground mb-1 uppercase tracking-tighter">Market Health</h4>
                                                <p className="text-[10px] text-muted-foreground font-bold">포트폴리오가 시장 수익률을 상회하고 있습니다.</p>
                                            </div>
                                            <Badge className="bg-emerald-500 text-white font-black">GOOD</Badge>
                                        </Card>
                                    </div>
                                </div>

                                {/* Divider or Toggle Label */}
                                <div className="flex items-center gap-4 py-4">
                                    <div className="h-[1px] flex-1 bg-border/50" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <LayoutGrid className="h-3 w-3" />
                                        Custom Canvas Widgets
                                    </span>
                                    <div className="h-[1px] flex-1 bg-border/50" />
                                </div>

                                {/* 2. Bottom Dynamic Grid (Canvas) */}
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                                                className="md:col-span-2 lg:col-span-3 xl:col-span-2 h-[380px] relative group"
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
                                                className="md:col-span-1 h-[380px] relative group"
                                            >
                                                {renderWidgetControls('idea')}
                                                <Card className={`h-full border-2 border-primary/20 shadow-none bg-white dark:bg-zinc-900 group transition-all duration-300 ${isEditMode ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background' : ''}`}>
                                                    <CardHeader className="pb-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                                                                    <Lightbulb className="h-4 w-4" />
                                                                </div>
                                                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">인사이트 추천</CardTitle>
                                                            </div>
                                                            <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-6">
                                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                                                <h4 className="text-xs font-black text-foreground mb-1 leading-tight">배당 수익 최적화</h4>
                                                                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">보유하신 기술주 비중을 줄이고 고배당 ETF로 갈아타시면 연 4%의 추가 현금 흐름을 기대할 수 있습니다.</p>
                                                            </div>
                                                            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                                                                <h4 className="text-xs font-black text-primary mb-1 leading-tight">신규 투자 아이디어</h4>
                                                                <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">최근 원자재 가격 하락에 따른 금(Gold) 자산 분할 매수를 추천드립니다.</p>
                                                            </div>
                                                            <Button className="w-full text-[10px] font-black uppercase tracking-widest h-10">아이디어 실행하기</Button>
                                                        </div>
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
                                                className="md:col-span-1 h-[380px] relative group"
                                            >
                                                {renderWidgetControls('risk')}
                                                <Card className={`h-full border-border shadow-none bg-card transition-all duration-300 ${isEditMode ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background' : ''}`}>
                                                    <CardHeader className="pb-4">
                                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                            <ShieldAlert className="h-3 w-3" />
                                                            리스크 점수
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="flex flex-col items-center justify-center pt-4">
                                                        <div className="relative flex items-center justify-center w-32 h-32 mb-6">
                                                            <svg className="w-full h-full transform -rotate-90">
                                                                <circle className="text-muted/20" strokeWidth="8" stroke="currentColor" fill="transparent" r="54" cx="64" cy="64" />
                                                                <circle className="text-emerald-500 transition-all duration-1000" strokeWidth="8" strokeDasharray={54 * 2 * Math.PI} strokeDashoffset={54 * 2 * Math.PI * (1 - 0.72)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="54" cx="64" cy="64" />
                                                            </svg>
                                                            <div className="absolute flex flex-col items-center">
                                                                <span className="text-3xl font-black">72</span>
                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Stable</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full space-y-3 px-2">
                                                            <div className="flex justify-between text-[10px] font-bold">
                                                                <span className="text-muted-foreground uppercase">Volatility</span>
                                                                <span className="text-emerald-500">Low</span>
                                                            </div>
                                                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500 w-[30%]" />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
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
                                                className="md:col-span-1 h-[380px] relative group"
                                            >
                                                {renderWidgetControls('sector')}
                                                <Card className={`h-full border-border shadow-none bg-card transition-all duration-300 ${isEditMode ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background' : ''}`}>
                                                    <CardHeader className="pb-4">
                                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                            <Activity className="h-3 w-3" />
                                                            섹터 분포
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="pt-2">
                                                        <div className="space-y-5">
                                                            {[
                                                                { name: '기술/IT', value: 45, color: 'bg-indigo-500' },
                                                                { name: '금융', value: 25, color: 'bg-emerald-500' },
                                                                { name: '소비재', value: 15, color: 'bg-amber-500' },
                                                                { name: '기타', value: 15, color: 'bg-zinc-400' },
                                                            ].map(sector => (
                                                                <div key={sector.name} className="space-y-1.5">
                                                                    <div className="flex justify-between items-center text-[11px] font-black uppercase">
                                                                        <span className="text-muted-foreground">{sector.name}</span>
                                                                        <span className="text-foreground">{sector.value}%</span>
                                                                    </div>
                                                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
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
