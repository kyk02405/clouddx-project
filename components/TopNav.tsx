"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";

const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#market", label: "Market" },
    { href: "#news", label: "News" },
];

export default function TopNav() {
    return (
        <nav className="border-b border-border bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <span className="text-2xl font-bold text-foreground">
                            Asset<span className="text-blue-500">AI</span>
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden items-center gap-8 md:flex">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-muted-foreground transition hover:text-foreground"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop Buttons */}
                    <div className="hidden items-center gap-2 md:flex">
                        <ThemeToggle />
                        <Button variant="ghost">Login</Button>
                        <Button>Get Started</Button>
                    </div>

                    {/* Mobile Menu */}
                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeToggle />
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px]">
                                <SheetHeader>
                                    <SheetTitle>
                                        Asset<span className="text-blue-500">AI</span>
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
                                        <Button variant="outline" className="w-full">Login</Button>
                                        <Button className="w-full">Get Started</Button>
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
