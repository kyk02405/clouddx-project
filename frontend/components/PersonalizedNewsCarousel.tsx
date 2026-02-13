import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Newspaper, ExternalLink } from "lucide-react";

interface News {
    id: string;
    title: string;
    content: string;
    published_at: string;
    section: string;
    source: string;
    url?: string;
}

interface PersonalizedNewsCarouselProps {
    keywords: string[];
}

export default function PersonalizedNewsCarousel({ keywords }: PersonalizedNewsCarouselProps) {
    const [news, setNews] = useState<News[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedNews, setSelectedNews] = useState<News | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                // 1. Try targeted news (assets)
                let query = keywords.slice(0, 2).join(" ");
                if (!query) query = "경제"; 
                
                const res = await fetch(`/api/proxy/api/v1/news?query=${encodeURIComponent(query)}&limit=6`);
                const result = await res.json();
                
                if (result.items && result.items.length > 0) {
                    setNews(result.items);
                } else {
                    // 2. Try generic news if targeted fails
                    const fallbackRes = await fetch(`/api/proxy/api/v1/news?limit=6`);
                    const fallbackResult = await fallbackRes.json();
                    setNews(fallbackResult.items || []);
                }
            } catch (e) {
                console.error("Failed to fetch personalized news", e);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [keywords]);

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    if (!loading && news.length === 0) {
        return (
            <div className="p-12 text-center bg-muted/30 rounded-2xl border border-dashed border-border">
                <p className="text-muted-foreground font-medium">당신의 보유 자산과 관련된 최근 뉴스가 없습니다.</p>
            </div>
        );
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                        <Newspaper className="h-4 w-4" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">사용자 자산 기준 추천 뉴스</h3>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full border border-border bg-background"
                        onClick={() => scroll("left")}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full border border-border bg-background"
                        onClick={() => scroll("right")}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="relative group">
                <div 
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
                >
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="min-w-[300px] md:min-w-[450px] snap-start">
                                <Card className="border-border bg-card shadow-none">
                                    <CardContent className="p-5 space-y-4">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-6 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <div className="flex justify-between">
                                            <Skeleton className="h-3 w-16" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))
                    ) : (
                        news.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedNews(item)}
                                className="min-w-[300px] md:min-w-[450px] snap-start cursor-pointer hover:translate-y-[-4px] transition-transform duration-300"
                            >
                                <Card className="border-border bg-card hover:bg-accent/50 h-full flex flex-col shadow-sm">
                                    <CardContent className="p-5 flex flex-col h-full">
                                        <div className="mb-3 flex items-center justify-between">
                                            <Badge variant="secondary" className="bg-muted text-muted-foreground border-none px-2 py-0 text-[10px]">
                                                {item.section}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {new Date(item.published_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="mb-3 text-base font-bold text-foreground leading-snug line-clamp-2">
                                            {item.title}
                                        </h4>
                                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                                                {item.source}
                                            </span>
                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1 hover:bg-primary/10">
                                                <span>Read More</span>
                                                <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* News Detail Dialog */}
            <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background rounded-2xl border-border shadow-2xl">
                    {selectedNews && (
                        <>
                            <DialogHeader className="p-8 pb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="outline" className="px-2 py-0 text-[10px] h-5 border-primary/30 text-primary">{selectedNews.section}</Badge>
                                    <span className="text-xs text-muted-foreground font-medium">{new Date(selectedNews.published_at).toLocaleString()}</span>
                                </div>
                                <DialogTitle className="text-2xl md:text-3xl font-black leading-tight text-foreground">
                                    {selectedNews.title}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 px-8 py-4 overflow-y-auto border-t border-b border-border">
                                <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap py-2 text-lg font-medium">
                                    {selectedNews.content || "상세 내역을 불러올 수 없습니다."}
                                </div>
                            </div>
                            <DialogFooter className="p-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold">
                                    <span className="px-2 py-1 bg-muted rounded">{selectedNews.source}</span>
                                    <span>Press Release</span>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <Button variant="outline" className="flex-1 sm:flex-initial rounded-xl font-bold h-12" onClick={() => setSelectedNews(null)}>닫기</Button>
                                    {selectedNews.url && (
                                        <Button asChild className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold h-12 gap-2">
                                            <a href={selectedNews.url} target="_blank" rel="noopener noreferrer">
                                                원본 보기
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
}
