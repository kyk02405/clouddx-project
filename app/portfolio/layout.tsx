"use client";

import PortfolioHeader from "@/components/PortfolioHeader";

export default function PortfolioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
            <PortfolioHeader />
            <div className="flex-1 overflow-hidden relative w-full h-full">
                {children}
            </div>
        </div>
    );
}
