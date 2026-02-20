"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    createChart,
    ColorType,
    IChartApi,
    ISeriesApi,
    type AreaData,
    type CandlestickData,
    type Time,
    type UTCTimestamp,
} from "lightweight-charts";
import { useTheme } from "next-themes";
import { LineChart, BarChart3 } from "lucide-react";
import { Asset } from "@/lib/mock-data";

const exchangeRates = {
    USD: 1450,
    JPY: 9.5,
    CNY: 200,
    EUR: 1550,
};

const TF = {
    MIN_1: "1분",
    MIN_5: "5분",
    HOUR_1: "1시간",
    DAY_1: "일",
    WEEK_1: "주",
    MONTH_1: "월",
    YEAR_1: "년",
} as const;

const INTRADAY_TIMEFRAMES = new Set<string>([TF.MIN_1, TF.MIN_5, TF.HOUR_1]);
const WS_RECONNECT_MS = 2000;
const HISTORY_LIMIT = 200;
const WS_PUSH_INTERVAL_MS = 5000;

type CandlePoint = {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
};

function isIntraday(tf: string): boolean {
    return INTRADAY_TIMEFRAMES.has(tf);
}

function normalizeSymbol(raw: any): string {
    return String(raw || "").replace("KRW-", "").trim().toUpperCase();
}

function intradayBucketSeconds(tf: string): number {
    if (tf === TF.MIN_1) return 60;
    if (tf === TF.MIN_5) return 300;
    if (tf === TF.HOUR_1) return 3600;
    return 0;
}

function toBackendTimeframe(tf: string): string {
    if (tf === TF.MIN_1) return "1";
    if (tf === TF.MIN_5) return "5";
    if (tf === TF.HOUR_1) return "60";
    if (tf === TF.DAY_1) return "D";
    if (tf === TF.WEEK_1) return "W";
    if (tf === TF.MONTH_1) return "M";
    if (tf === TF.YEAR_1) return "Y";
    return "D";
}

function pad2(n: number): string {
    return n.toString().padStart(2, "0");
}

function parseChartTime(time: any): Date | null {
    if (typeof time === "number") {
        return new Date(time * 1000);
    }

    if (typeof time === "string") {
        const d = new Date(time);
        if (!Number.isNaN(d.getTime())) return d;
        return null;
    }

    if (time && typeof time === "object" && "year" in time && "month" in time && "day" in time) {
        const y = Number((time as any).year);
        const m = Number((time as any).month);
        const d = Number((time as any).day);
        return new Date(Date.UTC(y, m - 1, d));
    }

    return null;
}

function normalizeHistoryTime(raw: any, isIntradayTimeframe: boolean): Time {
    const parsed = parseChartTime(raw);

    if (isIntradayTimeframe) {
        if (parsed) return Math.floor(parsed.getTime() / 1000) as UTCTimestamp;
        if (typeof raw === "number") return raw as UTCTimestamp;
        return Math.floor(Date.now() / 1000) as UTCTimestamp;
    }

    if (typeof raw === "string" && raw.includes("T")) {
        return raw.split("T")[0] as Time;
    }
    if (parsed) {
        return `${parsed.getUTCFullYear()}-${pad2(parsed.getUTCMonth() + 1)}-${pad2(parsed.getUTCDate())}` as Time;
    }
    return String(raw || "") as Time;
}

function resolveFxRate(asset: Asset): number {
    if (asset.type === "코인") return 1;

    const country = String(asset.country || "").trim();
    if (["🇺🇸", "US", "USA", "미국"].includes(country)) return exchangeRates.USD;
    if (["🇯🇵", "JP", "JPN", "일본"].includes(country)) return exchangeRates.JPY;
    if (["🇨🇳", "CN", "CHN", "중국"].includes(country)) return exchangeRates.CNY;
    if (["🇪🇺", "EU", "EUR", "유럽"].includes(country)) return exchangeRates.EUR;
    return 1;
}

function buildWsBaseUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
        const parsed = new URL(apiUrl);
        const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
        return `${protocol}//${parsed.host}`;
    } catch {
        if (typeof window !== "undefined") {
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            return `${protocol}//${window.location.host}`;
        }
        return "ws://localhost:8000";
    }
}

function formatTimeAxisLabel(time: any, timeframe: string): string {
    const d = parseChartTime(time);
    if (!d) return "";

    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const hour = d.getUTCHours();
    const minute = d.getUTCMinutes();

    if (isIntraday(timeframe)) {
        return `${pad2(hour)}:${pad2(minute)}`;
    }
    if (timeframe === TF.DAY_1 || timeframe === TF.WEEK_1) {
        return `${month}/${day}`;
    }
    if (timeframe === TF.MONTH_1) {
        return `${year}.${pad2(month)}`;
    }
    if (timeframe === TF.YEAR_1) {
        return `${year}`;
    }
    return `${year}.${pad2(month)}.${pad2(day)}`;
}

