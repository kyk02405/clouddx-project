"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { useTheme } from "next-themes";

interface SparklineProps {
    data: number[];
    color?: string;
    isPositive?: boolean;
}

export default function Sparkline({ data, color, isPositive = true }: SparklineProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (!chartContainerRef.current) return;

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
                vertLine: { visible: false },
                horzLine: { visible: false },
            },
        });

        const seriesColor = color
            ? color
            : isPositive
                ? "#22c55e" // green-500
                : "#ef4444"; // red-500

        const lineSeries = chart.addLineSeries({
            color: seriesColor,
            lineWidth: 2,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
        });

        const chartData = data.map((value, index) => ({
            time: index as any, // Using index as mock time for sparkline
            value: value,
        }));

        lineSeries.setData(chartData);
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
    }, [data, color, isPositive, theme]);

    return <div ref={chartContainerRef} className="w-full h-[60px]" />;
}
