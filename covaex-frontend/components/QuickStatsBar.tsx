"use client";

import { useEffect, useState } from "react";

interface StatusData {
    priceUpdate: string;
    newsUpdate: string;
    aiUpdate: string;
    status: string;
}

export default function QuickStatsBar() {
    const [data, setData] = useState<StatusData | null>(null);

    useEffect(() => {
        fetch("/api/public/status")
            .then((res) => res.json())
            .then(setData)
            .catch(console.error);
    }, []);

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffMinutes < 1) return "방금 전";
        if (diffMinutes < 60) return `${diffMinutes}분 전`;
        const diffHours = Math.floor(diffMinutes / 60);
        return `${diffHours}시간 전`;
    };

    if (!data) {
        return (
            <div className="border-b border-border bg-background px-4 py-3">
                <div className="mx-auto max-w-7xl">
                    <div className="flex animate-pulse justify-center gap-10">
                        <div className="h-5 w-36 rounded bg-gray-200"></div>
                        <div className="h-5 w-36 rounded bg-gray-200"></div>
                        <div className="h-5 w-36 rounded bg-gray-200"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border-b border-gray-200 bg-white px-4 py-4">
            <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-6 text-base sm:gap-10">
                <div className="flex items-center gap-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-600"></div>
                    <span className="text-gray-700 font-medium">가격 업데이트:</span>
                    <span className="font-bold text-black">{formatTime(data.priceUpdate)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-600"></div>
                    <span className="text-gray-700 font-medium">뉴스 업데이트:</span>
                    <span className="font-bold text-black">{formatTime(data.newsUpdate)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-600"></div>
                    <span className="text-gray-700 font-medium">AI 요약 생성:</span>
                    <span className="font-bold text-black">{formatTime(data.aiUpdate)}</span>
                </div>
            </div>
        </div>
    );
}
