'use client';

import { useEffect, useState, useRef } from 'react';

export interface CryptoPrice {
  symbol: string;
  price: string;
  change_24h: string;
  high_24h: string;
  low_24h: string;
  volume_24h: string;
}

export function useWebSocket(url: string) {
  const [prices, setPrices] = useState<Map<string, CryptoPrice>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data: CryptoPrice = JSON.parse(event.data);
        setPrices((prev) => {
          const newPrices = new Map(prev);
          newPrices.set(data.symbol, data);
          return newPrices;
        });
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  // 5초마다 테이블 갱신 트리거
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { prices, isConnected, refreshTrigger };
}
