"use client";

import { useEffect, useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
                return "border-foreground/20 bg-foreground/5";
            case "risk":
                return "border-destructive/50 bg-destructive/10";
            case "action":
                return "border-foreground/30 bg-foreground/10";
            default:
                return "";
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
            <section className="bg-background px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <Card className="border-destructive/50 bg-destructive/10">
                        <CardContent className="flex items-center justify-center p-6 text-destructive">
                            {error}
                        </CardContent>
                    </Card>
                </div>
            </section>
        );
    }

    if (insights.length === 0) {
        return (
            <section className="bg-background px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <h2 className="mb-6 text-2xl font-bold text-foreground">AI Insights</h2>
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
        <section className="bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <h2 className="mb-6 text-2xl font-bold text-foreground">AI Insights</h2>

                <div className="grid gap-6 md:grid-cols-3">
                    {insights.map((insight) => (
                        <Card key={insight.id} className={getCardStyle(insight.type)}>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <span className="text-2xl">{getIcon(insight.type)}</span>
                                    {insight.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4 text-muted-foreground">{insight.content}</p>
                                {insight.confidence && (
                                    <div className="text-sm text-muted-foreground">신뢰도: {insight.confidence}%</div>
                                )}
                                {insight.level && (
                                    <div className="text-sm text-orange-600 dark:text-orange-400">위험도: {insight.level}</div>
                                )}
                                {insight.priority && (
                                    <div className="text-sm text-green-600 dark:text-green-400">우선순위: {insight.priority}</div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
