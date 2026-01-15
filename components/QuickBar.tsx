"use client";

import { useState } from "react";
import { UserIcon, StarIcon, ChatIcon, PlusIcon } from "./Icons";
import SlideInPanel from "./SlideInPanel";

export default function QuickBar() {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const openPanel = (panelId: string) => {
    setActivePanel(panelId);
  };

  const closePanel = () => {
    setActivePanel(null);
  };

  return (
    <>
      {/* Quick Bar - Fixed Right */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 p-2 bg-white dark:bg-zinc-900 border-l border-y border-zinc-200 dark:border-zinc-800 rounded-l-lg shadow-lg">
        <button
          onClick={() => openPanel("my")}
          className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-500 dark:hover:bg-blue-500 transition-all duration-200"
          title="MY"
        >
          <UserIcon className="w-6 h-6 text-zinc-700 dark:text-zinc-300 group-hover:text-white" />
          <span className="text-[10px] mt-1 text-zinc-700 dark:text-zinc-300 group-hover:text-white">MY</span>
        </button>

        <button
          onClick={() => openPanel("watchlist")}
          className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-500 dark:hover:bg-blue-500 transition-all duration-200"
          title="관심"
        >
          <StarIcon className="w-6 h-6 text-zinc-700 dark:text-zinc-300 group-hover:text-white" />
          <span className="text-[10px] mt-1 text-zinc-700 dark:text-zinc-300 group-hover:text-white">관심</span>
        </button>

        <button
          onClick={() => openPanel("chatbot")}
          className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-500 dark:hover:bg-blue-500 transition-all duration-200"
          title="챗봇"
        >
          <ChatIcon className="w-6 h-6 text-zinc-700 dark:text-zinc-300 group-hover:text-white" />
          <span className="text-[10px] mt-1 text-zinc-700 dark:text-zinc-300 group-hover:text-white">챗봇</span>
        </button>

        <button
          onClick={() => openPanel("custom")}
          className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-500 dark:hover:bg-blue-500 transition-all duration-200"
          title="추가"
        >
          <PlusIcon className="w-6 h-6 text-zinc-700 dark:text-zinc-300 group-hover:text-white" />
          <span className="text-[10px] mt-1 text-zinc-700 dark:text-zinc-300 group-hover:text-white">추가</span>
        </button>
      </div>

      {/* Slide-in Panels */}
      <SlideInPanel
        isOpen={activePanel === "my"}
        onClose={closePanel}
        title="MY"
      >
        <div className="p-6">
          <p className="text-zinc-600 dark:text-zinc-400">내 자산 요약 및 분석 (MVP placeholder)</p>
          <div className="mt-4 space-y-2">
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-500">총 자산</p>
              <p className="text-2xl font-bold">Coming soon</p>
            </div>
          </div>
        </div>
      </SlideInPanel>

      <SlideInPanel
        isOpen={activePanel === "watchlist"}
        onClose={closePanel}
        title="관심 목록"
      >
        <div className="p-6">
          <p className="text-zinc-600 dark:text-zinc-400">관심 코인 리스트</p>
          <div className="mt-4">
            <p className="text-sm text-zinc-500">관심 코인을 추가해보세요</p>
          </div>
        </div>
      </SlideInPanel>

      <SlideInPanel
        isOpen={activePanel === "chatbot"}
        onClose={closePanel}
        title="챗봇"
      >
        <div className="p-6">
          <p className="text-zinc-600 dark:text-zinc-400">AI 챗봇 기능 (Coming soon)</p>
        </div>
      </SlideInPanel>

      <SlideInPanel
        isOpen={activePanel === "custom"}
        onClose={closePanel}
        title="커스텀 메뉴"
      >
        <div className="p-6">
          <p className="text-zinc-600 dark:text-zinc-400">커스텀 메뉴 추가 기능 (placeholder)</p>
        </div>
      </SlideInPanel>
    </>
  );
}
