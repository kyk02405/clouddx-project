"use client";

import { useEffect, useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
        <section id="news" className="bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <h2 className="mb-6 text-2xl font-bold text-foreground">News</h2>

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

                        {["all", "myAssets"].map((tab) => (
                            <TabsContent key={tab} value={tab}>
                                <div className="space-y-4">
                                    {data[tab as keyof NewsData].map((item) => (
                                        <Card key={item.id} className="transition hover:shadow-md">
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
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </div>
        </section>
    );
}
