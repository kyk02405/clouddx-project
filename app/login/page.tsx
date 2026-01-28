"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/portfolio";
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const success = await login("test", "test");

        if (success) {
            // Set mock cookie
            document.cookie = "auth_token=mock_token_123; path=/; max-age=3600";
            router.push(callbackUrl);
            router.refresh();
        } else {
            alert("로그인 정보가 올바르지 않습니다.");
        }
        setIsLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
            <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-black p-3 dark:bg-white text-white dark:text-black">
                            <Shield className="h-6 w-6" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Tutum 로그인</CardTitle>
                    <CardDescription>
                        안전한 자산 관리를 위해 계정에 접속하세요
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="email">
                                이메일
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                defaultValue="test@test.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="password">
                                비밀번호
                            </label>
                            <Input
                                id="password"
                                type="password"
                                defaultValue="test"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                            {isLoading ? "로그인 중..." : "로그인"}
                        </Button>

                        <div className="relative w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950">
                                    또는 소셜 로그인
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 w-full">
                            <Button variant="outline" type="button" className="w-full h-11 bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:border-zinc-200" onClick={() => alert("Google 로그인은 추후 구현됩니다.")}>
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Google
                            </Button>
                            <Button variant="outline" type="button" className="w-full h-11 bg-[#FEE500] hover:bg-[#FDD835] border-[#FEE500] text-[#191919] dark:bg-[#FEE500] dark:text-[#191919] dark:hover:bg-[#FDD835] dark:border-[#FEE500]" onClick={() => alert("카카오 로그인은 추후 구현됩니다.")}>
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 3C6.47715 3 2 6.47715 2 10.7692C2 13.6308 3.96923 16.1385 6.92308 17.3846L5.92308 21L9.61538 18.5385C10.3846 18.6923 11.1692 18.7692 12 18.7692C17.5228 18.7692 22 15.292 22 11C22 6.708 17.5228 3 12 3Z" />
                                </svg>
                                Kakao
                            </Button>
                            <Button variant="outline" type="button" className="w-full h-11 bg-[#03C75A] hover:bg-[#02b351] border-[#03C75A] text-white dark:bg-[#03C75A] dark:text-white dark:hover:bg-[#02b351] dark:border-[#03C75A]" onClick={() => alert("네이버 로그인은 추후 구현됩니다.")}>
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                                </svg>
                                Naver
                            </Button>
                        </div>

                        <div className="text-center text-sm">
                            <span className="text-zinc-500">계정이 없으신가요? </span>
                            <Button variant="link" className="p-0 h-auto font-semibold text-zinc-900 dark:text-white" asChild>
                                <Link href="/register">
                                    회원가입
                                </Link>
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
