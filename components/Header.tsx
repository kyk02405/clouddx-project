"use client";

import { useState, useEffect, useRef } from "react";
import { SearchIcon, UserCircleIcon } from "./Icons";
import Link from "next/link";

export default function Header() {
  const [search, setSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = false; // TODO: Replace with actual auth state

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <header className="sticky top-0 z-50 w-full glass shadow-lg shadow-blue-500/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-tight text-gradient">
            CovaEX
          </Link>

          {/* Nav Menu */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium text-zinc-700 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-500">
              홈
            </Link>
            <Link href="/markets" className="text-sm font-medium text-zinc-700 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-500">
              코인
            </Link>
            <Link href="/portfolio" className="text-sm font-medium text-zinc-700 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-500">
              나의 자산
            </Link>
          </nav>
        </div>

        {/* Search & Profile */}
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              className="block w-64 rounded-full border-0 py-1.5 pl-10 pr-3 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800"
              placeholder="코인 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* User Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              <UserCircleIcon className="h-8 w-8" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl glass shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      내 계정
                    </Link>
                    <Link
                      href="/portfolio"
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      포트폴리오
                    </Link>
                    <Link
                      href="/analytics"
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      분석
                    </Link>
                    <hr className="my-2 border-zinc-200 dark:border-zinc-800" />
                    <button
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="block px-4 py-3 text-center text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mx-2 hover:from-blue-700 hover:to-purple-700 transition-all"
                    onClick={() => setShowUserMenu(false)}
                  >
                    로그인
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
