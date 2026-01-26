"use client";

import React, { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi } from "lightweight-charts";
import { useTheme } from "next-themes";

function generateData(count: number, initialPrice: number) {
    const data = [];
    let time = Math.floor(Date.now() / 1000) - count * 86400;
    let price = initialPrice;

    for (let i = 0; i < count; i++) {
        const volatility = 0.02;
        const change = price * volatility * (Math.random() - 0.5);
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * price * 0.01;
        const low = Math.min(open, close) - Math.random() * price * 0.01;

        data.push({
            time: time as any,
            open,
            high,
            low,
            close,
        });

        price = close;
        time += 86400;
    }
    return data;
}

export default function AdvancedChart() {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const { theme } = useTheme();

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
            },
            rightPriceScale: {
                borderVisible: false,
            },
        });

        chartRef.current = chart;

        const areaSeries = chart.addAreaSeries({
            lineColor: "#2563eb",
            topColor: isDark ? "rgba(37, 99, 235, 0.4)" : "rgba(37, 99, 235, 0.2)",
            bottomColor: "rgba(37, 99, 235, 0.0)",
            lineWidth: 2,
        });

        const data = generateData(300, 42000).map(d => ({
            time: d.time,
            value: d.close,
        }));
        areaSeries.setData(data);

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, [theme]); // Re-run on theme change

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black transition-colors duration-300">
            {/* Chart Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2 mr-4">
                    <span className="font-bold text-zinc-900 dark:text-white text-lg">BTC/USD</span>
                    <span className="text-xs font-mono bg-emerald-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-500">+5.21%</span>
                </div>
                <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-700 mx-2" />
                <div className="flex gap-1 font-semibold">
                    {['1m', '5m', '1h', '4h', '1D', '1W'].map((tf) => (
                        <button key={tf} className="px-2 py-1 text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors">
                            {tf}
                        </button>
                    ))}
                    <button className="px-2 py-1 text-[11px] bg-blue-600 text-white rounded">
                        1D
                    </button>
                </div>
                <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-700 mx-2" />
                <button className="px-2 py-1 text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors font-semibold">
                    지표 (Indicators)
                </button>
            </div>

            {/* Main Chart Area */}
            <div ref={chartContainerRef} className="flex-1 w-full" />
        </div>
    );
}
