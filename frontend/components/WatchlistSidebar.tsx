"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { mockWatchlist, type WatchlistItem } from "@/lib/mock-data";

const API_BASE_URL = "/api/proxy";
const WS_BASE_URL = API_BASE_URL.replace(/^http/i, "ws").replace(/\/$/, "");

// 주식/코인 심볼 목록
const STOCK_SYMBOLS = ["005930", "TSLA", "NVDA", "AAPL"];
const CRYPTO_SYMBOLS = ["BTC", "ETH", "SOL", "ADA"];

const STOCK_NAMES: Record<string, string> = {
  "005930": "삼성전자",
  "TSLA": "Tesla Inc.",
  "NVDA": "NVIDIA Corp.",
  "AAPL": "Apple Inc.",
};

const CRYPTO_NAMES: Record<string, string> = {
  "BTC": "Bitcoin",
  "ETH": "Ethereum",
  "SOL": "Solana",
  "ADA": "Cardano",
};

interface WatchlistData {
  crypto: WatchlistItem[];
  stocks: WatchlistItem[];
}

export default function WatchlistSidebar({
  onSelectSymbol,
}: {
  onSelectSymbol: (symbol: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"popular" | "assets" | "watchlist">("popular");
  const [selectedSymbol, setSelectedSymbol] = useState("005930");
  const [watchlistData, setWatchlistData] = useState<WatchlistData>(mockWatchlist);
  const [loading, setLoading] = useState(true);
  const [streamStatus, setStreamStatus] = useState<"connecting" | "connected" | "reconnecting" | "fallback">("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsConnectedRef = useRef(false);

  const fetchWatchlistData = useCallback(async () => {
    try {
      // 코인 시세 조회
      const cryptoResponse = await fetch(
        `${API_BASE_URL}/api/v1/market/prices/crypto?tickers=${CRYPTO_SYMBOLS.join(",")}`
      );
      const cryptoData = cryptoResponse.ok ? await cryptoResponse.json() : { prices: [] };

      // 주식 시세 조회
      const stockResponse = await fetch(
        `${API_BASE_URL}/api/v1/market/prices/stocks?symbols=${STOCK_SYMBOLS.join(",")}`
      );
      const stockData = stockResponse.ok ? await stockResponse.json() : { prices: [] };

      // 코인 데이터 변환
      const cryptoItems: WatchlistItem[] = cryptoData.prices
        ?.filter((p: any) => !p.error)
        .map((p: any) => {
          const symbol = p.ticker?.replace("KRW-", "") || "";
          return {
            name: CRYPTO_NAMES[symbol] || symbol,
            symbol: symbol,
            price: p.price || 0,
            change: 0, // 단일 시세 조회에서는 변동액 계산 불가
            changePercent: p.change_percent || 0,
            data: [], // 히스토리 데이터는 별도 API 필요
          };
        }) || [];

      // 주식 데이터 변환
      const stockItems: WatchlistItem[] = stockData.prices
        ?.filter((p: any) => !p.error && p.price)
        .map((p: any) => ({
          name: STOCK_NAMES[p.code] || p.code,
          symbol: p.code,
          price: p.price || 0,
          change: p.change || 0,
          changePercent: p.price > 0 && p.change ? (p.change / (p.price - p.change)) * 100 : 0,
          data: [],
        })) || [];

      // 데이터가 있으면 업데이트, 없으면 mock 유지
      setWatchlistData({
        crypto: cryptoItems.length > 0 ? cryptoItems : mockWatchlist.crypto,
        stocks: stockItems.length > 0 ? stockItems : mockWatchlist.stocks,
      });
      if (!wsConnectedRef.current) setStreamStatus("fallback");
    } catch (error) {
      console.error("관심종목 데이터 로드 실패:", error);
      // 에러 시 mock 데이터 유지
      if (!wsConnectedRef.current) setStreamStatus("fallback");
    } finally {
      setLoading(false);
    }
  }, []);

  const applyWsItems = useCallback((items: any[]) => {
    if (!Array.isArray(items)) return;

    const cryptoItems: WatchlistItem[] = [];
    const stockItems: WatchlistItem[] = [];

    for (const p of items) {
      if (!p || p.error) continue;

      const raw = String(p.symbol || p.code || p.ticker || "").toUpperCase();
      const symbol = raw.replace("KRW-", "");
      if (!symbol) continue;

      const price = typeof p.price === "string" ? parseFloat(p.price) : Number(p.price || 0);
      const change = typeof p.change === "string" ? parseFloat(p.change) : Number(p.change || 0);
      const changePercentRaw = p.change_percent ?? p.changePercent;
      const hasPercent = typeof changePercentRaw === "number" || typeof changePercentRaw === "string";
      const changePercent = hasPercent
        ? Number(changePercentRaw)
        : (price - change !== 0 ? (change / (price - change)) * 100 : 0);

      const item: WatchlistItem = {
        name: CRYPTO_NAMES[symbol] || STOCK_NAMES[symbol] || symbol,
        symbol,
        price,
        change,
        changePercent,
        data: [],
      };

      if (CRYPTO_SYMBOLS.includes(symbol)) cryptoItems.push(item);
      else stockItems.push(item);
    }

    if (cryptoItems.length === 0 && stockItems.length === 0) return;
    setWatchlistData({
      crypto: cryptoItems.length > 0 ? cryptoItems : mockWatchlist.crypto,
      stocks: stockItems.length > 0 ? stockItems : mockWatchlist.stocks,
    });
    setLoading(false);
  }, []);

  const connectWs = useCallback(() => {
    if (wsRef.current) return;
    setStreamStatus((prev) => (prev === "connected" ? "reconnecting" : "connecting"));
    const symbols = [...new Set([...STOCK_SYMBOLS, ...CRYPTO_SYMBOLS])].join(",");
    const url = `${WS_BASE_URL}/api/v1/market/ws?symbols=${encodeURIComponent(symbols)}&interval_ms=2000`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      wsConnectedRef.current = true;
      setStreamStatus("connected");
      setLoading(false);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === "prices") applyWsItems(payload.items || []);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      wsConnectedRef.current = false;
      setStreamStatus("fallback");
    };

    ws.onclose = () => {
      wsConnectedRef.current = false;
      setStreamStatus("reconnecting");
      wsRef.current = null;
      reconnectTimerRef.current = setTimeout(connectWs, 2000);
    };
  }, [applyWsItems]);

  useEffect(() => {
    connectWs();
    fetchWatchlistData();

    // WS 연결 끊김 시에만 REST 폴백
    const interval = setInterval(() => {
      if (!wsConnectedRef.current) fetchWatchlistData();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [fetchWatchlistData, connectWs]);

  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    onSelectSymbol(symbol);
  };

  const formatPrice = (price: number, symbol: string) => {
    // 코인 심볼 확인
    const isCrypto = CRYPTO_SYMBOLS.includes(symbol);
    // 국내 주식 (숫자 6자리)
    const isDomestic = /^\d{6}$/.test(symbol);

    if (isCrypto || isDomestic) {
      return `${price.toLocaleString()}원`;
    }
    return `$${price.toLocaleString()}`;
  };

  // 모든 리스트 합치기 (검색용)
  const allList = [...watchlistData.crypto, ...watchlistData.stocks];
  const selectedItem = allList.find((item) => item.symbol === selectedSymbol);

  // 현재 탭에 맞는 리스트 선택
  const currentList = activeTab === "popular" ? watchlistData.stocks :
    activeTab === "watchlist" ? watchlistData.crypto :
      allList;

  const streamMeta = {
    connected: { label: "WS 연결", cls: "text-emerald-400 border-emerald-700 bg-emerald-950/40" },
    reconnecting: { label: "재연결 중", cls: "text-amber-300 border-amber-700 bg-amber-950/30" },
    connecting: { label: "연결 중", cls: "text-gray-300 border-gray-700 bg-gray-900/40" },
    fallback: { label: "REST 폴백", cls: "text-sky-300 border-sky-700 bg-sky-950/30" },
  }[streamStatus];

  return (
    <div className="flex h-full flex-col border-l border-gray-800 bg-gray-950">
      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="flex">
        {[
          { key: "popular", label: "인기" },
          { key: "assets", label: "자산" },
          { key: "watchlist", label: "관심" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 text-sm font-medium transition ${activeTab === tab.key
              ? "border-b-2 border-green-400 text-green-400"
              : "text-gray-400 hover:text-white"
              }`}
          >
            {tab.label}
          </button>
        ))}
        </div>
        <div className="px-3 py-2">
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${streamMeta.cls}`}>
            {streamMeta.label}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
        </div>
      )}

      {/* Watchlist */}
      {!loading && (
        <div className="flex-1 overflow-y-auto">
          {currentList.map((item) => (
            <button
              key={item.symbol}
              onClick={() => handleSelectSymbol(item.symbol)}
              className={`w-full border-b border-gray-800/50 px-4 py-3 text-left transition hover:bg-gray-900 ${selectedSymbol === item.symbol ? "bg-gray-900" : ""
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{item.symbol}</span>
                    <span className="text-xs text-gray-500">{item.name}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-300">
                    {formatPrice(item.price, item.symbol)}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-medium ${item.changePercent >= 0 ? "text-red-500" : "text-blue-500"
                      }`}
                  >
                    {item.changePercent >= 0 ? "+" : ""}
                    {item.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Item Detail */}
      {selectedItem && (
        <div className="border-t border-gray-800 bg-gray-900 p-4">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-white">
              {selectedItem.symbol}
              <span className="ml-2 text-sm font-normal text-gray-400">
                {selectedItem.name}
              </span>
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {formatPrice(selectedItem.price, selectedItem.symbol)}
              </span>
              <span
                className={`text-sm font-medium ${selectedItem.changePercent >= 0 ? "text-red-500" : "text-blue-500"
                  }`}
              >
                {selectedItem.changePercent >= 0 ? "+" : ""}
                {selectedItem.changePercent.toFixed(2)}%
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              실시간 자동 갱신 (WebSocket)
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">시가 (추정)</span>
              <span className="text-white">
                {formatPrice(selectedItem.price * 0.98, selectedItem.symbol)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">고가 (추정)</span>
              <span className="text-red-400">
                {formatPrice(selectedItem.price * 1.02, selectedItem.symbol)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">저가 (추정)</span>
              <span className="text-blue-400">
                {formatPrice(selectedItem.price * 0.96, selectedItem.symbol)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
