"use client";

import { useState } from "react";

export default function TopNav() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="border-b border-gray-800 bg-gray-950">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <span className="text-2xl font-bold text-white">
                            Asset<span className="text-blue-500">AI</span>
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden items-center gap-8 md:flex">
                        <a href="#features" className="text-gray-300 transition hover:text-white">
                            Features
                        </a>
                        <a href="#market" className="text-gray-300 transition hover:text-white">
                            Market
                        </a>
                        <a href="#news" className="text-gray-300 transition hover:text-white">
                            News
                        </a>
                    </div>

                    {/* Buttons */}
                    <div className="hidden items-center gap-4 md:flex">
                        <button className="rounded-lg px-4 py-2 text-gray-300 transition hover:bg-gray-800 hover:text-white">
                            Login
                        </button>
                        <button className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700">
                            Get Started
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg
                            className="h-6 w-6 text-gray-300"
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

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="border-t border-gray-800 py-4 md:hidden">
                        <div className="flex flex-col gap-4">
                            <a href="#features" className="text-gray-300 hover:text-white">
                                Features
                            </a>
                            <a href="#market" className="text-gray-300 hover:text-white">
                                Market
                            </a>
                            <a href="#news" className="text-gray-300 hover:text-white">
                                News
                            </a>
                            <div className="flex flex-col gap-2 pt-4">
                                <button className="rounded-lg border border-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-800">
                                    Login
                                </button>
                                <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
