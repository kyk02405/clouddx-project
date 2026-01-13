'use client';

import { CryptoPrice } from '@/lib/types';

interface PriceCardProps {
  data: CryptoPrice;
  name: string;
  icon: string;
}

const COIN_INFO: Record<string, { name: string; icon: string; color: string }> =
  {
    BTCUSDT: { name: 'Bitcoin', icon: '₿', color: 'bg-orange-500' },
    ETHUSDT: { name: 'Ethereum', icon: 'Ξ', color: 'bg-blue-500' },
    SOLUSDT: { name: 'Solana', icon: '◎', color: 'bg-purple-500' },
    ADAUSDT: { name: 'Cardano', icon: '₳', color: 'bg-cyan-500' },
    AVAXUSDT: { name: 'Avalanche', icon: '▲', color: 'bg-red-500' },
    DOTUSDT: { name: 'Polkadot', icon: '●', color: 'bg-pink-500' },
    LINKUSDT: { name: 'Chainlink', icon: '⬡', color: 'bg-blue-400' },
    UNIUSDT: { name: 'Uniswap', icon: '🦄', color: 'bg-pink-400' },
  };

export default function PriceCard({ data }: { data: CryptoPrice }) {
  const info = COIN_INFO[data.symbol] || {
    name: data.symbol,
    icon: '●',
    color: 'bg-gray-500',
  };
  const change = parseFloat(data.change_24h);
  const isPositive = change >= 0;

  return (
    <div className="hover:bg-gray-750 rounded-lg bg-gray-800 p-6 transition-colors">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`h-12 w-12 ${info.color} flex items-center justify-center rounded-full text-2xl font-bold text-white`}
        >
          {info.icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{info.name}</h3>
          <p className="text-sm text-gray-400">
            {data.symbol.replace('USDT', '')}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white">
            $
            {parseFloat(data.price).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span
            className={`text-sm font-semibold ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {isPositive ? '+' : ''}
            {change.toFixed(2)}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div>
            <span className="block">24h High</span>
            <span className="font-medium text-white">
              ${parseFloat(data.high_24h).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="block">24h Low</span>
            <span className="font-medium text-white">
              ${parseFloat(data.low_24h).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
