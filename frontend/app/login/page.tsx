"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/portfolio";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "kakao" | "naver" | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const MAX_ATTEMPTS = 5;
  const BASE_LOCK_SECONDS = 30;

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const lockRemainingSeconds = useMemo(() => {
    if (!lockUntil) return 0;
    return Math.max(0, Math.ceil((lockUntil - nowTs) / 1000));
  }, [lockUntil, nowTs]);
  const isLocked = lockRemainingSeconds > 0;

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const buildOAuthLoginUrl = (provider: "google" | "kakao" | "naver") => {
    const state =
      typeof window !== "undefined" && window.crypto?.randomUUID
        ? window.crypto.randomUUID().replace(/-/g, "")
        : `${Date.now()}${Math.random().toString(36).slice(2)}`;
    // OAuth는 백엔드로 직접 이동 (state 쿠키가 backend 도메인에 설정되어야 함)
    return `${BACKEND_URL}/api/v1/auth/${provider}/login?state=${encodeURIComponent(state)}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setIsLoading(true);
    setErrorMessage(null);

    const result = await login(email, password);

    if (result.success) {
      setFailedAttempts(0);
      setLockUntil(null);
      router.push(callbackUrl);
      router.refresh();
    } else {
      const nextFailedAttempts = failedAttempts + 1;
      setFailedAttempts(nextFailedAttempts);
      if (nextFailedAttempts >= MAX_ATTEMPTS) {
        const level = Math.floor(nextFailedAttempts / MAX_ATTEMPTS);
        const lockSeconds = BASE_LOCK_SECONDS * level;
        setLockUntil(Date.now() + lockSeconds * 1000);
      }
      setErrorMessage(result.error || "이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    setIsLoading(false);
  };

  const handleOAuthLogin = (provider: "google" | "kakao" | "naver") => {
    if (isLoading || oauthLoading || isLocked) return;
    setOauthLoading(provider);
    window.location.href = buildOAuthLoginUrl(provider);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-500/30">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Tutum 로그인</CardTitle>
          <CardDescription>포트폴리오 관리를 위해 로그인해 주세요.</CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="rounded-md border border-rose-300/50 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-300">
                {errorMessage}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="password">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-visible:ring-indigo-500"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full h-11 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
              disabled={isLoading || isLocked}
            >
              {isLoading ? "로그인 중..." : isLocked ? `${lockRemainingSeconds}초 후 재시도` : "로그인"}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950">또는 간편 로그인</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
              <Button
                variant="outline"
                type="button"
                className="w-full h-11 bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:border-zinc-200"
                disabled={isLoading || !!oauthLoading || isLocked}
                onClick={() => handleOAuthLogin("google")}
              >
                Google
              </Button>
              <Button
                variant="outline"
                type="button"
                className="w-full h-11 bg-[#FEE500] hover:bg-[#FDD835] border-[#FEE500] text-[#191919]"
                disabled={isLoading || !!oauthLoading || isLocked}
                onClick={() => handleOAuthLogin("kakao")}
              >
                Kakao
              </Button>
              <Button
                variant="outline"
                type="button"
                className="w-full h-11 bg-[#03C75A] hover:bg-[#02b351] border-[#03C75A] text-white"
                disabled={isLoading || !!oauthLoading || isLocked}
                onClick={() => handleOAuthLogin("naver")}
              >
                Naver
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-zinc-500">아직 계정이 없나요? </span>
              <Button variant="link" className="p-0 h-auto font-semibold text-zinc-900 dark:text-white" asChild>
                <Link href="/register">회원가입</Link>
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      <div className="flex justify-center mt-8">
        <Button
          variant="ghost"
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors flex items-center gap-2"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>홈으로 돌아가기</span>
        </Button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginPageContent />
    </Suspense>
  );
}
