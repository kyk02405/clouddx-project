"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Star, TrendingUp, TrendingDown, Info } from "lucide-react";
import { useState } from "react";

import { useRef, useEffect } from "react";
import { Asset, allAssets, initialMyAssetSymbols, miniChartPath } from "@/lib/mock-data";
import { useFavorites } from "@/context/FavoritesContext";

interface ChartSidebarProps {
    onSelectAsset?: (asset: Asset) => void;
    currentAsset?: Asset | null;
}

export default function ChartSidebar({ onSelectAsset, currentAsset }: ChartSidebarProps) {
    const [mainTab, setMainTab] = useState("인기");
    const [categoryTab, setCategoryTab] = useState("주식");
    const { favorites, toggleFavorite } = useFavorites();

    // Resizing State
    const [detailsHeight, setDetailsHeight] = useState(50); // percentage
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !sidebarRef.current) return;
            const sidebarRect = sidebarRef.current.getBoundingClientRect();
            const relativeY = e.clientY - sidebarRect.top;
            const percentage = (relativeY / sidebarRect.height) * 100;
            // Limit between 20% and 80%
            const clampedPercentage = Math.min(Math.max(percentage, 20), 80);
            // Invert because details is at the bottom: 100 - clamped creates top list height, so details height is:
            setDetailsHeight(100 - clampedPercentage);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing]);

    const getBaseData = () => {
        switch (mainTab) {
            case "자산":
                return allAssets.filter(a => initialMyAssetSymbols.includes(a.symbol));
            case "관심":
                return allAssets.filter(a => favorites.includes(a.symbol));
            default: // 인기
                return allAssets;
        }
    };

    const filteredAssets = getBaseData().filter(asset => asset.type === categoryTab);

    return (
        <div ref={sidebarRef} className="w-80 border-l border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black flex flex-col h-full overflow-hidden select-none">
            {/* Main Tabs */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-900 shrink-0">
                {["인기", "자산", "관심"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setMainTab(tab);
                        }}
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
            <div className="flex gap-4 px-4 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 border-b border-zinc-50 dark:border-zinc-950 shrink-0">
                {["주식", "코인"].map((cat) => (
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

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {/* List Section */}
                <div
                    className="overflow-hidden flex flex-col"
                    style={{ height: currentAsset ? `${100 - detailsHeight}%` : '100%' }}
                >
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col">
                            {filteredAssets.length > 0 ? (
                                filteredAssets.map((asset) => (
                                    <button
                                        key={asset.symbol}
                                        onClick={() => onSelectAsset?.(asset)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group border-b border-zinc-50 dark:border-zinc-950/30 last:border-0",
                                            currentAsset?.symbol === asset.symbol && "bg-zinc-50 dark:bg-zinc-900"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] relative overflow-hidden border border-zinc-200 dark:border-zinc-700",
                                                asset.logoColor || "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                            )}>
                                                {asset.logo}
                                                <span className="absolute bottom-0 right-0 text-[8px] bg-white dark:bg-zinc-800 px-0.5 text-zinc-900 dark:text-zinc-200">{asset.country}</span>
                                            </div>
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{asset.name}</span>
                                                <span className="text-[10px] text-zinc-400 font-medium tracking-tight uppercase group-hover:text-zinc-500">{asset.symbol}</span>
                                            </div>
                                        </div>

                                        {/* Mini Sparkline */}
                                        <div className="flex-1 px-4 h-6 flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                            <svg width="50" height="15" viewBox="0 0 70 20" className={cn(
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
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                    <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                        <Info className="h-5 w-5 text-zinc-300" />
                                    </div>
                                    <p className="text-xs font-bold text-zinc-400">데이터가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Resize Handle */}
                {currentAsset && (
                    <div
                        onMouseDown={startResizing}
                        className="h-2 relative z-20 w-full cursor-row-resize flex items-center justify-center -mt-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group/resize"
                    >
                        {/* Visual thin line, highlights on hover */}
                        <div className="w-full h-[1px] bg-zinc-200 dark:bg-zinc-800 group-hover/resize:bg-zinc-400 dark:group-hover/resize:bg-zinc-600 transition-colors transform scale-y-100" />
                    </div>
                )}

                {/* Selected Asset Details Section */}
                {currentAsset && (
                    <div
                        className="overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/20"
                        style={{ height: `${detailsHeight}%` }}
                    >
                        <ScrollArea className="h-full">
                            <div className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 font-bold text-zinc-900 dark:text-white">
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-800 shadow-sm relative group/logo",
                                            currentAsset.logoColor || "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                        )}>
                                            <span className="text-xl">
                                                {currentAsset.logo}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-xl leading-tight uppercase font-black tracking-tight">{currentAsset.symbol}</div>
                                            <div className="text-xs text-zinc-500 font-bold">{currentAsset.name}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleFavorite(currentAsset.symbol)}
                                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors group/star"
                                    >
                                        <Star
                                            className={cn(
                                                "h-6 w-6 transition-all duration-300",
                                                favorites.includes(currentAsset.symbol)
                                                    ? "text-yellow-400 fill-yellow-400 scale-110"
                                                    : "text-zinc-300 dark:text-zinc-700 group-hover/star:text-zinc-400"
                                            )}
                                        />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white">
                                        {currentAsset.type === "코인" ? "$" : ""}{currentAsset.price}
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-2 text-base font-black",
                                        currentAsset.isPositive ? "text-emerald-500" : "text-blue-500"
                                    )}>
                                        <span>{currentAsset.change}</span>
                                        <span className="text-zinc-400 font-bold text-sm">전일 대비</span>
                                    </div>
                                    <div className="text-[11px] text-rose-500 font-black pt-1">폐장 <span className="text-zinc-400 font-bold">프리장 개장까지 51분</span></div>
                                </div>

                                {/* Statistics Grid */}
                                <div className="pt-2 space-y-4">
                                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-900 pb-2">통계</div>
                                    <div className="grid grid-cols-3 gap-x-2 gap-y-6 text-[11px]">
                                        {[
                                            { label: "시가", value: currentAsset.stats?.open },
                                            { label: "고가", value: currentAsset.stats?.high, color: "text-rose-500" },
                                            { label: "저가", value: currentAsset.stats?.low, color: "text-blue-500" },
                                            { label: "52주 최고", value: currentAsset.stats?.high52W },
                                            { label: "52주 최저", value: currentAsset.stats?.low52W },
                                            { label: "거래량", value: currentAsset.stats?.volume },
                                            { label: "시가총액", value: currentAsset.stats?.marketCap },
                                            { label: "PER", value: currentAsset.stats?.peRatio },
                                            { label: "배당수익률", value: currentAsset.stats?.dividendYield },
                                        ].map((stat) => (
                                            <div key={stat.label} className="space-y-1">
                                                <div className="text-zinc-400 font-bold text-[10px]">{stat.label}</div>
                                                <div className={cn(
                                                    "font-black text-zinc-900 dark:text-zinc-100",
                                                    stat.color
                                                )}>{stat.value || "-"}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900">
                                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center justify-between">
                                        배당
                                        <Info className="h-3 w-3" />
                                    </div>
                                    {currentAsset.stats?.dividendYield ? (
                                        <div className="mt-2 text-sm font-bold text-emerald-500">
                                            연 {currentAsset.stats.dividendYield}
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-xs text-zinc-400">
                                            배당 정보가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
        </div>
    );
}
