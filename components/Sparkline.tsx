"use client";

import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

interface LightweightSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export default function LightweightSparkline({
  data,
  width = 100,
  height = 40,
  className = "",
}: LightweightSparklineProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length < 2) return;

    // Determine trend color
    const isPositive = data[data.length - 1] >= data[0];
    const lineColor = isPositive ? "#22c55e" : "#ef4444";
    const topColor = isPositive ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)";
    const bottomColor = isPositive ? "rgba(34, 197, 94, 0)" : "rgba(239, 68, 68, 0)";

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#6b7280",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        visible: false,
        borderVisible: false,
      },
      rightPriceScale: {
        visible: false,
      },
      handleScroll: false,
      handleScale: false,
    });

    // Use addAreaSeries for v4 compatibility
    const series = chart.addAreaSeries({
      lineColor,
      topColor,
      bottomColor,
      lineWidth: 1.5,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Convert data to TradingView format
    const chartData = data.map((value, index) => ({
      time: index as any,
      value,
    }));

    series.setData(chartData);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [data, width, height]);

  if (data.length < 2) {
    return <div className={className} style={{ width, height }} />;
  }

  return <div ref={chartContainerRef} className={className} />;
}
