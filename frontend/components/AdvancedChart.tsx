"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts";
import { useTheme } from "next-themes";
import { LineChart, BarChart3 } from "lucide-react";
import { Asset } from "@/lib/mock-data";

const exchangeRates = {
    USD: 1450,
    JPY: 9.5,
    CNY: 200,
    EUR: 1550,
};

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
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                borderVisible: false,
                timeVisible: ['1분', '5분', '1시간'].includes(timeframe),
                secondsVisible: false,
                tickMarkFormatter: (() => {
                    let prevYear: number | null = null;
                    let prevMonth: number | null = null;

                    return (time: any) => {
                        const isIntraday = ['1분', '5분', '1시간'].includes(timeframe);

                        if (isIntraday) {
                            // 분/시간봉: "HH:MM" 형식
                            const date = new Date(time * 1000);
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            return `${hours}:${minutes}`;
                        } else if (timeframe === '1년') {
                            // 1년봉: "YYYY" 형식만 표시
                            if (typeof time === 'string') {
                                const parts = time.split('-');
                                if (parts.length === 3) {
                                    return parts[0];
                                }
                            }
                            return time;
                        } else {
                            // 일/주/월봉: 토스증권 스타일 (연도 변경 → "YYYY", 월 변경 → "M월", 일반 → "D일")
                            if (typeof time === 'string') {
                                const parts = time.split('-');
                                if (parts.length === 3) {
                                    const year = parseInt(parts[0]);
                                    const month = parseInt(parts[1]);
                                    const day = parseInt(parts[2]);

                                    // 연도가 바뀌면 연도 표시 (시각적 강조)
                                    if (prevYear !== null && year !== prevYear) {
                                        prevYear = year;
                                        prevMonth = month;
                                        return `━ ${year} ━`;
                                    }

                                    // 월이 바뀌면 월 표시
                                    if (prevMonth !== null && month !== prevMonth) {
                                        prevYear = year;
                                        prevMonth = month;
                                        return `${month}월`;
                                    }

                                    // 일반적으로는 일만 표시
                                    prevYear = year;
                                    prevMonth = month;
                                    return `${day}일`;
                                }
                            }
                            return time;
                        }
                    };
                })(),
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
        let isMounted = true;

        async function fetchHistory() {
            if (!chartRef.current || !isMounted) return;

            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const isCrypto = selectedAsset.type === "코인";
            const marketType = isCrypto ? "crypto" : "stock";

            // 코인일 경우 KRW- 접두사 추가
            const symbol = isCrypto ? `KRW-${selectedAsset.symbol}` : selectedAsset.symbol;

            let tf = "D";
            if (timeframe === "1분") tf = "1";
            else if (timeframe === "5분") tf = "5";
            else if (timeframe === "1시간") tf = "60";
            else if (timeframe === "1일") tf = "D";
            else if (timeframe === "1주일") tf = "W";
            else if (timeframe === "1달") tf = "M";
            else if (timeframe === "1년") tf = "Y";

            try {
                const response = await fetch(`${API_URL}/api/v1/market/history/${marketType}/${symbol}?timeframe=${tf}&count=200`);
                if (!isMounted) return;
                const result = await response.json();
                if (!isMounted || !chartRef.current) return;

                if (result.history && result.history.length > 0) {
                    const isIntraday = ["1", "5", "60"].includes(tf);

                    const formattedData = result.history.map((d: any) => {
                        let time: any = d.date;

                        if (isIntraday) {
                            // 분/시간봉: Unix timestamp(초)로 변환 — lightweight-charts가 시간 표시
                            const ts = new Date(d.date).getTime() / 1000;
                            time = isNaN(ts) ? d.date : ts;
                        } else {
                            // 일/주/월봉: "YYYY-MM-DD" 문자열
                            if (typeof d.date === "string" && d.date.includes("T")) {
                                time = d.date.split("T")[0];
                            }
                        }

                        // Determine Rate (코인은 이미 KRW 단위이므로 변환 불필요)
                        let rate = 1;
                        if (selectedAsset.type === '코인') rate = 1; // Upbit은 이미 KRW
                        else if (selectedAsset.country === '🇺🇸') rate = exchangeRates["USD"] || 1450;
                        else if (selectedAsset.country === '🇯🇵') rate = exchangeRates["JPY"] || 9.5;
                        else if (selectedAsset.country === '🇨🇳') rate = exchangeRates["CNY"] || 200;
                        else if (selectedAsset.country === '🇪🇺') rate = exchangeRates["EUR"] || 1550;

                        return {
                            time: time,
                            open: d.open * rate,
                            high: d.high * rate,
                            low: d.low * rate,
                            close: d.close * rate,
                        };
                    });

                    if (chartType === "area" && areaSeriesRef.current) {
                        areaSeriesRef.current.setData(formattedData.map((d: any) => ({ time: d.time, value: d.close })));
                    } else if (chartType === "candle" && candleSeriesRef.current) {
                        candleSeriesRef.current.setData(formattedData);
                    }
                    if (chartRef.current) {
                        chartRef.current.timeScale().fitContent();
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Failed to fetch historical data:", error);
                }
            }
        }

        fetchHistory();

        return () => {
            isMounted = false;
        };
    }, [selectedAsset, timeframe, chartType]);

    const timeframes = ['1분', '5분', '1시간', '1일', '1주일', '1달', '1년'];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black transition-colors duration-300">
            {/* Chart Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 mr-2 md:mr-4 shrink-0 w-auto md:w-[180px]">
                    <span className="font-black text-zinc-900 dark:text-white text-sm md:text-lg whitespace-nowrap tracking-tighter">
                        {selectedAsset.symbol}
                    </span>
                    <span className={`text-[9px] md:text-xs font-mono px-1.5 py-0.5 rounded ${selectedAsset.isPositive ? 'bg-emerald-50 dark:bg-zinc-800 text-emerald-600' : 'bg-blue-50 dark:bg-zinc-800 text-blue-600'}`}>
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
