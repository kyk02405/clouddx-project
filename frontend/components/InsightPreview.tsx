"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingSkeleton from "./LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
            .then((data) => {
                if (data.insights) setInsights(data.insights);
            })
            .catch(() => {
                // 에러 시에도 기본 샘플 데이터를 보여주어 블러 처리가 자연스럽게 보이도록 함
                setInsights([
                    { id: 1, type: "summary", title: "샘플 인사이트", content: "로그인 후 실시간 AI 분석 결과를 확인하세요.", timestamp: new Date().toISOString() },
                    { id: 2, type: "risk", title: "샘플 리스크", content: "자산 변동성에 대한 실시간 알림을 제공합니다.", timestamp: new Date().toISOString() },
                    { id: 3, type: "action", title: "샘플 행동", content: "포트폴리오 최적화 제안을 받아보세요.", timestamp: new Date().toISOString() }
                ]);
            });
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
        <section id="features" className="bg-background px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl relative">
                {/* Content Header - NOT Blurred */}
                <div className="mb-12 flex items-center justify-between relative z-20">
                    <h2 className="text-3xl font-bold text-foreground">AI 투자 인사이트</h2>
                    <Badge variant="secondary" className="text-sm">실시간 분석 중</Badge>
                </div>

                {/* Content Grid (Blurred) */}
                <div className="grid gap-6 md:grid-cols-3 filter blur-sm select-none pointer-events-none relative z-0">
                    {insights.map((insight) => (
                        <Card key={insight.id} className={getCardStyle(insight.type)}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    {getIcon(insight.type)}
                                    {insight.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    {insight.content}
                                </p>
                                {/* Recommendation 필드가 없으므로 content만 표시하거나, 필요한 경우 추가 로직 구현 */}

                                {insight.confidence && (
                                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>신뢰도:</span>
                                        <span className="font-bold text-foreground">{insight.confidence}%</span>
                                    </div>
                                )}
                                {insight.level && (
                                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>위험도:</span>
                                        <span className={`font-bold ${insight.level === 'high' ? 'text-destructive' : 'text-orange-500'}`}>
                                            {insight.level}
                                        </span>
                                    </div>
                                )}
                                {insight.priority && (
                                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>우선순위:</span>
                                        <span className="font-bold text-green-600">
                                            {insight.priority}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Lock Overlay (Glassmorphism) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/60 backdrop-blur-[2px] z-10">
                    <div className="text-center p-8 bg-background/80 rounded-2xl shadow-lg border border-border/50 max-w-md mx-4">
                        <div className="mb-4 text-4xl">🔒</div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">지금 시작하세요</h3>
                        <p className="text-muted-foreground mb-8">
                            AI 기반 자산 관리로<br />더 스마트한 투자를 경험하세요
                        </p>
                        <Button asChild size="lg" className="w-full text-base font-semibold shadow-md hover:shadow-lg transition-all">
                            <Link href="/login">Tutum 무료로 시작하기</Link>
                        </Button>
                    </div>
                </div>
            </div >
        </section >
    );
}
