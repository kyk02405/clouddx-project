"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
    return (
        <div className="relative isolate overflow-hidden bg-white">
            <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
                <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
                    <h1 className="mt-10 text-4xl font-bold tracking-tight text-black sm:text-6xl">
                        AI로 내 자산을<br />
                        한눈에 관리하세요
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        암호화폐와 주식, 하나의 플랫폼에서 - CSV/OCR 업로드부터 실시간 시세, 뉴스, AI 인사이트까지
                    </p>

                    <div className="mt-10 flex items-center gap-x-6">
                        <Button asChild size="lg" className="h-12 px-8 text-base bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg transition-all">
                            <Link href="/login">Tutum 시작하기</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
