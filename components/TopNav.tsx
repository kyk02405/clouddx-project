"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";

import { useState, useEffect } from "react";

export default function TopNav() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Simple check for auth_token cookie
        const hasToken = document.cookie.split(';').some(c => c.trim().startsWith('auth_token='));
        setIsLoggedIn(hasToken);
    }, []);

    const navLinks = [
        { href: "#market", label: "시장" },
        { href: "#news", label: "뉴스" },
        { href: isLoggedIn ? "/portfolio" : "/login", label: isLoggedIn ? "나의 자산" : "로그인" },
        { href: "#features", label: "주요 기능" },
    ];

    return (
        <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <a href="/" className="text-2xl font-black text-black tracking-tighter hover:opacity-80 transition-opacity">
                            Tutum
                        </a>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="text-sm font-bold text-gray-500 hover:text-black transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                    {/* Desktop Buttons */}
                    <div className="hidden items-center gap-4 md:flex">
                        <ThemeToggle />
                        <Button
                            className="bg-black text-white hover:bg-gray-800 rounded-lg px-6 font-bold"
                            onClick={() => window.location.href = isLoggedIn ? '/portfolio' : '/login'}
                        >
                            {isLoggedIn ? "나의 자산" : "로그인"}
                        </Button>
                    </div>

                    {/* Mobile Menu */}
                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeToggle />
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">메뉴 열기</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] p-0">
                                <SheetHeader className="p-6 border-b">
                                    <SheetTitle className="font-black text-2xl">
                                        Tutum
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="mt-6 flex flex-col gap-1 px-2">
                                    {navLinks.map((link) => (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            className="text-lg font-bold text-gray-600 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                    <Separator className="my-4 mx-4" />
                                    <div className="px-4 flex flex-col gap-2">
                                        <Button
                                            className="w-full bg-black text-white font-bold h-12 rounded-xl"
                                            onClick={() => window.location.href = isLoggedIn ? '/portfolio' : '/login'}
                                        >
                                            {isLoggedIn ? "나의 자산 보기" : "로그인하기"}
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    );
}
