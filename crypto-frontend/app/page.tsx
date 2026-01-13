'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatNumber, generateSparkline } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface CoinMetadata {
  name: string;
  icon: string;
  color: string;
}

export default function Home() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const { prices, isConnected, refreshTrigger } = useWebSocket(wsUrl);
  const [coinMetadata, setCoinMetadata] = useState<
    Record<string, CoinMetadata>
  >({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // 코인 메타데이터 로드
  useEffect(() => {
    fetch(`${apiUrl}/coins`)
      .then((res) => res.json())
      .then((data) => {
        const metadata: Record<string, CoinMetadata> = {};
        data.forEach((coin: any) => {
          metadata[coin.symbol] = {
            name: coin.name,
            icon: coin.icon,
            color: coin.color,
          };
        });
        setCoinMetadata(metadata);
      })
      .catch((err) => console.error('Failed to load metadata:', err));

    // 즐겨찾기 로드
    const stored = localStorage.getItem('favorites');
    if (stored) setFavorites(JSON.parse(stored));
  }, []);

  // 필터링된 코인 목록
  const filteredCoins = Array.from(prices.values()).filter((coin) => {
    const metadata = coinMetadata[coin.symbol];
    if (!metadata) return false;

    const matchSearch =
      metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFav =
      filter === 'favorites' ? favorites.includes(coin.symbol) : true;

    return matchSearch && matchFav;
  });

  const toggleFavorite = (symbol: string) => {
    const updated = favorites.includes(symbol)
      ? favorites.filter((s) => s !== symbol)
      : [...favorites, symbol];
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="mb-2 text-4xl font-bold text-white">
              🚀 Crypto Market Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <p className="text-gray-400">
            실시간 암호화폐 가격 - Powered by Binance WebSocket
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex gap-1 rounded-lg bg-gray-800 p-1">
            <button
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                filter === 'all'
                  ? 'bg-gray-700 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setFilter('all')}
            >
              전체
            </button>
            <button
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                filter === 'favorites'
                  ? 'bg-gray-700 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setFilter('favorites')}
            >
              즐겨찾기
            </button>
          </div>

          <input
            type="text"
            placeholder="코인 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>⭐</th>
                <th>코인</th>
                <th>가격 (USDT)</th>
                <th>24h 변동</th>
                <th>24h 고가</th>
                <th>24h 저가</th>
                <th>24h 거래량</th>
              </tr>
            </thead>
            <tbody key={refreshTrigger}>
              {filteredCoins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    {prices.size === 0
                      ? '데이터 로딩 중...'
                      : '검색 결과가 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredCoins.map((coin) => {
                  const metadata = coinMetadata[coin.symbol];
                  const change = parseFloat(coin.change_24h);
                  const isFav = favorites.includes(coin.symbol);

                  return (
                    <tr
                      key={coin.symbol}
                      onClick={() => router.push(`/coin/${coin.symbol}`)}
                      className="cursor-pointer"
                    >
                      <td
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(coin.symbol);
                        }}
                      >
                        <span className={`star-btn ${isFav ? 'active' : ''}`}>
                          ★
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-white"
                            style={{ backgroundColor: metadata?.color }}
                          >
                            {metadata?.icon}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {metadata?.name || coin.symbol}
                            </div>
                            <div className="text-xs uppercase text-gray-500">
                              {coin.symbol.replace('USDT', '')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="font-semibold text-white">
                        ${parseFloat(coin.price).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className={change >= 0 ? 'text-up' : 'text-down'}>
                        {change >= 0 ? '+' : ''}
                        {change.toFixed(2)}%
                      </td>
                      <td className="text-gray-300">
                        ${parseFloat(coin.high_24h).toLocaleString()}
                      </td>
                      <td className="text-gray-300">
                        ${parseFloat(coin.low_24h).toLocaleString()}
                      </td>
                      <td className="text-gray-300">
                        {formatNumber(parseFloat(coin.volume_24h))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
