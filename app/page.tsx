import TopNav from "../components/TopNav";
import Hero from "../components/Hero";
import QuickStatsBar from "../components/QuickStatsBar";
import MarketSnapshot from "../components/MarketSnapshot";
import WatchlistPreview from "../components/WatchlistPreview";
import NewsSection from "../components/NewsSection";
import InsightPreview from "../components/InsightPreview";
import AlertPresets from "../components/AlertPresets";
import FeaturesSection from "../components/FeaturesSection";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      <TopNav />
      <Hero />
      <QuickStatsBar />
      <MarketSnapshot />
      <WatchlistPreview />
      <NewsSection />
      <InsightPreview />
      <AlertPresets />
      <FeaturesSection />
      <Footer />
    </div>
  );
}
