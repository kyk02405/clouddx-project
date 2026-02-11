"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, RefreshCcw, ShieldAlert } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-6">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-600/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 text-center space-y-8">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl mb-4">
          <ShieldAlert className="h-10 w-10 text-indigo-500" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-zinc-500 text-transparent bg-clip-text">Something Went Wrong</h1>
          <h2 className="text-2xl font-bold text-zinc-200">알 수 없는 오류가 발생했습니다</h2>
          {error.digest && (
            <p className="text-sm text-zinc-600 font-mono">Error Code: {error.digest}</p>
          )}
          <p className="text-zinc-500 max-w-lg mx-auto leading-relaxed">
            일시적인 통신 장애이거나 예상치 못한 내부 오류일 수 있습니다.<br />
            다시 시도하거나 홈으로 돌아가서 확인해 주세요.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button 
            variant="outline"
            size="lg" 
            onClick={() => reset()}
            className="rounded-full px-8 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white font-bold h-14"
          >
            <RefreshCcw className="mr-2 h-5 w-5" />
            다시 시도하기
          </Button>
          
          <Link href="/">
            <Button 
               size="lg" 
               className="rounded-full px-8 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-bold h-14 text-lg shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Home className="mr-2 h-5 w-5" />
              메인으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-20">
        <span className="text-4xl font-black tracking-tighter text-zinc-100">tutum</span>
      </div>
    </div>
  );
}
