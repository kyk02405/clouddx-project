"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingSkeleton from "./LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

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
                return "border-none bg-white dark:bg-white/10 shadow-xl";
            case "risk":
                return "border-none bg-white dark:bg-white/10 shadow-xl";
            case "action":
                return "border-none bg-white dark:bg-white/10 shadow-xl";
            default:
                return "border-none bg-white dark:bg-white/10 shadow-xl";
        }
    };

    const getIcon = (type: string) => {
        return (
            <div className="bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200 dark:border-white/10 shadow-inner overflow-hidden w-16 h-16 flex items-center justify-center">
                <DotLottieReact
                    src="https://lottie.host/7355ea35-b73f-4aef-a187-6aaf2c8c40f4/gcBPqH0jIx.lottie"
                    loop
                    autoplay
                    className="w-24 h-24"
                />
            </div>
        );
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
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-foreground uppercase">AI 투자 인사이트</h2>
                        <p className="text-muted-foreground mt-2 font-medium">tutum AI가 분석하는 실시간 시장 전략</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest animate-pulse">
                        Live Analysis
                    </Badge>
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
                                        <span className={`font-bold ${insight.level === 'high' ? 'text-destructive' : 'text-amber-500'}`}>
                                            {insight.level}
                                        </span>
                                    </div>
                                )}
                                {insight.priority && (
                                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>우선순위:</span>
                                        <span className="font-bold text-[#34D399]">
                                            {insight.priority}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Lock Overlay (Premium Glassmorphism) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-zinc-100/40 dark:bg-zinc-950/40 backdrop-blur-md z-10 border border-white/20 dark:border-white/5">
                    <div className="text-center p-12 bg-white/80 dark:bg-zinc-900/90 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/10 max-w-lg mx-4">
                        <div className="mb-8 flex justify-center">
                            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-3xl shadow-inner border border-zinc-200 dark:border-zinc-700">
                                🔒
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-foreground mb-4 tracking-tight">지금 바로 시작하세요</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-10 font-medium leading-relaxed">
                            tutum의 독보적인 AI 기술로 개인화된<br />자산 관리와 시장 인사이트를 무제한으로 경험하세요.
                        </p>
                        <Button asChild size="lg" className="w-full h-16 text-lg font-black bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl shadow-xl hover:scale-[1.02] transition-all border-none">
                            <Link href="/login">tutum 무료로 시작하기</Link>
                        </Button>
                    </div>
                </div>
            </div >
        </section >
    );
}
