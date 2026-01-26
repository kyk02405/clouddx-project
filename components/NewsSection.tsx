"use client";

import { useEffect, useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";

interface News {
    id: number;
    title: string;
    summary: string;
    time: string;
    category: string;
    source: string;
}

interface NewsData {
    all: News[];
    myAssets: News[];
}

export default function NewsSection() {
    const [activeTab, setActiveTab] = useState<"all" | "myAssets">("all");
    const [data, setData] = useState<NewsData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/public/news")
            .then((res) => res.json())
            .then(setData)
            .catch(() => setError("뉴스를 불러올 수 없습니다"));
    }, []);

    const news = data ? (activeTab === "all" ? data.all : data.myAssets) : [];

    return (
        <section id="news" className="bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <h2 className="mb-6 text-2xl font-bold text-white">News</h2>

                {/* Tabs */}
                <div className="mb-6 flex gap-4 border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`border-b-2 pb-3 font-medium transition ${activeTab === "all"
                                ? "border-blue-500 text-white"
                                : "border-transparent text-gray-400 hover:text-gray-300"
                            }`}
                    >
                        전체 뉴스
                    </button>
                    <button
                        onClick={() => setActiveTab("myAssets")}
                        className={`border-b-2 pb-3 font-medium transition ${activeTab === "myAssets"
                                ? "border-blue-500 text-white"
                                : "border-transparent text-gray-400 hover:text-gray-300"
                            }`}
                    >
                        내 자산 뉴스
                    </button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-center text-red-400">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {!data && !error && (
                    <div className="space-y-4">
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                    </div>
                )}

                {/* News Cards */}
                {data && (
                    <div className="space-y-4">
                        {news.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-lg border border-gray-800 bg-gray-950 p-6 transition hover:border-gray-700"
                            >
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="rounded bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-400">
                                        {item.category}
                                    </span>
                                    <span className="text-xs text-gray-500">{item.time}</span>
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                                <p className="mb-3 text-gray-400">{item.summary}</p>
                                <div className="text-xs text-gray-500">출처: {item.source}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
