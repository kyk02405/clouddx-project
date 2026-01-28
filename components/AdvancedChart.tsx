"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts";
import { useTheme } from "next-themes";
import { LineChart, BarChart3 } from "lucide-react";
import { Asset } from "@/lib/mock-data";

function generateChartData(initialPrice: number, timeframe: string) {
    const data = [];

    // The 'Timeframe' label now directly defines the interval (Step) of each candle
    let step = 60; // 1 minute default
    if (timeframe === '1분') step = 60;
    else if (timeframe === '5분') step = 300;
    else if (timeframe === '1시간') step = 3600;
    else if (timeframe === '1일') step = 86400;
    else if (timeframe === '1주일') step = 86400 * 7;
    else if (timeframe === '1달') step = 86400 * 30;
    else if (timeframe === '1년') step = 86400 * 365;

    // We show a fixed number of bars (e.g., 200) so the user can see history at that interval
    const count = 200;

    // Round current time to the nearest step to align axis labels precisely
    const now = Math.floor(Date.now() / 1000);
    const endTime = now - (now % step);
    const startTime = endTime - (count * step);

    let price = initialPrice;

    for (let i = 0; i <= count; i++) {
        const volatility = 0.003; // Slightly lower volatility for smoother look
        const open = price;
        const change = price * volatility * (Math.random() - 0.5);
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * (price * 0.001);
        const low = Math.min(open, close) - Math.random() * (price * 0.001);

        data.push({
            time: (startTime + i * step) as any,
            open,
            high,
            low,
            close,
        });
        price = close;
    }
    return data;
}

interface AdvancedChartProps {
    selectedAsset: Asset;
}

export default function AdvancedChart({ selectedAsset }: AdvancedChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const { theme } = useTheme();
    const [timeframe, setTimeframe] = useState("1일");
    const [chartType, setChartType] = useState<"area" | "candle">("area");

    // Initialize/Re-initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const isDark = theme === "dark";
        const bgColor = isDark ? "#000000" : "#ffffff";
        const textColor = isDark ? "#a1a1aa" : "#71717a";
        const gridColor = isDark ? "#18181b" : "#f4f4f5";

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: bgColor },
                textColor: textColor,
            },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: timeframe.includes('분'), // Show seconds for short periods
            },
            rightPriceScale: {
                borderVisible: false,
            },
        });

        chartRef.current = chart;

        const handleResize = () => {
            if (chartContainerRef.current && chart) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener("resize", handleResize);

        // Initial Data setup
        const isArea = chartType === "area";
        if (isArea) {
            areaSeriesRef.current = chart.addAreaSeries({
                lineColor: "#2563eb",
                topColor: isDark ? "rgba(37, 99, 235, 0.4)" : "rgba(37, 99, 235, 0.2)",
                bottomColor: "rgba(37, 99, 235, 0.0)",
                lineWidth: 2,
            });
            candleSeriesRef.current = null;
        } else {
            candleSeriesRef.current = chart.addCandlestickSeries({
                upColor: "#ef4444",
                downColor: "#2563eb",
                borderUpColor: "#ef4444",
                borderDownColor: "#2563eb",
                wickUpColor: "#ef4444",
                wickDownColor: "#2563eb",
            });
            areaSeriesRef.current = null;
        }

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, [theme, chartType, timeframe]); // Re-initialize when timeframe changes to update secondsVisible

    // Update Data only
    useEffect(() => {
        if (!chartRef.current) return;

        const basePrice = parseFloat(selectedAsset.price.replace(/,/g, ''));
        const rawData = generateChartData(basePrice, timeframe);

        if (chartType === "area" && areaSeriesRef.current) {
            areaSeriesRef.current.setData(rawData.map(d => ({ time: d.time, value: d.close })));
        } else if (chartType === "candle" && candleSeriesRef.current) {
            candleSeriesRef.current.setData(rawData);
        }

        chartRef.current.timeScale().fitContent();
    }, [selectedAsset, timeframe, chartType]);

    const timeframes = ['1분', '5분', '1시간', '1일', '1주일', '1달', '1년'];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black transition-colors duration-300">
            {/* Chart Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 mr-4 shrink-0 w-[180px]">
                    <span className="font-bold text-zinc-900 dark:text-white text-lg whitespace-nowrap">
                        {selectedAsset.symbol}/USD
                    </span>
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${selectedAsset.isPositive ? 'bg-emerald-50 dark:bg-zinc-800 text-emerald-600' : 'bg-blue-50 dark:bg-zinc-800 text-blue-600'}`}>
                        {selectedAsset.change}
                    </span>
                </div>

                <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-700 mx-2 shrink-0" />

                {/* Chart Type Toggle */}
                <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-0.5 shrink-0">
                    <button
                        onClick={() => setChartType("area")}
                        className={`p-1.5 rounded-md transition-all ${chartType === "area" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "hover:text-zinc-900 dark:hover:text-white text-zinc-400"}`}
                    >
                        <LineChart className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setChartType("candle")}
                        className={`p-1.5 rounded-md transition-all ${chartType === "candle" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "hover:text-zinc-900 dark:hover:text-white text-zinc-400"}`}
                    >
                        <BarChart3 className="h-4 w-4" />
                    </button>
                </div>

                <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-700 mx-2 shrink-0" />

                <div className="flex gap-1 font-semibold shrink-0">
                    {timeframes.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-2 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${timeframe === tf
                                ? "bg-emerald-500 text-white"
                                : "hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Chart Area */}
            <div ref={chartContainerRef} className="flex-1 w-full" />
        </div>
    );
}
