import TopNav from "@/components/TopNav";
import Hero from "@/components/Hero";
import QuickStatsBar from "@/components/QuickStatsBar";
import MarketSnapshot from "@/components/MarketSnapshot";
import WatchlistPreview from "@/components/WatchlistPreview";
import NewsSection from "@/components/NewsSection";
import FeaturesSection from "@/components/FeaturesSection";
import AlertPresets from "@/components/AlertPresets";
import InsightPreview from "@/components/InsightPreview";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <Hero />
      <QuickStatsBar />
      <MarketSnapshot />
      <WatchlistPreview />
      <NewsSection />
      <InsightPreview />
      <FeaturesSection />
      <AlertPresets />
      <Footer />
    </div>
  );
}
