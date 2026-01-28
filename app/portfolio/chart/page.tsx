"use client";

import { useState } from "react";
import AdvancedChart from "@/components/AdvancedChart";
import ChartSidebar from "@/components/ChartSidebar";
import { Asset, allAssets } from "@/lib/mock-data";

export default function ChartPage() {
    const [selectedAsset, setSelectedAsset] = useState<Asset>(allAssets[0]);

    return (
        <div className="flex flex-1 h-full w-full overflow-hidden">
            {/* Main Chart */}
            <main className="flex-1 relative border-r border-zinc-200 dark:border-zinc-800">
                <AdvancedChart selectedAsset={selectedAsset} />
            </main>

            {/* Right Sidebar */}
            <aside className="w-80 shrink-0 bg-white dark:bg-zinc-950">
                <ChartSidebar onSelectAsset={setSelectedAsset} currentAsset={selectedAsset} />
            </aside>
        </div>
    );
}
