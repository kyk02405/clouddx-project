'use client';

import { CoinMarket } from '@/lib/coingecko';
import { formatNumber, generateSparkline } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface CoinTableProps {
  coins: CoinMarket[];
  currency: string;
  favorites: string[];
  onToggleFavorite: (coinId: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (key: string) => void;
}

export default function CoinTable({
  coins,
  currency,
  favorites,
  onToggleFavorite,
  sortBy,
  sortOrder,
  onSort,
}: CoinTableProps) {
  const router = useRouter();

  const handleRowClick = (coinId: string) => {
    router.push(`/coin/${coinId}`);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <span className="text-gray-600">⇅</span>;
    return sortOrder === 'asc' ? (
      <span className="text-green-500">↑</span>
    ) : (
      <span className="text-green-500">↓</span>
    );
  };

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>⭐</th>
            <th onClick={() => onSort('market_cap_rank')} className="cursor-pointer">
              순위 <SortIcon column="market_cap_rank" />
            </th>
            <th>코인</th>
            <th onClick={() => onSort('current_price')} className="cursor-pointer">
              가격 <SortIcon column="current_price" />
            </th>
            <th
              onClick={() => onSort('price_change_percentage_1h_in_currency')}
              className="cursor-pointer"
            >
              1H <SortIcon column="price_change_percentage_1h_in_currency" />
            </th>
            <th
              onClick={() => onSort('price_change_percentage_24h_in_currency')}
              className="cursor-pointer"
            >
              24H <SortIcon column="price_change_percentage_24h_in_currency" />
            </th>
            <th
              onClick={() => onSort('price_change_percentage_7d_in_currency')}
              className="cursor-pointer"
            >
              7D <SortIcon column="price_change_percentage_7d_in_currency" />
            </th>
            <th onClick={() => onSort('total_volume')} className="cursor-pointer">
              거래량 <SortIcon column="total_volume" />
            </th>
            <th onClick={() => onSort('market_cap')} className="cursor-pointer">
              시가총액 <SortIcon column="market_cap" />
            </th>
            <th>7일 차트</th>
          </tr>
        </thead>
        <tbody>
          {coins.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-10 text-center text-gray-500">
                데이터가 없습니다.
              </td>
            </tr>
          ) : (
            coins.map((coin) => {
              const isFav = favorites.includes(coin.id);
              const p1h = coin.price_change_percentage_1h_in_currency || 0;
              const p24h = coin.price_change_percentage_24h_in_currency || 0;
              const p7d = coin.price_change_percentage_7d_in_currency || 0;

              return (
                <tr key={coin.id} onClick={() => handleRowClick(coin.id)}>
                  <td
                    data-label="즐겨찾기"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(coin.id);
                    }}
                  >
                    <span className={`star-btn ${isFav ? 'active' : ''}`}>
                      ★
                    </span>
                  </td>
                  <td data-label="순위" className="text-sub">
                    #{coin.market_cap_rank}
                  </td>
                  <td data-label="코인">
                    <div className="flex items-center gap-3">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="h-6 w-6 rounded-full"
                      />
                      <div>
                        <div className="font-semibold text-white">
                          {coin.name}
                        </div>
                        <div className="text-xs uppercase text-gray-500">
                          {coin.symbol}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td data-label="가격" className="font-semibold text-white">
                    {formatNumber(coin.current_price, 'currency', currency)}
                  </td>
                  <td
                    data-label="1h"
                    className={p1h >= 0 ? 'text-up' : 'text-down'}
                  >
                    {formatNumber(p1h, 'percent')}
                  </td>
                  <td
                    data-label="24h"
                    className={p24h >= 0 ? 'text-up' : 'text-down'}
                  >
                    {formatNumber(p24h, 'percent')}
                  </td>
                  <td
                    data-label="7d"
                    className={p7d >= 0 ? 'text-up' : 'text-down'}
                  >
                    {formatNumber(p7d, 'percent')}
                  </td>
                  <td data-label="거래량">
                    {formatNumber(coin.total_volume, 'currency', currency)}
                  </td>
                  <td data-label="시가총액">
                    {formatNumber(coin.market_cap, 'currency', currency)}
                  </td>
                  <td data-label="7일 차트">
                    <div
                      className="inline-block h-10 w-28"
                      dangerouslySetInnerHTML={{
                        __html: generateSparkline(
                          coin.sparkline_in_7d.price,
                          p7d >= 0
                        ),
                      }}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
