'use client';

interface FiltersBarProps {
  filter: 'all' | 'favorites';
  onFilterChange: (filter: 'all' | 'favorites') => void;
  highlightPositive: boolean;
  onHighlightChange: (highlight: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
}

export default function FiltersBar({
  filter,
  onFilterChange,
  highlightPositive,
  onHighlightChange,
  searchQuery,
  onSearchChange,
  currency,
  onCurrencyChange,
}: FiltersBarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      {/* Tabs: All / Favorites */}
      <div className="flex gap-1 rounded-lg bg-gray-800 p-1">
        <button
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            filter === 'all'
              ? 'bg-gray-700 text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => onFilterChange('all')}
        >
          전체
        </button>
        <button
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            filter === 'favorites'
              ? 'bg-gray-700 text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => onFilterChange('favorites')}
        >
          즐겨찾기
        </button>
      </div>

      {/* 상승 코인만 표시 토글 */}
      <label className="flex cursor-pointer items-center gap-2">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={highlightPositive}
            onChange={(e) => onHighlightChange(e.target.checked)}
          />
          <div
            className={`h-5 w-9 rounded-full transition ${
              highlightPositive ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition ${
                highlightPositive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-300">
          상승 코인만
        </span>
      </label>

      {/* 검색창 */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="코인 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      {/* 통화 선택 */}
      <select
        value={currency}
        onChange={(e) => onCurrencyChange(e.target.value)}
        className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      >
        <option value="krw">KRW</option>
        <option value="usd">USD</option>
        <option value="eur">EUR</option>
      </select>

      {/* 새로고침 버튼 */}
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        새로고침
      </button>
    </div>
  );
}
