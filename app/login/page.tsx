"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

                        <div className="grid grid-cols-2 gap-3 w-full">
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
                            <Button variant="outline" type="button" className="w-full h-11 bg-[#1877F2] hover:bg-[#1864D0] border-[#1877F2] text-white dark:bg-[#1877F2] dark:text-white dark:hover:bg-[#1864D0] dark:border-[#1877F2]" onClick={() => alert("Facebook 로그인은 추후 구현됩니다.")}>
                                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.66-2.797 3.592v1.403h3.428l-.538 3.667h-2.89v7.933c1.297.102 1.881.102 1.881.102.8 0 1.25-.5 1.25-1.1v-6.935h2.15l-1.077 5.835h-1.073v6.135c0 1.5 1.5 1.5 2.5 1.5 2 0 2.5-1.5 2.5-2.5v-5.135h-3.428l1.078-6.135h2.35v-1.528c0-2.5 1.5-4 4-4 .9 0 1.8.2 2.7.4v4.6c-.6-.2-1.2-.4-1.8-.4-1 0-1.5.5-1.5 1.5v1.428h3.35l-1.135 6.135h-2.215v6.52c0 1.645 2.5 1.645 2.5-1.645v-4.875h3.428l-.588 4.875c0 4.5-3.5 6.5-7.5 6.5-2.81 0-4.938-.992-6.5-2.784z" style={{ display: 'none' }} />
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                Facebook
                            </Button>
                            <Button variant="outline" type="button" className="w-full h-11 bg-black hover:bg-zinc-800 border-black text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:border-white" onClick={() => alert("Apple 로그인은 추후 구현됩니다.")}>
                                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-1.23 3.91-1.13.93.05 2.54.55 3.32 1.66-1.1.66-2.67 2.38-1.78 6.36 1.4 5.34-3.5 10.64-5.53 15.34zm-3.27-14.8c-1.5-1.4-1.2-4.4.75-5.48 1.67 1.25 1.5 4.32-.75 5.48z" />
                                </svg>
                                Apple
                            </Button>
                        </div>

                        <div className="text-center text-sm">
                            <span className="text-zinc-500">계정이 없으신가요? </span>
                            <Button variant="link" className="p-0 h-auto font-semibold text-zinc-900 dark:text-white" onClick={() => router.push("/register")}>
                                회원가입
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
