"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DirectRegisterPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirection to the new unified registration flow
        router.replace("/user-upload/bulk-register");
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-500" />
                <p className="text-sm font-bold text-zinc-500">통합 등록 페이지로 이동 중...</p>
            </div>
        </div>
    );
}
