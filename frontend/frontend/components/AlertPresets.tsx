"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export default function AlertPresets() {
    const { user } = useAuth();
    const [isHovered, setIsHovered] = useState(false);
    const [isAutoActive, setIsAutoActive] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsAutoActive(true);
            setTimeout(() => setIsAutoActive(false), 1500);
        }, 4500);
        return () => clearInterval(interval);
    });

    const isActive = isHovered || isAutoActive;

    return (
        <section className="relative overflow-hidden pt-16 pb-6 sm:pt-20 sm:pb-8">
            <div className="pointer-events-none absolute inset-0 bg-background">
                <div className="absolute right-[-10%] top-[-20%] h-[80%] w-[80%] rounded-full bg-violet-600/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] h-[80%] w-[80%] rounded-full bg-cyan-500/10 blur-[120px]" />
                <div className="absolute left-[20%] top-[40%] h-[40%] w-[40%] rounded-full bg-indigo-500/10 blur-[100px]" />
            </div>

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-10">
                    <div className="relative order-1 flex justify-center md:justify-end">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-zinc-100/50 via-transparent to-transparent opacity-50 blur-2xl dark:from-zinc-900/50" />

                        <div className="relative flex w-full max-w-[360px] flex-col items-center gap-4 md:items-end">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="z-10 flex w-full transform items-center gap-4 rounded-2xl border border-white/20 bg-white/90 p-4 pr-6 shadow-2xl transition-transform duration-500 hover:scale-105 dark:border-white/5 dark:bg-zinc-900/90"
                            >
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 shadow-inner dark:bg-violet-900/30">
                                    <span className="text-xl">🔔</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-sm font-bold text-foreground">Tutum</span>
                                        <span className="text-[11px] text-zinc-400">방금 전</span>
                                    </div>
                                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                                        <span className="font-bold text-foreground">삼성전자</span> 3.5% 급등, 목표가 도달
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex w-[90%] scale-95 items-center gap-4 rounded-2xl border border-white/20 bg-white/70 p-4 pr-6 opacity-80 shadow-lg backdrop-blur-md dark:border-white/5 dark:bg-zinc-900/70 md:mr-4"
                            >
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-100 shadow-inner dark:bg-cyan-900/30">
                                    <span className="text-xl">📰</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-sm font-bold text-foreground">News</span>
                                        <span className="text-[11px] text-zinc-400">10분 전</span>
                                    </div>
                                    <p className="truncate text-sm font-medium text-zinc-600 dark:text-zinc-300">
                                        보유 중인 <span className="font-bold text-foreground">BTC</span> 관련 중요 속보
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    <div className="order-2 flex flex-col items-center text-center md:items-start md:text-left">
                        <h2 className="mb-4 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                            중요한 타이밍,<br />
                            <span className="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">절대 놓치지 마세요.</span>
                        </h2>
                        <p className="mx-auto mb-6 max-w-md text-lg leading-relaxed text-muted-foreground md:mx-0">
                            시장의 변동까지 먼저 알려드립니다.<br />
                            앱 푸시, 문자, 이메일 등 원하는 방식으로<br />
                            세밀한 자산 변동 알림을 받아보세요.
                        </p>

                        <div className="flex flex-col items-center gap-4 md:flex-row md:items-end md:gap-2 md:self-start">
                            <div
                                className="group relative inline-flex cursor-pointer"
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                            >
                                <Link href={user ? "/portfolio/asset" : "/login"} className="absolute inset-0 z-10" />
                                <div
                                    className={`
                                        flex items-center gap-5 rounded-full border-2 py-2.5 pl-2 pr-8 transition-all duration-500
                                        ${isActive ? 'scale-105 border-violet-500 bg-violet-500/5 pr-10 shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]' : 'border-zinc-200 bg-white/50 hover:scale-105 dark:border-zinc-800 dark:bg-zinc-900/50'}
                                    `}
                                >
                                    <div
                                        className={`
                                            flex h-14 w-14 items-center justify-center rounded-full shadow-sm transition-all duration-500
                                            ${isActive ? 'translate-x-1 rotate-12 bg-violet-500 text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-violet-500 group-hover:text-white dark:bg-zinc-800'}
                                        `}
                                    >
                                        <Bell className={`h-6 w-6 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:rotate-12'}`} />
                                    </div>
                                    <div className="text-left">
                                        <div className={`text-lg font-bold transition-colors duration-300 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-600 group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-400'}`}>
                                            {user ? "알림 설정 관리" : "알림 켜기"}
                                        </div>
                                        <div className="text-xs font-medium text-zinc-400">
                                            {user ? "실시간 자산 변동 알림" : "로그인이 필요합니다"}
                                        </div>
                                    </div>
                                    <ChevronRight className={`h-5 w-5 text-zinc-300 transition-all duration-500 ${isActive ? 'translate-x-2 text-violet-500 opacity-100' : '-translate-x-4 opacity-0 group-hover:translate-x-2 group-hover:text-violet-500 group-hover:opacity-100'}`} />
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.25 }}
                                className="w-full max-w-[90px] self-center md:ml-2 md:max-w-[112px] md:self-end"
                            >
                                <Image
                                    src="/images/tutum-character-ai-body.png"
                                    alt="Tutum AI character"
                                    width={600}
                                    height={700}
                                    className="pointer-events-none h-auto w-full select-none object-contain opacity-95 [filter:saturate(0.9)_contrast(1.02)] dark:opacity-90 dark:[filter:saturate(0.82)_contrast(1.08)]"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
