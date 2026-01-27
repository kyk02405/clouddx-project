"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Sparkline from "./Sparkline";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { useRef } from "react";
=======
import { useRef } from "react"; // Keep original useRef import
import Link from "next/link";
>>>>>>> test/kyk

interface Asset {
    name: string;
    symbol: string;
    price: number;
    change: number;
    market?: string; // Keep original market property
    history: number[]; // Keep original history property
    changePercent: number; // Added
    data: { value: number; date: string }[]; // Added
}

interface WatchlistData {
    crypto: Asset[];
    stocks: Asset[];
}

export default function WatchlistPreview() {
    const [data, setData] = useState<WatchlistData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                // In a real app, strict mode might cause double fetch, but that's fine
                const { mockWatchlist } = await import("@/lib/mockAssets");
                setData(mockWatchlist);
            } catch (error) {
                console.error("Failed to load watchlist:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const AssetCard = ({ asset, rank }: { asset: Asset; rank: number }) => {
        const isPositive = asset.change >= 0;

        return (
            <div className="flex w-[280px] shrink-0 flex-col justify-between rounded-xl bg-card p-6 transition-all hover:bg-accent/50 select-none">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                    <span className="text-lg font-medium text-muted-foreground">{rank}</span>
                    <Sparkline
                        data={asset.data}
                        color={isPositive ? '#ef4444' : '#3b82f6'}
                        width={120}
                        height={40}
                    />
                </div>

                {/* Asset Info */}
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        {/* Logo Placeholder */}
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                            {asset.symbol.substring(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{asset.name}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-foreground">
                            {asset.symbol === 'BTC' || asset.symbol === 'ETH'
                                ? `₩${asset.price.toLocaleString()}`
                                : `$${asset.price.toLocaleString()}`}
                        </span>
                        <span className={`text-sm font-medium ${isPositive ? 'text-red-500' : 'text-blue-500'}`}>
                            {isPositive ? '+' : ''}{asset.changePercent}%
                        </span>
                    </div>
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
<<<<<<< HEAD

=======
        const [showLeftArrow, setShowLeftArrow] = useState(false);
        const [showRightArrow, setShowRightArrow] = useState(true);

        const checkScrollButtons = () => {
            if (!ref.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = ref.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
        };

        useEffect(() => {
            checkScrollButtons();
            window.addEventListener('resize', checkScrollButtons);
            return () => window.removeEventListener('resize', checkScrollButtons);
        }, [ref.current]);

>>>>>>> test/kyk
        const onMouseDown = (e: React.MouseEvent) => {
            if (!ref.current) return;
            setIsDragging(true);
            setStartX(e.pageX - ref.current.offsetLeft);
<<<<<<< HEAD
            setScrollLeft(ref.current.scrollLeft);
=======
            setScrollLeft(ref.current.scrollLeft); // Original line, kept
>>>>>>> test/kyk
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
<<<<<<< HEAD
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
=======
            checkScrollButtons();
        };

        const scrollBy = (offset: number) => {
            if (ref.current) {
                ref.current.scrollBy({ left: offset, behavior: 'smooth' });
                setTimeout(checkScrollButtons, 300); // Check after animation
            }
        };

        return {
            ref,
            isDragging,
            showLeftArrow,
            showRightArrow,
            scrollBy,
            checkScrollButtons, // Exported to use in onScroll
            events: { onMouseDown, onMouseLeave, onMouseUp, onMouseMove }
        };
    };

    const LoginCard = () => (
        <div className="flex w-[280px] shrink-0 flex-col items-center justify-center rounded-xl bg-gray-900 p-6 text-center border border-gray-800 select-none">
            <p className="mb-6 text-sm font-medium text-gray-300">
                로그인하고 더 많은 트렌딩 종목을 확인하세요
            </p>
            <Button asChild variant="outline" className="w-full rounded-full border-gray-700 bg-black text-white hover:bg-gray-800">
                <Link href="/login">로그인하기</Link>
>>>>>>> test/kyk
            </Button>
        </div>
    );

    const Section = ({ title, assets }: { title: string; assets: Asset[] }) => {
<<<<<<< HEAD
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
=======
        const { ref, isDragging, showLeftArrow, showRightArrow, scrollBy, checkScrollButtons, events } = useDragScroll();

        return (
            <div className="mb-12 relative group">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground">{title}</h3>
                </div>

                {/* Left Arrow */}
                {showLeftArrow && (
                    <button
                        onClick={() => scrollBy(-300)}
                        className="absolute left-0 top-[60%] z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white/80 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 disabled:opacity-0"
                    >
                        <ChevronLeft className="h-6 w-6 text-gray-900" />
                    </button>
                )}

                {/* Right Arrow */}
                {showRightArrow && (
                    <button
                        onClick={() => scrollBy(300)}
                        className="absolute right-0 top-[60%] z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white/80 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 disabled:opacity-0"
                    >
                        <ChevronRight className="h-6 w-6 text-gray-900" />
                    </button>
                )}

                <div
                    ref={ref}
                    {...events}
                    onScroll={checkScrollButtons}
                    className={`flex w-full space-x-8 overflow-x-auto pb-4 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{ scrollBehavior: 'auto' }}
                >
                    {assets.map((asset, i) => (
                        <div key={asset.symbol} className="pointer-events-none" onMouseDown={(e) => e.stopPropagation()}>
>>>>>>> test/kyk
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
