"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/portfolio";
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Mock login delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Set mock cookie
        document.cookie = "auth_token=mock_token_123; path=/; max-age=3600";

        router.push(callbackUrl);
        router.refresh();
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
                    <CardFooter>
                        <Button className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                            {isLoading ? "로그인 중..." : "로그인"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
