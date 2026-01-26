"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Star, TrendingUp, TrendingDown, Info } from "lucide-react";
import { useState } from "react";

interface Asset {
    symbol: string;
    name: string;
    price: string;
    change: string;
    isPositive: boolean;
    country?: string;
}

const watchList: Asset[] = [
    { symbol: "005930", name: "삼성전자", price: "152,100", change: "0.00%", isPositive: true, country: "🇰🇷" },
    { symbol: "TSLA", name: "테슬라", price: "449.06", change: "-0.07%", isPositive: false, country: "🇺🇸" },
    { symbol: "AAPL", name: "애플", price: "248.04", change: "-0.12%", isPositive: false, country: "🇺🇸" },
    { symbol: "NVDA", name: "엔비디아", price: "187.67", change: "+1.53%", isPositive: true, country: "🇺🇸" },
    { symbol: "360750", name: "TIGER 미국S&P500", price: "24,750", change: "-1.96%", isPositive: false, country: "🇰🇷" },
    { symbol: "SCHD", name: "Schwab 미국 배당", price: "29.14", change: "-0.10%", isPositive: false, country: "🇺🇸" },
    { symbol: "TQQQ", name: "나스닥100 3배", price: "54.38", change: "+0.89%", isPositive: true, country: "🇺🇸" },
];

const miniChartPath = "M0 15 L10 12 L20 18 L30 10 L40 14 L50 8 L60 12 L70 5";

export default function ChartSidebar() {
    const [mainTab, setMainTab] = useState("인기");
    const [categoryTab, setCategoryTab] = useState("주식");

    return (
        <div className="w-80 border-l border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black flex flex-col h-full overflow-hidden">
            {/* Main Tabs */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-900">
                {["인기", "자산", "관심"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setMainTab(tab)}
                        className={cn(
                            "flex-1 py-3 text-sm font-semibold transition-colors relative",
                            mainTab === tab
                                ? "text-zinc-900 dark:text-white"
                                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        )}
                    >
                        {tab}
                        {mainTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white mx-4" />
                        )}
                    </button>
                ))}
            </div>

            {/* Category Sub-tabs */}
            <div className="flex gap-4 px-4 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 border-b border-zinc-50 dark:border-zinc-950">
                {["주식", "코인", "지수", "펀드", "부동산"].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategoryTab(cat)}
                        className={cn(
                            "transition-colors",
                            categoryTab === cat ? "text-zinc-900 dark:text-white" : "hover:text-zinc-800 dark:hover:text-zinc-200"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col">
                    {watchList.map((asset) => (
                        <button
                            key={asset.symbol}
                            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group border-b border-zinc-50 dark:border-zinc-950/50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] relative overflow-hidden text-zinc-900 dark:text-white">
                                    {asset.symbol.slice(0, 2)}
                                    <span className="absolute bottom-0 right-0 text-[8px]">{asset.country}</span>
                                </div>
                                <div className="flex flex-col items-start gap-0.5">
                                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{asset.name}</span>
                                    <span className="text-[10px] text-zinc-400 font-medium tracking-tight uppercase group-hover:text-zinc-500">{asset.symbol}</span>
                                </div>
                            </div>

                            {/* Mini Sparkline */}
                            <div className="flex-1 px-4 h-6 flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                <svg width="60" height="20" viewBox="0 0 70 20" className={cn(
                                    "fill-none stroke-2",
                                    asset.isPositive ? "stroke-emerald-500" : "stroke-blue-500"
                                )}>
                                    <path d={miniChartPath} strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            <div className="flex flex-col items-end">
                                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                    {asset.price}
                                </div>
                                <div className={cn(
                                    "text-[10px] font-bold",
                                    asset.isPositive ? "text-emerald-500" : "text-blue-500"
                                )}>
                                    {asset.change}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Selected Asset Details Section */}
                <div className="p-4 mt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 font-bold">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-black">
                                <span className="text-sm">🍎</span>
                            </div>
                            <div>
                                <div className="text-lg">AAPL</div>
                                <div className="text-xs text-zinc-500">애플</div>
                            </div>
                        </div>
                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    </div>

                    <div className="space-y-1">
                        <div className="text-4xl font-extrabold tracking-tight">$248.04</div>
                        <div className="flex items-center gap-2 text-sm font-bold text-blue-500">
                            <span>-$0.31 (-0.12%)</span>
                            <span className="text-zinc-400 font-normal">전일 대비</span>
                        </div>
                        <div className="text-[10px] text-rose-500 font-bold">폐장 <span className="text-zinc-400 font-medium">프리장 개장까지 51분</span></div>
                    </div>

                    {/* Statistics Grid */}
                    <div className="pt-4 space-y-4 shadow-sm rounded-xl">
                        <div className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">통계</div>
                        <div className="grid grid-cols-3 gap-y-4 text-[11px]">
                            <div className="space-y-1">
                                <div className="text-zinc-400 font-bold">전일종가</div>
                                <div className="font-extrabold text-zinc-800 dark:text-zinc-200">$248.35</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-zinc-400 font-bold">개장가</div>
                                <div className="font-extrabold text-zinc-800 dark:text-zinc-200">$247.32</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-zinc-400 font-bold">거래량</div>
                                <div className="font-extrabold text-zinc-800 dark:text-zinc-200">41.6M</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-zinc-400 font-bold">최고가</div>
                                <div className="font-bold text-rose-500">$249.41</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-zinc-400 font-bold">52주 최고</div>
                                <div className="font-extrabold text-zinc-800 dark:text-zinc-200">$288.62</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-zinc-400 font-bold">PER</div>
                                <div className="font-extrabold text-zinc-800 dark:text-zinc-200">33.25</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-zinc-400 font-bold">최저가</div>
                                <div className="font-bold text-blue-500">$244.68</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-zinc-400 font-bold">52주 최저</div>
                                <div className="font-extrabold text-zinc-800 dark:text-zinc-200">$169.21</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-zinc-400 font-bold">시가총액</div>
                                <div className="font-extrabold text-zinc-800 dark:text-zinc-200">$3.6T</div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 text-xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center justify-between">
                        배당
                        <Info className="h-3 w-3" />
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
