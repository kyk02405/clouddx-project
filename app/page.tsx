import CoinList from "../components/CoinList";
import KeywordBlocks from "../components/KeywordBlocks";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main Price List */}
        <div className="lg:col-span-8">
          <CoinList />
        </div>

        {/* Categories / Keywords */}
        <div className="lg:col-span-4">
          <KeywordBlocks />
        </div>
      </div>
    </div>
  );
}
