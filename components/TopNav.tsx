"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function TopNav() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                        <a href="#features" className="text-muted-foreground transition hover:text-foreground">
                            Features
                        </a>
                        <a href="#market" className="text-muted-foreground transition hover:text-foreground">
                            Market
                        </a>
                        <a href="#news" className="text-muted-foreground transition hover:text-foreground">
                            News
                        </a>
                    </div>

                    {/* Buttons */}
                    <div className="hidden items-center gap-2 md:flex">
                        <ThemeToggle />
                        <Button variant="ghost">Login</Button>
                        <Button>Get Started</Button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeToggle />
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <svg
                                className="h-6 w-6 text-muted-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {mobileMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="border-t border-border py-4 md:hidden">
                        <div className="flex flex-col gap-4">
                            <a href="#features" className="text-muted-foreground hover:text-foreground">
                                Features
                            </a>
                            <a href="#market" className="text-muted-foreground hover:text-foreground">
                                Market
                            </a>
                            <a href="#news" className="text-muted-foreground hover:text-foreground">
                                News
                            </a>
                            <div className="flex flex-col gap-2 pt-4">
                                <Button variant="outline">Login</Button>
                                <Button>Get Started</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
