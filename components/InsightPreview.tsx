"use client";

import { useEffect, useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";

interface Insight {
    id: number;
    type: string;
    title: string;
    content: string;
    confidence?: number;
    level?: string;
    priority?: string;
    timestamp: string;
}

export default function InsightPreview() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/public/insights/sample")
            .then((res) => res.json())
            .then((data) => setInsights(data.insights))
            .catch(() => setError("AI 인사이트를 불러올 수 없습니다"));
    }, []);

    const getCardStyle = (type: string) => {
        switch (type) {
            case "summary":
                return "border-blue-800 bg-blue-950/30";
            case "risk":
                return "border-orange-800 bg-orange-950/30";
            case "action":
                return "border-green-800 bg-green-950/30";
            default:
                return "border-gray-800 bg-gray-900";
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "summary":
                return "📊";
            case "risk":
                return "⚠️";
            case "action":
                return "💡";
            default:
                return "ℹ️";
        }
    };

    if (error) {
        return (
            <section className="bg-gray-950 px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-center text-red-400">
                        {error}
                    </div>
                </div>
            </section>
        );
    }

    if (insights.length === 0) {
        return (
            <section className="bg-gray-950 px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <h2 className="mb-6 text-2xl font-bold text-white">AI Insights</h2>
                    <div className="grid gap-6 md:grid-cols-3">
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="bg-gray-950 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <h2 className="mb-6 text-2xl font-bold text-white">AI Insights</h2>

                <div className="grid gap-6 md:grid-cols-3">
                    {insights.map((insight) => (
                        <div
                            key={insight.id}
                            className={`rounded-lg border p-6 ${getCardStyle(insight.type)}`}
                        >
                            <div className="mb-3 flex items-center gap-2">
                                <span className="text-2xl">{getIcon(insight.type)}</span>
                                <h3 className="text-lg font-semibold text-white">{insight.title}</h3>
                            </div>
                            <p className="mb-4 text-gray-300">{insight.content}</p>
                            {insight.confidence && (
                                <div className="text-sm text-gray-400">신뢰도: {insight.confidence}%</div>
                            )}
                            {insight.level && (
                                <div className="text-sm text-orange-400">위험도: {insight.level}</div>
                            )}
                            {insight.priority && (
                                <div className="text-sm text-green-400">우선순위: {insight.priority}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
