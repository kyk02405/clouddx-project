export default function CoinDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  // Note: In Next.js 15+, params is a Promise
  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
          코인 상세 페이지
        </h1>
        
        <div className="space-y-6">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">심볼</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {/* We'll use React.use() or await in async component later */}
              Coin Symbol
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">현재가</p>
              <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Coming soon
              </p>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">24시간 변동</p>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                Coming soon
              </p>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              차트 영역
            </h2>
            <div className="h-64 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-lg">
              <p className="text-zinc-500 dark:text-zinc-400">
                차트 placeholder (TradingView 또는 ApexCharts)
              </p>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              주문 위젯
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                매수
              </button>
              <button className="py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
                매도
              </button>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">
              주문 기능은 추후 구현 예정
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
