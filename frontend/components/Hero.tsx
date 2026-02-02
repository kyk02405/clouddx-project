"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
    return (
        <div className="relative isolate bg-white dark:bg-zinc-950 flex flex-col items-center justify-center h-[600px] sm:h-[700px] lg:h-[800px] w-full overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-20 text-center">
                <div className="mx-auto max-w-2xl">
                    <div className="mb-8 flex justify-center">
                        <a href="#" className="relative rounded-full px-4 py-1.5 text-xs font-bold leading-6 text-zinc-600 dark:text-zinc-400 ring-1 ring-zinc-900/10 dark:ring-white/10 hover:ring-zinc-900/20 dark:hover:ring-white/20 transition-all bg-zinc-50/50 dark:bg-zinc-900/50">
                            v2.0 OCR 엔진 업데이트 <span className="text-emerald-500 ml-1">상세 보기 →</span>
                        </a>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
                        내 자산, <span className="text-emerald-500">Tutum</span>에서 정리 끝.
                    </h1>
                    <p className="mt-6 text-base sm:text-xl leading-8 text-zinc-600 dark:text-zinc-400 font-medium">
                        사진 한 장이면 등록부터 인사이트까지 한 번에.
                    </p>
                    <div className="mt-12 flex items-center justify-center gap-x-6">
                        <Button asChild size="lg" className="h-16 px-10 text-xl font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 transition-all shadow-2xl rounded-2xl">
                            <Link href="/login">Tutum 시작하기</Link>
                        </Button>
                        <Link href="/docs" className="text-sm font-bold leading-6 text-zinc-900 dark:text-zinc-100 flex items-center gap-1 group">
                            서비스 둘러보기 <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Clean Bottom-up Gradient Decor (Reverted from Lottie) */}
            <div className="absolute inset-x-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl translate-y-1/2" aria-hidden="true">
                <div className="relative left-[calc(50%)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-t from-[#10b981] to-transparent opacity-40 sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
            </div>
        </div>
    );
}
