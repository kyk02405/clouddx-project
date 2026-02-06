"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface News {
    id: string;
    title: string;
    summary: string;
    content: string;
    time: string;
    category: string;
    source: string;
    url?: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface NewsData {
    all: News[];
    myAssets: News[];
    pagination: Pagination;
}

export default function NewsSection() {
    const [data, setData] = useState<NewsData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedNews, setSelectedNews] = useState<News | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const fetchNews = async (page: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/public/news?page=${page}&limit=5`);
            const result = await res.json();
            setData(result);
            setCurrentPage(page);
        } catch (e) {
            setError("뉴스를 불러올 수 없습니다");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews(1);
    }, []);

    const handlePageChange = (page: number) => {
        if (page >= 1 && data?.pagination && page <= data.pagination.totalPages) {
            fetchNews(page);
        }
    };

    return (
        <section id="news" className="bg-background px-4 pt-8 pb-20 sm:px-6 lg:px-8">
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
                            {loading ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    <LoadingSkeleton />
                                    <LoadingSkeleton />
                                    <LoadingSkeleton />
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                        {data.all.slice(0, 6).map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedNews(item)}
                                                className="group cursor-pointer transition-all duration-300 hover:-translate-y-1"
                                            >
                                                <Card className="h-full border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/50 shadow-none hover:shadow-xl hover:border-emerald-500/50 transition-all overflow-hidden">
                                                    <CardContent className="p-5 flex flex-col h-full">
                                                        <div className="mb-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{item.source}</span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-zinc-400">{item.time}</span>
                                                        </div>
                                                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-emerald-500 transition-colors line-clamp-3">
                                                            {item.title}
                                                        </h3>
                                                        <div className="mt-auto pt-4 flex items-center justify-between">
                                                            <Badge variant="outline" className="text-[9px] font-bold border-zinc-200 dark:border-white/10">{item.category}</Badge>
                                                            <span className="text-[10px] font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">READ MORE →</span>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-12 text-center">
                                        <Button variant="outline" className="rounded-full px-8 font-bold border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5">
                                            전체 뉴스 더보기
                                        </Button>
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="myAssets">
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                    <div className="mb-4 text-4xl">🔒</div>
                                    <h3 className="mb-2 text-xl font-bold text-foreground">로그인이 필요한 기능입니다</h3>
                                    <p className="mb-6 text-muted-foreground">
                                        보유한 자산에 대한 맞춤형 뉴스와 인사이트를 받아보세요
                                    </p>
                                    <Button asChild>
                                        <Link href="/login">로그인하고 계속하기</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            {/* News Detail Modal */}
            <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950">
                    {selectedNews && (
                        <>
                            <DialogHeader className="p-6 pb-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="px-2 py-0 text-[10px] h-5">{selectedNews.category}</Badge>
                                    <span className="text-xs text-muted-foreground">{selectedNews.time} · {selectedNews.source}</span>
                                </div>
                                <DialogTitle className="text-xl md:text-2xl font-bold leading-tight">
                                    {selectedNews.title}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 px-6 py-4 overflow-y-auto max-h-[55vh]">
                                <div className="text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap py-2 text-base font-medium">
                                    {selectedNews.content || selectedNews.summary || "내용이 없습니다."}
                                </div>
                            </div>
                            <DialogFooter className="p-6 pt-2 border-t flex flex-row items-center justify-between gap-4">
                                <div className="text-xs text-muted-foreground hidden sm:block">
                                    {selectedNews.source} 기사
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button variant="outline" className="flex-1 sm:flex-initial" onClick={() => setSelectedNews(null)}>닫기</Button>
                                    {selectedNews.url && (
                                        <Button asChild className="flex-1 sm:flex-initial">
                                            <a href={selectedNews.url} target="_blank" rel="noopener noreferrer">
                                                원본 기사 보기
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
