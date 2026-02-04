"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Hero() {
    return (
        <div className="relative isolate bg-white dark:bg-zinc-950 flex flex-col items-center justify-center h-[600px] sm:h-[700px] lg:h-[800px] w-full overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-20 text-center">
                <div className="mx-auto max-w-2xl">
                    <div className="mb-10 flex justify-center">
                        <Link href="/docs" className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold tracking-[0.15em] text-zinc-400 dark:text-zinc-300 border border-emerald-500/30 bg-zinc-900/80 dark:bg-black/80 backdrop-blur-xl shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)] hover:border-emerald-500/50 hover:shadow-[0_0_20px_-3px_rgba(16,185,129,0.3)] transition-all uppercase">
                            <span className="flex h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                            <span>v2.0 OCR ENGINE UPDATE</span>
                        </Link>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl lg:text-7xl leading-[1.15]">
                        흩어진 나의 자산,<br />
                        <span className="text-emerald-500 font-extrabold">tutum</span>에서 한눈에.
                    </h1>
                    
                    <p className="mt-8 text-lg sm:text-xl leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium max-w-xl mx-auto">
                        복잡한 내역도 사진 한 장이면 충분합니다.<br className="hidden sm:block" />
                        AI로 정교하게 분석하고 관리하는 스마트 자산 리포트.
                    </p>
                    
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                        <Button asChild size="lg" className="h-14 px-8 text-base font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-all shadow-lg rounded-full border-none w-full sm:w-auto">
                            <Link href="/login">지금 시작하기</Link>
                        </Button>
                        <Link href="/docs" className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1.5 py-2">
                            서비스 가이드 <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Premium Gradient Background Decor */}
            <div className="absolute inset-x-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl translate-y-1/2" aria-hidden="true">
                <div className="relative left-[calc(50%)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-t from-emerald-500/20 to-transparent opacity-20 sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
            </div>
        </div>
    );
}
