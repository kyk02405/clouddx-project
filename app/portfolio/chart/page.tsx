"use client";

import AdvancedChart from "@/components/AdvancedChart";
import ChartSidebar from "@/components/ChartSidebar";

export default function ChartPage() {
    return (
        <div className="flex flex-1 h-full w-full overflow-hidden">
            {/* Main Chart */}
            <main className="flex-1 relative border-r border-zinc-800">
                <AdvancedChart />
            </main>

            {/* Right Sidebar */}
            <aside className="w-80 shrink-0 bg-zinc-950">
                <ChartSidebar />
            </aside>
        </div>
    );
}
