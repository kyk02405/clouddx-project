'use client';

import { GlobalData, TrendingCoin } from '@/lib/coingecko';
import { formatNumber } from '@/lib/utils';

interface MarketStatsCardsProps {
  globalData: GlobalData | null;
  trending: TrendingCoin[] | null;
  currency: string;
}

export default function MarketStatsCards({
  globalData,
  trending,
  currency,
}: MarketStatsCardsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* 시가총액 */}
      <div className="card">
        <div className="mb-2 text-sm font-semibold text-sub">시가총액</div>
        <div className="text-2xl font-bold text-white">
          {globalData
            ? formatNumber(
                globalData.total_market_cap[currency],
                'currency',
                currency
              )
            : '-'}
        </div>
      </div>

      {/* 24h 거래량 */}
      <div className="card">
        <div className="mb-2 text-sm font-semibold text-sub">24h 거래량</div>
        <div className="text-2xl font-bold text-white">
          {globalData
            ? formatNumber(
                globalData.total_volume[currency],
                'currency',
                currency
              )
            : '-'}
        </div>
      </div>

      {/* 트렌딩 코인 */}
      <div className="card">
        <div className="mb-3 text-sm font-semibold text-sub">트렌딩 코인</div>
        <ul className="space-y-2">
          {trending && trending.length > 0 ? (
            trending.slice(0, 3).map((item) => (
              <li key={item.item.id} className="flex items-center gap-2">
                <img
                  src={item.item.small}
                  alt={item.item.name}
                  className="h-5 w-5 rounded-full"
                />
                <span className="text-sm text-white">{item.item.name}</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-sub">-</li>
          )}
        </ul>
      </div>
    </div>
  );
}
