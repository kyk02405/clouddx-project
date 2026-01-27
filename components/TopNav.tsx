"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu, Activity } from "lucide-react";

const navLinks = [
    { href: "#market", label: "시장" },
    { href: "#news", label: "뉴스" },
    { href: "#features", label: "주요 기능" },
];

export default function TopNav() {
    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <a href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                                <Activity className="h-5 w-5" />
                            </div>
                            <span className="text-2xl font-bold text-black hover:opacity-80 transition-opacity">Tutum</span>
                        </a>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="rounded-md px-3 py-2 text-base font-bold text-gray-700 hover:bg-gray-100 hover:text-black"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                    {/* Desktop Buttons */}
                    <div className="hidden items-center gap-2 md:flex text-black">
                        <ThemeToggle />
                        <Button asChild className="bg-black text-white hover:bg-gray-800">
                            <Link href="/login">로그인</Link>
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
                                    <SheetTitle>
                                        Tutum
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="mt-6 flex flex-col gap-4">
                                    {navLinks.map((link) => (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            className="text-lg text-muted-foreground transition hover:text-foreground"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                    <Separator className="my-2" />
                                    <div className="flex flex-col gap-2">
                                        <Button asChild variant="outline" className="w-full">
                                            <Link href="/login">로그인</Link>
                                        </Button>
                                        <Button className="w-full">Tutum 시작하기</Button>
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
