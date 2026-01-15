"use client";

import { useEffect } from "react";
import { XIcon } from "./Icons";

interface SlideInPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function SlideInPanel({ isOpen, onClose, title, children }: SlideInPanelProps) {
  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-20 top-0 bottom-0 w-full max-w-[700px] bg-white dark:bg-zinc-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <XIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </>
  );
}
