"use client";

import { useState } from "react";
import AdvancedChart from "@/components/AdvancedChart";
import ChartSidebar from "@/components/ChartSidebar";
import { Asset, allAssets } from "@/lib/mock-data";

export default function ChartPage() {
    const [selectedAsset, setSelectedAsset] = useState<Asset>(allAssets[0]);

    return (
         <div className="flex flex-col md:flex-row flex-1 h-full w-full overflow-hidden">
             {/* Main Chart */}
             <main className="flex-1 relative border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 min-h-[400px] md:min-h-0">
                 <AdvancedChart selectedAsset={selectedAsset} />
             </main>
 
             {/* Sidebar (Bottom on mobile, Right on desktop) */}
             <aside className="w-full md:w-80 h-[300px] md:h-full shrink-0 bg-white dark:bg-zinc-950 border-t md:border-t-0 border-zinc-200 dark:border-zinc-800">
                 <ChartSidebar onSelectAsset={setSelectedAsset} currentAsset={selectedAsset} />
             </aside>
         </div>
    );
}
