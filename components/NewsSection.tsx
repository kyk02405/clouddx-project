"use client";

import { useEffect, useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    const [data, setData] = useState<NewsData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/public/news")
            .then((res) => res.json())
            .then(setData)
            .catch(() => setError("뉴스를 불러올 수 없습니다"));
    }, []);

    return (
        <section id="news" className="bg-background px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <h2 className="mb-6 text-2xl font-bold text-foreground">뉴스</h2>

                {/* Error State */}
                {error && (
                    <Card className="border-destructive/50 bg-destructive/10">
                        <CardContent className="flex items-center justify-center p-6 text-destructive">
                            {error}
                        </CardContent>
                    </Card>
                )}

                {/* Loading State */}
                {!data && !error && (
                    <div className="space-y-4">
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                    </div>
                )}

                {/* News Content */}
                {data && (
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="mb-6">
                            <TabsTrigger value="all">전체 뉴스</TabsTrigger>
                            <TabsTrigger value="myAssets">내 자산 뉴스</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            <div className="space-y-4">
                                {data.all.map((item) => (
                                    <a
                                        key={item.id}
                                        href={`https://www.google.com/search?q=${encodeURIComponent(item.title)}&tbm=nws`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block transition-transform hover:scale-[1.01]"
                                    >
                                        <Card className="transition hover:shadow-md hover:border-primary/50">
                                            <CardContent className="p-6">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <Badge variant="secondary">{item.category}</Badge>
                                                    <span className="text-xs text-muted-foreground">{item.time}</span>
                                                </div>
                                                <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                                                <p className="mb-3 text-muted-foreground">{item.summary}</p>
                                                <div className="text-xs text-muted-foreground">출처: {item.source}</div>
                                            </CardContent>
                                        </Card>
                                    </a>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="myAssets">
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                    <div className="mb-4 text-4xl">🔒</div>
                                    <h3 className="mb-2 text-xl font-bold text-foreground">로그인이 필요한 기능입니다</h3>
                                    <p className="mb-6 text-muted-foreground">
                                        보유한 자산에 대한 맞춤형 뉴스와 인사이트를 받아보세요
                                    </p>
                                    <Button>로그인하고 계속하기</Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </section>
    );
}
