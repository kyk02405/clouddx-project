import { type AssetSummary } from "@/lib/mock-data";

interface AssetSummaryCardProps {
  summary: AssetSummary;
}

export default function AssetSummaryCard({ summary }: AssetSummaryCardProps) {
  const formatCurrency = (value: number) => {
    return `${value.toLocaleString()}`;
  };

  return (
    <div className="rounded-xl bg-gray-900 p-6">
      <div className="mb-6">
        <h2 className="text-sm text-gray-400">총 자산</h2>
        <p className="mt-1 text-4xl font-bold text-white">
          {formatCurrency(summary.totalAssets)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm text-gray-400">투자</h3>
          <p className="mt-1 text-xl font-semibold text-white">
            {formatCurrency(summary.investment)}
          </p>
        </div>

        <div>
          <h3 className="text-sm text-gray-400">현금</h3>
          <p className="mt-1 text-xl font-semibold text-white">
            {formatCurrency(summary.cash)}
          </p>
        </div>

        <div>
          <h3 className="text-sm text-gray-400">총 수익</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <p
              className={`text-xl font-semibold ${summary.totalProfit >= 0 ? "text-red-500" : "text-blue-500"
                }`}
            >
              {summary.totalProfit >= 0 ? "+" : ""}
              {formatCurrency(summary.totalProfit)}
            </p>
            <span
              className={`text-sm ${summary.totalProfit >= 0 ? "text-red-400" : "text-blue-400"
                }`}
            >
              {summary.totalProfit >= 0 ? "+" : ""}
              {summary.totalProfitPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm text-gray-400">일간 수익</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <p
              className={`text-xl font-semibold ${summary.dailyProfit >= 0 ? "text-red-500" : "text-blue-500"
                }`}
            >
              {summary.dailyProfit >= 0 ? "+" : ""}
              {formatCurrency(summary.dailyProfit)}
            </p>
            <span
              className={`text-sm ${summary.dailyProfit >= 0 ? "text-red-400" : "text-blue-400"
                }`}
            >
              {summary.dailyProfit >= 0 ? "+" : ""}
              {summary.dailyProfitPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
