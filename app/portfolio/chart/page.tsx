"use client";

import AdvancedChart from "@/components/AdvancedChart";
import ChartSidebar from "@/components/ChartSidebar";
import PortfolioHeader from "@/components/PortfolioHeader";

export default function ChartPage() {
    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
            <PortfolioHeader />

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Main Chart */}
                <main className="flex-1 relative border-r border-zinc-800">
                    <AdvancedChart />
                </main>

                {/* Right Sidebar */}
                <aside className="w-80 shrink-0 bg-zinc-950">
                    <ChartSidebar />
                </aside>
            </div>
        </div>
    );
}
