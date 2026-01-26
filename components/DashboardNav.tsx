"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const tabs = [
    { name: "차트", href: "/dashboard/chart" },
    { name: "자산", href: "/dashboard/assets" },
  ];

  return (
    <nav className="border-b border-gray-800 bg-gray-950">
      <div className="mx-auto flex h-14 items-center justify-between px-6">
        {/* Logo + Tabs */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard/chart" className="flex items-center gap-1">
            <span className="text-xl font-bold text-orange-500">◆</span>
            <span className="text-xl font-bold text-white">
              Asset<span className="text-blue-500">AI</span>
            </span>
          </Link>

          <div className="flex gap-6">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`text-sm font-medium transition ${
                  pathname.startsWith(tab.href)
                    ? "text-green-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Search + User */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="주식, 코인, 지수, 펀드, 아파트 검색"
              className="w-80 rounded-full border border-gray-700 bg-gray-800/50 px-4 py-2 pl-10 text-sm text-white placeholder-gray-500 focus:border-gray-600 focus:outline-none"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-medium text-white">
                {user?.name?.charAt(0) || "U"}
              </div>
              <span className="text-sm text-gray-300">{user?.name || "User"}</span>
              <button
                onClick={logout}
                className="ml-2 text-xs text-gray-500 hover:text-red-400"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
