"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchIcon, UserCircleIcon } from "./Icons";

export default function Header() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              CovaEX
            </Link>
          </div>

          {/* Top Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              홈
            </Link>
            <Link 
              href="/markets" 
              className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              코인
            </Link>
            <Link 
              href="/portfolio" 
              className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              나의 자산
            </Link>
          </nav>

          {/* Search & Profile */}
          <div className="flex items-center space-x-4">
            {/* Coin Search */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="코인 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-4 py-2 pl-10 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <UserCircleIcon className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-2">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">로그인이 필요합니다</p>
                  </div>
                  <Link
                    href="/login"
                    className="block px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    회원가입
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
