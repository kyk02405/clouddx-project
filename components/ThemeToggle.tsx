"use client";

import * as React from "react";
import { MoreVertical } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsOpen(!isOpen)}
            >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">메뉴 열기</span>
            </Button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 border border-zinc-200 dark:border-zinc-700">
                        <div className="p-4">
                            <button
                                className="w-full flex items-center justify-between px-4 py-3 text-sm bg-zinc-100 dark:bg-zinc-900 rounded-lg transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                onClick={() => {
                                    setTheme(theme === "dark" ? "light" : "dark");
                                }}
                            >
                                <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                                    다크모드
                                </span>
                                <div
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                        theme === "dark" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                                            theme === "dark" ? "translate-x-6" : "translate-x-0.5"
                                        )}
                                    />
                                </div>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
