"use client";

export default function DirectRegisterPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
            <div className="flex flex-col items-center gap-4 max-w-md text-center p-8">
                <div className="text-6xl mb-4">🚧</div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">직접 등록 기능 준비 중</h1>
                <p className="text-sm text-zinc-500 mt-2">
                    현재 이 기능은 개발 중입니다. 대량 등록(CSV) 또는 OCR 자동 등록을 이용해주세요.
                </p>
                <a
                    href="/portfolio/asset"
                    className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
                >
                    포트폴리오로 돌아가기
                </a>
            </div>
        </div>
    );
}
