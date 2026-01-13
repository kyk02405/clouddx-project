'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';

interface PriceChartProps {
  prices: number[];
  isUp: boolean;
}

export default function PriceChart({ prices, isUp }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || prices.length === 0) return;

    // 차트 생성
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#1a1d23' },
        textColor: '#a0a0a0',
      },
      grid: {
        vertLines: { color: '#2d3139' },
        horzLines: { color: '#2d3139' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 320,
      timeScale: {
        borderColor: '#2d3139',
      },
      rightPriceScale: {
        borderColor: '#2d3139',
      },
    });

    chartRef.current = chart;

    // Area Series 추가
    const areaSeries = chart.addAreaSeries({
      topColor: isUp ? 'rgba(0, 184, 148, 0.4)' : 'rgba(214, 48, 49, 0.4)',
      bottomColor: isUp
        ? 'rgba(0, 184, 148, 0.0)'
        : 'rgba(214, 48, 49, 0.0)',
      lineColor: isUp ? '#00b894' : '#d63031',
      lineWidth: 2,
    });

    seriesRef.current = areaSeries;

    // 데이터 변환 (7일간 시간 분산)
    const now = Math.floor(Date.now() / 1000);
    const interval = (7 * 24 * 60 * 60) / prices.length; // 7일을 데이터 포인트로 나눔

    const chartData = prices.map((price, index) => ({
      time: (now - (prices.length - index) * interval) as any,
      value: price,
    }));

    areaSeries.setData(chartData);

    // Fit content
    chart.timeScale().fitContent();

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [prices, isUp]);

  return <div ref={chartContainerRef} className="h-full w-full" />;
}
