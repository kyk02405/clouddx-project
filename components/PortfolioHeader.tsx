"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bell, Settings, User, LayoutDashboard, LineChart, Sun, Moon, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function PortfolioHeader() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 sticky top-0 z-50">
            <div className="flex items-center gap-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center">
                        <LineChart className="h-5 w-5 text-white dark:text-black" />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-zinc-900 dark:text-white">Tutum</span>
                </Link>

                {/* Main Navigation */}
                <nav className="flex items-center gap-1">
                    <Link href="/portfolio/chart">
                        <Button
                            variant="ghost"
                            className={cn(
                                "gap-2 text-base font-medium h-9 px-4",
                                pathname.startsWith('/portfolio/chart')
                                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                            )}
                        >
                            <LineChart className="h-4 w-4" />
                            차트
                        </Button>
                    </Link>
                    <Link href="/portfolio/asset">
                        <Button
                            variant="ghost"
                            className={cn(
                                "gap-2 text-base font-medium h-9 px-4",
                                pathname.startsWith('/portfolio/asset')
                                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                            )}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            자산
                        </Button>
                    </Link>
                </nav>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
                <div className="relative hidden md:flex items-center">
                    <Search className="absolute left-3 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="주식, 코인, 지수 검색"
                        className="bg-zinc-100 dark:bg-zinc-900 border-none rounded-full pl-9 pr-12 py-2 text-sm w-80 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 transition-all"
                    />
                    <div className="absolute right-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono shadow-sm">
                        Ctrl K
                    </div>
                </div>

                <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-2 hidden md:block" />

                <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
                </Button>

                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors",
                            isMenuOpen && "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        )}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <Settings className="h-5 w-5" />
                    </Button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-2 space-y-1">
                                <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    환경 설정
                                </div>
                                <button
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
                                    onClick={() => {
                                        setTheme(theme === "dark" ? "light" : "dark");
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white">
                                        {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                        <span>화면 모드 변경</span>
                                    </div>
                                    <span className="text-xs text-zinc-400 font-medium">
                                        {mounted && theme === "dark" ? "라이트" : "다크"}
                                    </span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                    <Settings className="h-4 w-4" />
                                    <span>일반 설정</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center font-bold text-sm text-white dark:text-zinc-900 ml-2 cursor-pointer hover:opacity-90 transition-opacity shadow-sm overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all">
                    <User className="h-5 w-5" />
                </div>
            </div>

            {/* Overlay to close menu */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}
        </header>
    );
}
