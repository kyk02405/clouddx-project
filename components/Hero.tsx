"use client";

import { Button } from "@/components/ui/button";

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-background px-4 py-20 sm:px-6 lg:px-8">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted via-transparent to-transparent"></div>

            <div className="relative mx-auto max-w-4xl text-center">
                <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                    AI로 내 자산을
                    <br />
                    <span className="font-black">
                        한눈에 관리하세요
                    </span>
                </h1>

                <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
                    암호화폐와 주식, 하나의 플랫폼에서 - CSV/OCR 업로드부터 실시간 시세, 뉴스, AI 인사이트까지
                </p>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Button size="lg" className="w-full text-lg sm:w-auto">
                        시작하기
                    </Button>
                    <Button variant="outline" size="lg" className="w-full text-lg sm:w-auto">
                        10초 체험하기
                    </Button>
                </div>
            </div>
        </section>
    );
}
