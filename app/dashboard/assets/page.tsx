"use client";

import { useState } from "react";
import { mockAssetSummary, mockHoldings, mockTransactions } from "@/lib/mockAssets";
import AssetSummaryCard from "@/components/AssetSummaryCard";
import InvestmentTable from "@/components/InvestmentTable";
import AddAssetModal from "@/components/AddAssetModal";

export default function AssetsPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Summary Card */}
        <AssetSummaryCard summary={mockAssetSummary} />

        {/* Investment Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">투자</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
            >
              자산 추가
            </button>
          </div>
          <InvestmentTable holdings={mockHoldings} />
        </div>

        {/* Cash Section */}
        <div className="rounded-xl bg-gray-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-400">현금</h3>
              <p className="mt-1 text-2xl font-bold text-white">0</p>
            </div>
            <button className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800">
              현금 추가
            </button>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="rounded-xl bg-gray-900">
          <div className="border-b border-gray-800 p-4">
            <h2 className="text-lg font-semibold text-white">거래 내역</h2>
          </div>
          <div className="p-4">
            {mockTransactions.length === 0 ? (
              <p className="py-8 text-center text-gray-500">등록된 거래가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {mockTransactions.map((tx, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-gray-800 p-3"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {tx.symbol} · {tx.quantity}주
                      </div>
                      <div className="text-xs text-gray-400">
                        {tx.date} · {tx.broker}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {tx.price.toLocaleString()}
                      </div>
                      <div
                        className={`text-xs ${
                          tx.type === "buy" ? "text-red-400" : "text-blue-400"
                        }`}
                      >
                        {tx.type === "buy" ? "매수" : "매도"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Asset Modal */}
      <AddAssetModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