function formatCrosshairTimeLabel(time: any, timeframe: string): string {
    const d = parseChartTime(time);
    if (!d) return "";

    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const hour = d.getUTCHours();
    const minute = d.getUTCMinutes();

    if (isIntraday(timeframe)) {
        return `${year}.${pad2(month)}.${pad2(day)} ${pad2(hour)}:${pad2(minute)}`;
    }
    if (timeframe === TF.MONTH_1) {
        return `${year}.${pad2(month)}`;
    }
    if (timeframe === TF.YEAR_1) {
        return `${year}년`;
    }
    return `${year}.${pad2(month)}.${pad2(day)}`;
}

interface AdvancedChartProps {
    selectedAsset: Asset;
}

export default function AdvancedChart({ selectedAsset }: AdvancedChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const historyRef = useRef<CandlePoint[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { theme } = useTheme();
    const [timeframe, setTimeframe] = useState<string>(TF.DAY_1);
    const [chartType, setChartType] = useState<"area" | "candle">("area");
    const [noDataMessage, setNoDataMessage] = useState<string | null>(null);
    const isIntradayTimeframe = isIntraday(timeframe);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const isDark = theme === "dark";
        const bgColor = isDark ? "#000000" : "#ffffff";
        const textColor = isDark ? "#a1a1aa" : "#71717a";
        const gridColor = isDark ? "#18181b" : "#f4f4f5";

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: bgColor },
                textColor,
                attributionLogo: false,
            },
            localization: {
                locale: "ko-KR",
                timeFormatter: (time: any) => formatCrosshairTimeLabel(time, timeframe),
            },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                borderVisible: false,
                timeVisible: isIntradayTimeframe,
                secondsVisible: timeframe === TF.MIN_1,
                tickMarkFormatter: (time: any) => formatTimeAxisLabel(time, timeframe),
            },
            rightPriceScale: {
                borderVisible: false,
            },
        });

        chartRef.current = chart;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener("resize", handleResize);

        if (chartType === "area") {
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
            chartRef.current = null;
            areaSeriesRef.current = null;
            candleSeriesRef.current = null;
        };
    }, [theme, chartType, timeframe, isIntradayTimeframe]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        async function fetchHistory() {
            if (!chartRef.current || !isMounted) return;
            historyRef.current = [];
            setNoDataMessage(null);

            const isCrypto = selectedAsset.type === "코인";
            const marketType = isCrypto ? "crypto" : "stock";
            const symbol = isCrypto ? `KRW-${selectedAsset.symbol}` : selectedAsset.symbol;
            const tf = toBackendTimeframe(timeframe);
            const rate = resolveFxRate(selectedAsset);

            try {
                const historyUrl = `/api/proxy/api/v1/market/history/${marketType}/${symbol}?timeframe=${tf}&count=200`;
                const response = await fetch(historyUrl, { signal: controller.signal });
                if (!isMounted) return;
                if (!response.ok) throw new Error(`history fetch failed: ${response.status}`);

                const result = await response.json();
                if (!isMounted || !chartRef.current) return;

                if (result.history && result.history.length > 0) {
                    setNoDataMessage(null);
                    const isIntradayTf = ["1", "5", "60"].includes(tf);
                    const formattedData: CandlePoint[] = result.history.map((d: any) => {
                        const time = normalizeHistoryTime(d.date, isIntradayTf);

                        const convertedRate = isCrypto ? 1 : rate;

                        return {
                            time,
                            open: Number(d.open || 0) * convertedRate,
                            high: Number(d.high || 0) * convertedRate,
                            low: Number(d.low || 0) * convertedRate,
                            close: Number(d.close || 0) * convertedRate,
                        };
                    });
                    historyRef.current = formattedData;

                    if (chartType === "area" && areaSeriesRef.current) {
                        const areaData: AreaData<Time>[] = formattedData.map((d) => ({ time: d.time, value: d.close }));
                        areaSeriesRef.current.setData(areaData);
                    } else if (chartType === "candle" && candleSeriesRef.current) {
                        candleSeriesRef.current.setData(formattedData as CandlestickData<Time>[]);
                    }

                    chartRef.current.timeScale().fitContent();
                } else {
                    historyRef.current = [];
                    setNoDataMessage(
                        typeof result.message === "string" && result.message.trim()
                            ? result.message
                            : (["1", "5", "60"].includes(tf)
                                ? "장시간 외/분봉 데이터 없음"
                                : "표시할 차트 데이터가 없습니다")
                    );
                    if (chartType === "area" && areaSeriesRef.current) {
                        areaSeriesRef.current.setData([]);
                    } else if (chartType === "candle" && candleSeriesRef.current) {
                        candleSeriesRef.current.setData([]);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Failed to fetch historical data:", error);
                    historyRef.current = [];
                    setNoDataMessage("차트 데이터를 가져오지 못했습니다");
                }
            }
        }

        fetchHistory();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [selectedAsset, timeframe, chartType]);

    useEffect(() => {
        if (!isIntraday(timeframe)) {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            return;
        }

        const symbol = normalizeSymbol(selectedAsset.symbol);
        if (!symbol) return;

        const tfStep = intradayBucketSeconds(timeframe);
        const wsBaseUrl = buildWsBaseUrl();
        let cancelled = false;

        const applyLivePrice = (rawPrice: number) => {
            if (!Number.isFinite(rawPrice) || rawPrice <= 0) return;
            if (!chartRef.current || historyRef.current.length === 0) return;

            const current = [...historyRef.current];
            const lastIndex = current.length - 1;
            const last = current[lastIndex];
            let next: CandlePoint = {
                ...last,
                high: Math.max(last.high, rawPrice),
                low: Math.min(last.low, rawPrice),
                close: rawPrice,
            };

            if (isIntraday(timeframe) && tfStep > 0 && typeof last.time === "number") {
                const nowSec = Math.floor(Date.now() / 1000);
                const bucketTime = Math.floor(nowSec / tfStep) * tfStep;
                if (bucketTime > last.time) {
                    next = {
                        time: bucketTime as UTCTimestamp,
                        open: last.close,
                        high: Math.max(last.close, rawPrice),
                        low: Math.min(last.close, rawPrice),
                        close: rawPrice,
                    };
                    current.push(next);
                    if (current.length > HISTORY_LIMIT) {
                        current.shift();
                        if (chartType === "area" && areaSeriesRef.current) {
                            const areaData: AreaData<Time>[] = current.map((row) => ({ time: row.time, value: row.close }));
                            areaSeriesRef.current.setData(areaData);
                        } else if (chartType === "candle" && candleSeriesRef.current) {
                            candleSeriesRef.current.setData(current as CandlestickData<Time>[]);
                        }
                        historyRef.current = current;
                        return;
                    }
                } else {
                    current[lastIndex] = next;
                }
            } else {
                current[lastIndex] = next;
            }

            historyRef.current = current;
            if (chartType === "area" && areaSeriesRef.current) {
                areaSeriesRef.current.update({ time: next.time, value: next.close });
            } else if (chartType === "candle" && candleSeriesRef.current) {
                candleSeriesRef.current.update(next);
            }
        };

        const connect = () => {
            if (cancelled || wsRef.current) return;
            const wsUrl = `${wsBaseUrl}/api/v1/market/ws?symbols=${encodeURIComponent(symbol)}&interval_ms=${WS_PUSH_INTERVAL_MS}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {};

            ws.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload?.type !== "prices" || !Array.isArray(payload?.items)) return;

                    const item = payload.items.find((entry: any) => {
                        const code = normalizeSymbol(entry?.symbol || entry?.code || entry?.ticker);
                        return code === symbol;
                    });
                    if (!item || item.error) return;

                    const price = Number(item.price || 0);
                    if (Number.isFinite(price) && price > 0) {
                        applyLivePrice(price);
                    }
                } catch {
                    // ignore malformed websocket frame
                }
            };

            ws.onerror = () => {};

            ws.onclose = () => {
                wsRef.current = null;
                if (!cancelled) {
                    reconnectTimerRef.current = setTimeout(connect, WS_RECONNECT_MS);
                }
            };
        };

        connect();

        return () => {
            cancelled = true;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [selectedAsset.symbol, timeframe, chartType]);

    const timeframes = [TF.MIN_1, TF.MIN_5, TF.HOUR_1, TF.DAY_1, TF.WEEK_1, TF.MONTH_1, TF.YEAR_1];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black transition-colors duration-300">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 mr-2 md:mr-4 shrink-0 w-auto md:w-[180px]">
                    <span className="font-black text-zinc-900 dark:text-white text-sm md:text-lg whitespace-nowrap tracking-tighter">
                        {/^\d{6}$/.test(selectedAsset.symbol) ? selectedAsset.name : selectedAsset.symbol}
                    </span>
                    <span
                        className={`text-[9px] md:text-xs font-mono px-1.5 py-0.5 rounded ${selectedAsset.isPositive
                            ? "bg-emerald-50 dark:bg-zinc-800 text-emerald-600"
                            : "bg-blue-50 dark:bg-zinc-800 text-blue-600"
                            }`}
                    >
                        {selectedAsset.change}
                    </span>
                </div>

                <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-700 mx-2 shrink-0" />

                <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-0.5 shrink-0">
                    <button
                        onClick={() => setChartType("area")}
                        className={`p-1.5 rounded-md transition-all ${chartType === "area"
                            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                            : "hover:text-zinc-900 dark:hover:text-white text-zinc-400"
                            }`}
                    >
                        <LineChart className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setChartType("candle")}
                        className={`p-1.5 rounded-md transition-all ${chartType === "candle"
                            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                            : "hover:text-zinc-900 dark:hover:text-white text-zinc-400"
                            }`}
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

            <div className="relative flex-1 w-full">
                <div ref={chartContainerRef} className="absolute inset-0" />
                {noDataMessage && (
                    <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                        <div className="rounded-md border border-zinc-700/60 bg-black/40 px-4 py-2 text-sm font-medium text-zinc-300">
                            {noDataMessage}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
