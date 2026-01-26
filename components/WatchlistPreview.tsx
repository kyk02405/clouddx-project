"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import Sparkline from "./Sparkline";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface Asset {
    name: string;
    symbol: string;
    price: number;
    change: number;
    market?: string;
    history: number[];
}

interface WatchlistData {
    crypto: Asset[];
    stocks: Asset[];
}

export default function WatchlistPreview() {
    const [data, setData] = useState<WatchlistData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/public/watchlist")
            .then((res) => res.json())
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch watchlist:", err);
                setLoading(false);
            });
    }, []);

    const AssetCard = ({ asset, rank }: { asset: Asset; rank: number }) => {
        const isPositive = asset.change >= 0;

        return (
            <div className="w-[280px] shrink-0">
                <div className="mb-2 text-sm text-muted-foreground font-medium">{rank}</div>

                {/* Sparkline Chart */}
                <div className="mb-3 h-[60px] w-full">
                    <Sparkline
                        data={asset.history}
                        isPositive={isPositive}
                        currency={asset.market === 'KR' ? '₩' : '$'}
                    />
                </div>

                {/* Asset Info */}
                <div className="flex items-center gap-2 mb-1">
                    {/* Logo */}
                    <Avatar className="h-5 w-5">
                        <AvatarImage
                            src={`https://logo.clearbit.com/${asset.symbol.toLowerCase()}.com`}
                            alt={asset.name}
                        />
                        <AvatarFallback className="text-[10px]">{asset.symbol.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm text-foreground">{asset.name}</span>
                </div>

                {/* Price & Change */}
                <div className="flex items-end gap-2 text-sm">
                    <span className="font-bold text-foreground">
                        {asset.market === 'KR'
                            ? `₩${asset.price.toLocaleString()}`
                            : `$${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        }
                    </span>
                    <span className={isPositive ? "text-red-500" : "text-blue-500"}>
                        {isPositive ? "+" : ""}{asset.change.toFixed(2)}%
                    </span>
                </div>
            </div>
        );
    };

    // Drag to scroll logic
    const useDragScroll = () => {
        const ref = useRef<HTMLDivElement>(null);
        const [isDragging, setIsDragging] = useState(false);
        const [startX, setStartX] = useState(0);
        const [scrollLeft, setScrollLeft] = useState(0);

        const onMouseDown = (e: React.MouseEvent) => {
            if (!ref.current) return;
            setIsDragging(true);
            setStartX(e.pageX - ref.current.offsetLeft);
            setScrollLeft(ref.current.scrollLeft);
        };

        const onMouseLeave = () => {
            setIsDragging(false);
        };

        const onMouseUp = () => {
            setIsDragging(false);
        };

        const onMouseMove = (e: React.MouseEvent) => {
            if (!isDragging || !ref.current) return;
            e.preventDefault();
            const x = e.pageX - ref.current.offsetLeft;
            const walk = (x - startX) * 1.5; // Scroll speed multiplier
            ref.current.scrollLeft = scrollLeft - walk;
        };

        return { ref, isDragging, events: { onMouseDown, onMouseLeave, onMouseUp, onMouseMove } };
    };

    const LoginCard = () => (
        <div className="flex w-[280px] shrink-0 flex-col items-center justify-center rounded-xl bg-gray-100 p-6 text-center dark:bg-zinc-900">
            <p className="mb-6 text-sm font-medium text-gray-600 dark:text-gray-300">
                로그인하고 더 많은 트렌딩 종목을 확인하세요
            </p>
            <Button variant="outline" className="w-full rounded-full border-gray-300 bg-white text-black hover:bg-gray-50 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-zinc-900">
                로그인하기
            </Button>
        </div>
    );

    const Section = ({ title, assets }: { title: string; assets: Asset[] }) => {
        const { ref, isDragging, events } = useDragScroll();

        return (
            <div className="mb-12">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground">{title}</h3>
                    <div className="flex gap-2">
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>

                <div
                    ref={ref}
                    {...events}
                    className={`flex w-full space-x-8 overflow-x-auto pb-4 scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{ scrollBehavior: 'auto' }} // Disable smooth scroll during drag
                >
                    {assets.map((asset, i) => (
                        <div key={asset.symbol} className="pointer-events-none" onMouseDown={(e) => e.stopPropagation()}>
                            {/* Wrap with pointer-events-none during drag if needed, or handle click vs drag */}
                            <div className="pointer-events-auto">
                                <AssetCard asset={asset} rank={i + 1} />
                            </div>
                        </div>
                    ))}
                    <LoginCard />
                </div>
            </div>
        );
    };

    if (loading || !data) {
        return (
            <section className="bg-background px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="animate-pulse space-y-8">
                        <div className="h-8 w-48 bg-muted rounded"></div>
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-40 bg-muted rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="market" className="bg-background px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <h2 className="mb-10 text-3xl font-bold text-foreground">주식 & 코인 TOP 10</h2>

                <Section title="주식" assets={data.stocks} />
                <Section title="코인" assets={data.crypto} />
            </div>
        </section>
    );
}
