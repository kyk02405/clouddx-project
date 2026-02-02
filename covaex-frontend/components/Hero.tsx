"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
    return (
        <div className="relative isolate overflow-hidden bg-white dark:bg-zinc-950">
            <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
                <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
                    <div className="mt-24 sm:mt-32 lg:mt-16">
                        <a href="#" className="inline-flex space-x-6">
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold leading-6 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                                What's new
                            </span>
                            <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-zinc-600 dark:text-zinc-400">
                                <span>v2.0 OCR 엔진 업데이트</span>
                                <svg className="h-5 w-5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </a>
                    </div>
                    <h1 className="mt-10 text-4xl font-black italic tracking-tight text-zinc-900 dark:text-white sm:text-7xl">
                        내 자산,<br />
                        한 번에 <span className="text-emerald-500">정리 끝.</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400 font-medium">
                        사진 한 장으로 등록하고, 시장 흐름과 인사이트까지 확인하세요.
                    </p>

                    <div className="mt-10 flex items-center gap-x-6">
                        <Button asChild size="lg" className="h-14 px-8 text-lg font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 transition-all shadow-2xl">
                            <Link href="/login">Tutum 시작하기</Link>
                        </Button>
                        <Link href="/docs" className="text-sm font-bold leading-6 text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                            서비스 둘러보기 <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>

                {/* CLI Visual Overlay */}
                <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
                    <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                        <div className="rounded-2xl bg-zinc-900 p-2 ring-1 ring-inset ring-white/10 lg:-m-4 lg:rounded-2xl lg:p-4 shadow-2xl shadow-emerald-500/10">
                            <div className="rounded-xl bg-zinc-950 overflow-hidden border border-zinc-800 font-mono text-sm leading-6">
                                <div className="flex bg-zinc-900/50 px-4 py-2 border-b border-zinc-800 items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="h-3 w-3 rounded-full bg-red-500/50" />
                                        <div className="h-3 w-3 rounded-full bg-amber-500/50" />
                                        <div className="h-3 w-3 rounded-full bg-emerald-500/50" />
                                    </div>
                                    <div className="text-zinc-500 text-xs font-bold ml-2">Terminal — tutum</div>
                                </div>
                                <div className="p-6 space-y-2">
                                    <div className="flex gap-2">
                                        <span className="text-emerald-500 font-bold">$</span>
                                        <span className="text-zinc-100 animate-typing overflow-hidden whitespace-nowrap">tutum sync --source ocr</span>
                                    </div>
                                    <div className="text-zinc-500">Scanning assets from image...</div>
                                    <div className="space-y-1 pl-4 border-l-2 border-emerald-500/30">
                                        <div className="flex gap-3">
                                            <span className="text-emerald-500">✔</span>
                                            <span className="text-zinc-300">BTC</span>
                                            <span className="text-zinc-500 ml-auto">0.15</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="text-emerald-500">✔</span>
                                            <span className="text-zinc-300">TSLA</span>
                                            <span className="text-zinc-500 ml-auto">3</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="text-emerald-500">✔</span>
                                            <span className="text-zinc-300">CASH</span>
                                            <span className="text-zinc-500 ml-auto">₩1,200,000</span>
                                        </div>
                                    </div>
                                    <div className="text-zinc-100 font-bold pt-2">완료! 포트폴리오가 정리됐어요.</div>
                                    <div className="flex gap-2">
                                        <span className="text-zinc-100 font-bold">tutum</span>
                                        <span className="text-emerald-500">&gt;</span>
                                        <span className="w-2 h-5 bg-emerald-500 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
