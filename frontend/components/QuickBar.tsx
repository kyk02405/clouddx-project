"use client";

import { useState, useEffect } from "react";
import { UserIcon, HeartIcon, ChatIcon, PlusIcon, MoonIcon, SunIcon } from "./Icons";
import SlideInPanel from "./SlideInPanel";
import { useLocalWatchlist } from "../lib/hooks/useLocalWatchlist";
import { MOCK_COINS } from "../lib/mockData";

export default function QuickBar() {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const { watchlist } = useLocalWatchlist();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.className = 'dark';
    } else {
      setIsDark(false);
      document.documentElement.className = '';
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.className = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.className = '';
      localStorage.setItem('theme', 'light');
    }
  };

  const buttons = [
    { id: "my", label: "MY", icon: UserIcon },
    { id: "watchlist", label: "관심", icon: HeartIcon },
    { id: "chatbot", label: "챗봇", icon: ChatIcon },
    { id: "add", label: "추가", icon: PlusIcon },
  ];

  // Get watchlist coins
  const watchlistCoins = MOCK_COINS.filter(coin => watchlist.includes(coin.symbol));

  return (
    <>
      <div className="fixed right-0 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3 rounded-l-3xl glass shadow-2xl shadow-blue-500/20 p-3">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActivePanel(btn.id)}
            className="group relative flex flex-col items-center gap-1 rounded-2xl p-4 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-purple-500/20 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50"
          >
            <btn.icon className="h-6 w-6 text-zinc-500 transition-colors group-hover:text-blue-500 dark:text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {btn.label}
            </span>
            {btn.id === "watchlist" && watchlist.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {watchlist.length}
              </span>
            )}
            <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 blur-xl transition-opacity group-hover:opacity-30" />
          </button>
        ))}

        {/* Theme Toggle Button */}
        <div className="my-2 h-px bg-zinc-300 dark:bg-zinc-700" />
        <button
          onClick={toggleTheme}
          className="group relative flex flex-col items-center gap-1 rounded-2xl p-4 transition-all duration-300 hover:bg-gradient-to-br hover:from-yellow-500/20 hover:to-orange-500/20 hover:scale-110"
          title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
          {isDark ? (
            <MoonIcon className="h-6 w-6 text-zinc-500 transition-colors group-hover:text-yellow-500 dark:text-zinc-400" />
          ) : (
            <SunIcon className="h-6 w-6 text-zinc-500 transition-colors group-hover:text-orange-500" />
          )}
          <span className="text-[10px] font-bold text-zinc-400 transition-colors group-hover:text-yellow-600 dark:group-hover:text-yellow-400">
            {isDark ? "다크" : "라이트"}
          </span>
        </button>
      </div>

      <SlideInPanel
        isOpen={activePanel !== null}
        onClose={() => setActivePanel(null)}
        title={buttons.find((b) => b.id === activePanel)?.label ?? ""}
      >
        {activePanel === "watchlist" ? (
          <div className="pt-4">
            {watchlistCoins.length > 0 ? (
              <div className="space-y-2">
                {watchlistCoins.map((coin) => (
                  <div
                    key={coin.symbol}
                    className="flex items-center justify-between rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800"
                  >
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{coin.symbol}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{coin.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        ${coin.price?.toLocaleString()}
                      </p>
                      <p className={`text-sm ${
                        (coin.change24h ?? 0) >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {(coin.change24h ?? 0) >= 0 ? "+" : ""}
                        {coin.change24h?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 pt-20">
                <div className="h-12 w-12 animate-bounce rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                  <HeartIcon className="text-red-600" filled={false} />
                </div>
                <p className="text-sm font-medium text-zinc-500">
                  관심 코인이 없습니다
                </p>
                <p className="text-xs text-zinc-400">
                  하트를 눌러 추가해보세요
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 pt-20">
            <div className="h-12 w-12 animate-bounce rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <HeartIcon className="text-blue-600" filled={false} />
            </div>
            <p className="text-sm font-medium text-zinc-500">
              로그인이 필요한 서비스입니다.
            </p>
          </div>
        )}
      </SlideInPanel>
    </>
  );
}
