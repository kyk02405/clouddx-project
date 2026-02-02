"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { useTheme } from "next-themes";

interface SparklineProps {
    data: { value: number; date: string }[];
    color?: string;
    isPositive?: boolean;
    currency?: string;
    width?: number;
    height?: number;
}

export default function Sparkline({ data, color, isPositive = true, currency }: SparklineProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (!chartContainerRef.current || !tooltipRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 60,
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "transparent",
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            rightPriceScale: {
                visible: false,
            },
            timeScale: {
                visible: false,
            },
            handleScale: false,
            handleScroll: false,
            crosshair: {
                vertLine: { visible: true, style: 0, width: 1, color: "rgba(156, 163, 175, 0.5)", labelVisible: false },
                horzLine: { visible: false, labelVisible: false },
            },
        });

        const seriesColor = color
            ? color
            : isPositive
                ? "#ef4444" // red-500 (Upp)
                : "#3b82f6"; // blue-500 (Down)

        const lineSeries = chart.addLineSeries({
            color: seriesColor,
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
            crosshairMarkerBorderColor: seriesColor,
            crosshairMarkerBackgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
            priceLineVisible: false,
        });

        const chartData = data.map((item) => ({
            // Ensure date is in YYYY-MM-DD format for daily sparklines
            time: item.date.includes('T') ? item.date.split('T')[0] : item.date,
            value: item.value,
        }));

        lineSeries.setData(chartData as any);
        chart.timeScale().fitContent();

        // Tooltip Logic
        const tooltip = tooltipRef.current;

        chart.subscribeCrosshairMove((param) => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartContainerRef.current!.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartContainerRef.current!.clientHeight
            ) {
                tooltip.style.display = 'none';
                return;
            }

            tooltip.style.display = 'block';
            const data = param.seriesData.get(lineSeries) as { value: number; time: string } | undefined;
            if (!data) return;

            const price = data.value.toLocaleString();
            const date = data.time as string;
            const priceText = currency ? `${currency}${price}` : price;

            tooltip.innerHTML = `
                <div class="text-right">
                    <div class="text-lg font-bold text-white">${priceText}</div>
                    <div class="text-xs text-gray-400">${date}</div>
                </div>
            `;

            // Position tooltip
            const coordinate = lineSeries.priceToCoordinate(data.value);
            let left = param.point.x as number;
            const top = (coordinate !== null ? coordinate : 0) as number;

            // Prevent tooltip from going off-screen
            const tooltipWidth = 100; // Expected width
            if (left + tooltipWidth > chartContainerRef.current!.clientWidth) {
                left = chartContainerRef.current!.clientWidth - tooltipWidth;
            }
            if (left < 0) left = 0;

            tooltip.style.left = left + 'px';
            tooltip.style.top = Math.max(0, top - 60) + 'px'; // Show above the point
        });

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
    }, [data, color, isPositive, theme, currency]);

    return (
        <div className="relative w-full h-[60px]">
            <div ref={chartContainerRef} className="w-full h-full" />
            <div
                ref={tooltipRef}
                className="pointer-events-none absolute z-10 hidden rounded-md bg-zinc-900/90 p-2 shadow-xl backdrop-blur-sm"
                style={{
                    width: '100px',
                    left: 0,
                    top: 0,
                }}
            />
        </div>
    );
}
