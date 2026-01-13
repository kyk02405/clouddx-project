'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const PriceChart = dynamic(() => import('@/components/PriceChart'), {
  ssr: false,
});

interface CoinDetailPageProps {
  params: {
    id: string;
  };
}

export default function CoinDetailPage({ params }: CoinDetailPageProps) {
  const router = useRouter();
  const [history, setHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8000/api/history/${params.id}`
        );
        const data = await response.json();
        setHistory(data.prices || []);
      } catch (error) {
        console.error('Failed to load history:', error);
      }
      setLoading(false);
    };

    loadHistory();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-20 text-center">
        <div className="spinner mx-auto" />
        <p className="text-gray-400">차트 데이터 로딩 중...</p>
      </div>
    );
  }

  const isUp = history.length > 1 && history[history.length - 1] > history[0];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <button
          onClick={() => router.push('/')}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          ← 뒤로가기
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {params.id.replace('USDT', '')} / USDT
          </h1>
          <p className="text-gray-400">7일 가격 차트</p>
        </div>

        <div className="card">
          <div className="mb-6 flex items-center justify-between border-b border-gray-700 pb-4">
            <h3 className="text-lg font-bold text-white">가격 차트 (7일)</h3>
            <span className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white">
              7D
            </span>
          </div>
          <div className="h-96">
            {history.length > 0 ? (
              <PriceChart prices={history} isUp={isUp} />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                차트 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
