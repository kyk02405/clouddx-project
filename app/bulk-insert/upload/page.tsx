"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PortfolioHeader from "@/components/PortfolioHeader";
import { Check } from "lucide-react";

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
        <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950 transition-colors duration-300">
            <PortfolioHeader />
            <div className="flex flex-1">
                {/* Left Sidebar */}
                <aside className="w-72 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-8">
                    <h1 className="mb-10 text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">대량 등록하기</h1>
                    <nav className="relative flex flex-col gap-8">
                        {/* Connecting Line */}
                        <div className="absolute left-3 top-3 bottom-3 w-[1px] border-l border-dashed border-zinc-300 dark:border-zinc-700 z-0" />

                        {steps.map((step) => (
                            <button
                                key={step.number}
                                onClick={() => setCurrentStep(step.number)}
                                className="group relative z-10 flex items-center gap-4 text-left outline-none"
                            >
                                <div
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${currentStep >= step.number
                                            ? "bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white shadow-lg"
                                            : "bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                                        }`}
                                >
                                    {currentStep > step.number ? (
                                        <Check className="h-3.5 w-3.5 text-white dark:text-zinc-900" strokeWidth={4} />
                                    ) : (
                                        <div className={`h-2 w-2 rounded-full ${currentStep === step.number ? "bg-white dark:bg-zinc-900" : "bg-transparent"}`} />
                                    )}
                                </div>
                                <span className={`text-sm font-bold transition-colors duration-300 ${currentStep === step.number
                                        ? "text-zinc-900 dark:text-white"
                                        : "text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-300"
                                    }`}>
                                    {step.title}
                                </span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-12">
                    <div className="mx-auto max-w-4xl h-full flex flex-col">
                        <div className="flex-1">
                            {/* Step 1: 리스트 준비 */}
                            {currentStep === 1 && (
                                <div className="space-y-8">
                                    <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                                        종목/거래내역 리스트 준비
                                    </h2>
                                    <div className="space-y-6">
                                        <p className="text-lg text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                            여러 개의 자산 또는 거래 내역을 CSV 파일로 업로드할 수 있습니다.<br />
                                            아래 템플릿을 다운받으신 후 정보를 입력하거나, 갖고 계신 파일을 형식에 맞추어 편집해 주세요.
                                        </p>

                                        <div className="flex flex-wrap gap-4">
                                            <button
                                                className="px-6 py-3.5 bg-white dark:bg-zinc-100 text-zinc-900 font-bold rounded-xl shadow-sm border border-zinc-200 dark:border-transparent hover:bg-zinc-50 dark:hover:bg-white transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                <span>Windows용 템플릿 파일 다운로드</span>
                                            </button>
                                            <button
                                                className="px-6 py-3.5 bg-white dark:bg-zinc-100 text-zinc-900 font-bold rounded-xl shadow-sm border border-zinc-200 dark:border-transparent hover:bg-zinc-50 dark:hover:bg-white transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                <span>Mac용 템플릿 파일 다운로드</span>
                                            </button>
                                        </div>

                                        <p className="text-sm font-bold text-zinc-400 dark:text-zinc-600">
                                            CSV 파일은 메모장, excel, numbers 등 무료 프로그램으로 편집 가능합니다.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: 리스트 채우기 */}
                            {currentStep === 2 && (
                                <div className="space-y-8">
                                    <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                                        리스트 채우는 방법
                                    </h2>
                                    <Card className="border-none bg-zinc-50 dark:bg-zinc-900/50 shadow-none">
                                        <CardContent className="p-8">
                                            <p className="mb-8 text-zinc-600 dark:text-zinc-400 font-medium">
                                                종목별 최신 보유 현황을 입력하시거나 거래 내역을 입력하실 수 있습니다.
                                            </p>

                                            <div className="space-y-10">
                                                <div>
                                                    <h3 className="mb-4 font-black text-zinc-900 dark:text-white uppercase tracking-wider text-xs">
                                                        01 종목별 최신 보유 현황 업로드
                                                    </h3>
                                                    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                                                    <th className="px-5 py-4 text-left text-zinc-400 text-[10px] font-black uppercase tracking-widest">증권종목</th>
                                                                    <th className="px-5 py-4 text-left text-zinc-400 text-[10px] font-black uppercase tracking-widest">수량</th>
                                                                    <th className="px-5 py-4 text-left text-zinc-400 text-[10px] font-black uppercase tracking-widest">평단가</th>
                                                                    <th className="px-5 py-4 text-left text-zinc-400 text-[10px] font-black uppercase tracking-widest">통화</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr className="text-zinc-900 dark:text-zinc-100">
                                                                    <td className="px-5 py-4 font-bold">삼성전자</td>
                                                                    <td className="px-5 py-4">2</td>
                                                                    <td className="px-5 py-4">88,000</td>
                                                                    <td className="px-5 py-4">KRW</td>
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
                                <div className="space-y-8 h-full">
                                    <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">업로드</h2>
                                    <div className="flex-1 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 min-h-[400px]">
                                        <div className="text-center group cursor-pointer p-12">
                                            <div className="mx-auto h-20 w-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:scale-110 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-all duration-300 mb-6">
                                                <Plus className="h-10 w-10" />
                                            </div>
                                            <p className="text-xl font-bold text-zinc-900 dark:text-white">CSV 파일을 여기에 드래그하거나</p>
                                            <button className="mt-4 text-emerald-500 font-bold hover:underline">파일 선택하기</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: 확인 */}
                            {currentStep === 4 && (
                                <div className="space-y-8 flex flex-col items-center justify-center flex-1">
                                    <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                                        <Check className="h-12 w-12" strokeWidth={3} />
                                    </div>
                                    <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">업로드 완료!</h2>
                                    <p className="text-zinc-500 dark:text-zinc-400 font-bold text-center">
                                        자산이 성공적으로 등록되었습니다.<br />
                                        포트폴리오 페이지에서 확인하실 수 있습니다.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="mt-12 flex items-center justify-center gap-4">
                            <button
                                onClick={handlePrevious}
                                disabled={currentStep === 1}
                                className={`px-10 py-4 rounded-full font-bold transition-all ${currentStep === 1
                                        ? "opacity-0 pointer-events-none"
                                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                    }`}
                            >
                                이전
                            </button>
                            <button
                                onClick={handleNext}
                                className="px-10 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-bold shadow-xl shadow-zinc-900/10 dark:shadow-none hover:scale-105 active:scale-95 transition-all"
                            >
                                {currentStep === 4 ? "완료" : "다음"}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
