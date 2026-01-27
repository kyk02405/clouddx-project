"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function BulkInsertUploadPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const router = useRouter();

    const steps = [
        { number: 1, title: "리스트 준비", id: "prepare" },
        { number: 2, title: "리스트 채우기", id: "fill" },
        { number: 3, title: "업로드", id: "upload" },
        { number: 4, title: "확인", id: "confirm" },
    ];

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        } else {
            router.push("/portfolio/asset");
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="flex min-h-screen bg-zinc-950">
            {/* Left Sidebar */}
            <aside className="w-64 border-r border-zinc-800 bg-zinc-900 p-6">
                <h1 className="mb-8 text-xl font-bold text-white">대량 등록하기</h1>
                <nav className="space-y-2">
                    {steps.map((step) => (
                        <button
                            key={step.number}
                            onClick={() => setCurrentStep(step.number)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${currentStep === step.number
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                                }`}
                        >
                            <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${currentStep === step.number
                                    ? "bg-white text-zinc-900"
                                    : currentStep > step.number
                                        ? "bg-emerald-500 text-white"
                                        : "border border-zinc-700 text-zinc-500"
                                    }`}
                            >
                                {currentStep > step.number ? "✓" : step.number}
                            </div>
                            <span className="text-sm font-medium">{step.title}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="mx-auto max-w-4xl">
                    {/* Step 1: 리스트 준비 */}
                    {currentStep === 1 && (
                        <div>
                            <h2 className="mb-6 text-3xl font-bold text-white">
                                종목/거래내역 리스트 준비
                            </h2>
                            <Card className="border-zinc-800 bg-zinc-900">
                                <CardContent className="p-6">
                                    <p className="mb-4 text-zinc-300">
                                        여러 개의 자산 또는 거래 내역을 CSV 파일로 업로드할 수 있습니다.
                                    </p>
                                    <p className="mb-6 text-sm text-zinc-400">
                                        아래 템플릿을 다운받으시고, 각 칼럼 리스트를 명시대로 채워주세요.
                                    </p>

                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-750"
                                        >
                                            <span>Windows용 템플릿 다운로드</span>
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                />
                                            </svg>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-750"
                                        >
                                            <span>Mac용 템플릿 다운로드</span>
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                />
                                            </svg>
                                        </Button>
                                    </div>

                                    <p className="mt-4 text-xs text-zinc-500">
                                        CSV 파일은 Excel, Numbers 등 모든 프로그램으로 편집 가능합니다.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 2: 리스트 채우기 */}
                    {currentStep === 2 && (
                        <div>
                            <h2 className="mb-6 text-3xl font-bold text-white">
                                리스트 채우는 방법
                            </h2>
                            <Card className="border-zinc-800 bg-zinc-900">
                                <CardContent className="p-6">
                                    <p className="mb-6 text-zinc-300">
                                        종목별 최신 보유 현황을 입력하시거나 거래 내역을 입력하실 수 있습니다.
                                    </p>

                                    <div className="space-y-6">
                                        {/* Method 1 */}
                                        <div>
                                            <h3 className="mb-3 font-semibold text-white">
                                                1. 종목별 최신 보유 현황 업로드
                                            </h3>
                                            <p className="mb-3 text-sm text-zinc-400">
                                                현재 보유 증권의 정보를 한번만 입력해도 충분합니다.
                                            </p>
                                            <div className="overflow-x-auto rounded-lg border border-zinc-800">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-zinc-800">
                                                        <tr>
                                                            <th className="border-r border-zinc-700 px-4 py-3 text-left text-zinc-300">
                                                                증권종목
                                                            </th>
                                                            <th className="border-r border-zinc-700 px-4 py-3 text-left text-zinc-300">
                                                                수량
                                                            </th>
                                                            <th className="border-r border-zinc-700 px-4 py-3 text-left text-zinc-300">
                                                                평단가
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-zinc-300">
                                                                통화
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-zinc-900/50">
                                                        <tr className="border-t border-zinc-800">
                                                            <td className="border-r border-zinc-800 px-4 py-3 text-white">
                                                                삼성전자
                                                            </td>
                                                            <td className="border-r border-zinc-800 px-4 py-3 text-white">
                                                                2
                                                            </td>
                                                            <td className="border-r border-zinc-800 px-4 py-3 text-white">
                                                                88,000
                                                            </td>
                                                            <td className="px-4 py-3 text-white">KRW</td>
                                                        </tr>
                                                        <tr className="border-t border-zinc-800">
                                                            <td className="border-r border-zinc-800 px-4 py-3 text-white">
                                                                테슬라
                                                            </td>
                                                            <td className="border-r border-zinc-800 px-4 py-3 text-white">
                                                                10
                                                            </td>
                                                            <td className="border-r border-zinc-800 px-4 py-3 text-white">
                                                                256.50
                                                            </td>
                                                            <td className="px-4 py-3 text-white">USD</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Method 2 */}
                                        <div>
                                            <h3 className="mb-3 font-semibold text-white">
                                                2. 거래내역 업로드
                                            </h3>
                                            <p className="mb-3 text-sm text-zinc-400">
                                                증권사 거래내역을 입력하시면 자동으로 평균가 계산이 가능합니다.
                                            </p>
                                            <div className="overflow-x-auto rounded-lg border border-zinc-800">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-zinc-800">
                                                        <tr>
                                                            <th className="border-r border-zinc-700 px-4 py-3 text-left text-zinc-300">
                                                                증권종목
                                                            </th>
                                                            <th className="border-r border-zinc-700 px-4 py-3 text-left text-zinc-300">
                                                                수량
                                                            </th>
                                                            <th className="border-r border-zinc-700 px-4 py-3 text-left text-zinc-300">
                                                                평단가
                                                            </th>
                                                            <th className="border-r border-zinc-700 px-4 py-3 text-left text-zinc-300">
                                                                통화
                                                            </th>
                                                            <th className="border-r border-zinc-700 px-4 py-3 text-left text-zinc-300">
                                                                거래유형
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-zinc-300">
                                                                거래일시
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-zinc-900/50">
                                                        <tr className="border-t border-zinc-800">
                                                            <td className="border-r border-zinc-800 px-4 py-3 text-white">
                                                                삼성전자
                                                            </td>
                                                            <td className="border-r border-zinc-800 px-4 py-3 text-white">
                                                                2
                                                            </td>
                                                            <td className="border-r border-zinc-800 px-4 py-3 text-white">
                                                                88,000
                                                            </td>
                                                            <td className="border-r border-zinc-800 px-4 py-3 text-white">
                                                                KRW
                                                            </td>
                                                            <td className="border-r border-zinc-800 px-4 py-3 text-white">
                                                                매수
                                                            </td>
                                                            <td className="px-4 py-3 text-white">
                                                                2022-04-07 16:40:30
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 3: 업로드 */}
                    {currentStep === 3 && (
                        <div>
                            <h2 className="mb-6 text-3xl font-bold text-white">업로드</h2>
                            <Card className="border-zinc-800 bg-zinc-900">
                                <CardContent className="p-6">
                                    <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50">
                                        <div className="text-center">
                                            <svg
                                                className="mx-auto h-16 w-16 text-zinc-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                            <p className="mt-4 text-lg text-zinc-300">
                                                CSV 파일을 여기에 드래그하거나
                                            </p>
                                            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                                                파일 선택
                                            </Button>
                                            <p className="mt-2 text-xs text-zinc-500">
                                                지원 형식: CSV
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 4: 확인 */}
                    {currentStep === 4 && (
                        <div>
                            <h2 className="mb-6 text-3xl font-bold text-white">확인</h2>
                            <Card className="border-zinc-800 bg-zinc-900">
                                <CardContent className="p-6">
                                    <div className="mb-6 flex items-center gap-3 text-emerald-400">
                                        <svg
                                            className="h-10 w-10"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        <span className="text-2xl font-bold">업로드 완료!</span>
                                    </div>
                                    <p className="text-lg text-zinc-300">
                                        자산이 성공적으로 등록되었습니다.
                                    </p>
                                    <p className="mt-2 text-sm text-zinc-400">
                                        포트폴리오 페이지에서 확인하실 수 있습니다.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex justify-between">
                        <Button
                            onClick={handlePrevious}
                            disabled={currentStep === 1}
                            variant="outline"
                            className="border-zinc-700 text-white hover:bg-zinc-800 disabled:opacity-50"
                        >
                            이전
                        </Button>
                        <Button
                            onClick={handleNext}
                            className="bg-white text-zinc-900 hover:bg-zinc-100"
                        >
                            {currentStep === 4 ? "완료" : "다음"}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
        </div >
    );
}
