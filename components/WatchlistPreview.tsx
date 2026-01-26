"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import Sparkline from "./Sparkline";

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
                    <span className={isPositive ? "text-green-500" : "text-red-500"}>
                        {isPositive ? "+" : ""}{asset.change.toFixed(2)}%
                    </span>
                </div>
            </div>
        );
    };

    const Section = ({ title, assets }: { title: string; assets: Asset[] }) => (
        <div className="mb-12">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">{title}</h3>
                <button className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    더보기 <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-8 pb-4">
                    {assets.map((asset, i) => (
                        <AssetCard key={asset.symbol} asset={asset} rank={i + 1} />
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );

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
