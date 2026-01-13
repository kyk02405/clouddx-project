'use client';

import { GlobalData } from '@/lib/coingecko';

interface GlobalStatsBarProps {
  data: GlobalData | null;
}

export default function GlobalStatsBar({ data }: GlobalStatsBarProps) {
  if (!data) return null;

  return (
    <div className="top-bar">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-6 text-xs">
          <span>
            코인:{' '}
            <span className="font-semibold text-white">
              {data.active_cryptocurrencies.toLocaleString()}
            </span>
          </span>
          <span>
            거래소:{' '}
            <span className="font-semibold text-white">
              {data.markets.toLocaleString()}
            </span>
          </span>
          <span>
            점유율: BTC{' '}
            <span className="font-semibold text-white">
              {data.market_cap_percentage.btc.toFixed(1)}%
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
