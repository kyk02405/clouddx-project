import TopNav from "@/components/TopNav";
import Hero from "@/components/Hero";
import HeroCarousel from "@/components/HeroCarousel";
import ScrollRevealSection from "@/components/ScrollRevealSection";
import QuickStatsBar from "@/components/QuickStatsBar";
import MarketSnapshot from "@/components/MarketSnapshot";
import WatchlistPreview from "@/components/WatchlistPreview";
import NewsSection from "@/components/NewsSection";
import FeaturesSection from "@/components/FeaturesSection";
import AlertPresets from "@/components/AlertPresets";
import InsightPreview from "@/components/InsightPreview";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav />
      {/* Prototype Hero Carousel */}
      <HeroCarousel />
      
      {/* Existing Hero kept for comparison as requested */}
      <div className="border-t-4 border-dashed border-zinc-100 dark:border-zinc-900 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-100 dark:bg-zinc-900 px-4 py-1 rounded-full text-[10px] font-bold text-zinc-400 z-50">ORIGINAL VERSION BELOW</div>
          <Hero />
      </div>
      
      <ScrollRevealSection />
      <InsightPreview />
      
      <QuickStatsBar />
      <MarketSnapshot />
      <WatchlistPreview />
      <AlertPresets />
      
      <NewsSection />
      <Footer />
      <ScrollToTop />
    </div>
  );
}
