import { type HoldingAsset } from "@/lib/mockAssets";

interface InvestmentTableProps {
  holdings: HoldingAsset[];
}

export default function InvestmentTable({ holdings }: InvestmentTableProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString();
  };

  const calculateProfit = (holding: HoldingAsset) => {
    const currentValue = holding.currentPrice * holding.quantity;
    const investedValue = holding.avgPrice * holding.quantity;
    const profit = currentValue - investedValue;
    const profitPercent = ((profit / investedValue) * 100);
    return { profit, profitPercent, currentValue };
  };

  return (
    <div className="rounded-xl bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 p-4">
        <h2 className="text-lg font-semibold text-white">투자</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
              <th className="px-4 py-3 font-medium">종목/종류</th>
              <th className="px-4 py-3 font-medium">평균가</th>
              <th className="px-4 py-3 font-medium">보유량</th>
              <th className="px-4 py-3 font-medium">평단</th>
              <th className="px-4 py-3 font-medium">현재 시세</th>
              <th className="px-4 py-3 font-medium">일간 수익</th>
              <th className="px-4 py-3 font-medium">총 수익</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
              const { profit, profitPercent, currentValue } = calculateProfit(holding);
              const dailyProfit = currentValue * -0.07 / 100; // Mock daily change

              return (
                <tr key={holding.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-semibold text-white">{holding.symbol}</div>
                      <div className="text-xs text-gray-400">{holding.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-white">
                    {formatCurrency(currentValue)}
                  </td>
                  <td className="px-4 py-4 text-white">{holding.quantity}</td>
                  <td className="px-4 py-4 text-white">
                    {formatCurrency(holding.avgPrice)}
                  </td>
                  <td className="px-4 py-4 text-white">
                    {formatCurrency(holding.currentPrice)}
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`${
                        dailyProfit >= 0 ? "text-red-500" : "text-blue-500"
                      }`}
                    >
                      <div>
                        {dailyProfit >= 0 ? "+" : ""}
                        {formatCurrency(Math.round(dailyProfit))}
                      </div>
                      <div className="text-xs">
                        {dailyProfit >= 0 ? "+" : ""}
                        {(-0.07).toFixed(2)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`${
                        profit >= 0 ? "text-red-500" : "text-blue-500"
                      }`}
                    >
                      <div>
                        {profit >= 0 ? "+" : ""}
                        {formatCurrency(Math.round(profit))}
                      </div>
                      <div className="text-xs">
                        {profit >= 0 ? "+" : ""}
                        {profitPercent.toFixed(2)}%
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {holdings.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          등록된 투자가 없습니다
        </div>
      )}
    </div>
  );
}
