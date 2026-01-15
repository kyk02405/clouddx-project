import CoinList from "@/components/CoinList";
import KeywordBlocks from "@/components/KeywordBlocks";

export default function Home() {
  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Coin List */}
        <div className="lg:col-span-2">
          <CoinList />
        </div>

        {/* Right Sidebar - Keyword Blocks */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <KeywordBlocks />
          </div>
        </div>
      </div>
    </div>
  );
}
