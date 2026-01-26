"use client";

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 px-4 py-20 sm:px-6 lg:px-8">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>

            <div className="relative mx-auto max-w-4xl text-center">
                <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                    AI로 내 자산을
                    <br />
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        한눈에 관리하세요
                    </span>
                </h1>

                <p className="mb-10 text-lg text-gray-300 sm:text-xl">
                    암호화폐와 주식, 하나의 플랫폼에서 - CSV/OCR 업로드부터 실시간 시세, 뉴스, AI 인사이트까지
                </p>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <button className="w-full rounded-lg bg-blue-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-blue-600/50 transition hover:bg-blue-700 sm:w-auto">
                        시작하기
                    </button>
                    <button className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-8 py-4 text-lg font-medium text-white backdrop-blur transition hover:bg-gray-800 sm:w-auto">
                        10초 체험하기
                    </button>
                </div>
            </div>
        </section>
    );
}
