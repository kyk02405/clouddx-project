"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import TopNav from "@/components/TopNav";
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
  const { user } = useAuth();
  const router = useRouter();

  // Landing page is now accessible even when logged in.
  // We remove the automatic redirect to allow users to see the landing content if they choose.
  // Navigation to the portfolio is handled via the TopNav and Header components.

  return (
    <div className="relative min-h-screen bg-background">
      <TopNav />
      <main>
        <HeroCarousel />
        <ScrollRevealSection />
        <InsightPreview />
        <QuickStatsBar />
        <MarketSnapshot />
        <WatchlistPreview />
        <AlertPresets />
        <NewsSection />
        <Footer />
        <ScrollToTop />
      </main>
    </div>
  );
}
