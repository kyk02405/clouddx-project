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

  // 로그인 상태면 포트폴리오로 리다이렉트 (히스토리에서 홈 제거)
  useEffect(() => {
    if (user) {
      router.replace("/portfolio/asset");
    }
  }, [user, router]);

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
