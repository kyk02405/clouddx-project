"use client";

import Link from "next/link";
import { X, Plus, FileUp } from "lucide-react";

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddAssetModal({ isOpen, onClose }: AddAssetModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-7">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white mb-1">자산 추가</h2>
              <p className="text-sm text-zinc-500 font-medium">관리하실 자산을 등록하는 방법을 선택해주세요.</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4">
            {/* Direct Registration */}
            <Link
              href="/dashboard/assets/direct-register"
              className="group relative flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-emerald-500/50 hover:bg-zinc-900"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <Plus className="h-7 w-7" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">직접 등록</h3>
                <p className="mt-1 text-sm text-zinc-500 leading-relaxed font-medium">
                  일반 주식, 예금 등 자산 정보를<br />하나씩 직접 입력하여 등록합니다.
                </p>
              </div>
            </Link>

            {/* Bulk Registration (CSV) */}
            <Link
              href="/bulk-insert/upload"
              className="group relative flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-emerald-500/50 hover:bg-zinc-900"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <FileUp className="h-7 w-7" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">대량 등록</h3>
                <p className="mt-1 text-sm text-zinc-500 leading-relaxed font-medium">
                  CSV 파일을 업로드하여<br />여러 자산을 한꺼번에 등록합니다.
                </p>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
