"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import PortfolioHeader from "@/components/PortfolioHeader";
import { Check, Plus, Scan, X, Loader2, Search } from "lucide-react";
import Image from "next/image";

export default function OcrInsertUploadPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const steps = [
        { number: 1, title: "이미지 업로드", id: "upload" },
        { number: 2, title: "정보 확인", id: "verify" },
    ];

    const handleNext = async () => {
        if (currentStep === 1 && selectedFile) {
            // Simulate OCR Processing
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                setCurrentStep(2);
            }, 2000);
        } else if (currentStep === 2) {
            // Submit logic (Mock)
            router.push("/portfolio/asset");
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleFileSelect = (file: File) => {
        if (file && file.type.startsWith("image/")) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            alert("이미지 파일만 업로드 가능합니다.");
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950 transition-colors duration-300">
            <PortfolioHeader />
            <div className="flex flex-1">
                {/* Left Sidebar */}
                <aside className="w-72 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-8">
                    <h1 className="mb-10 text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">OCR 자동 등록</h1>
                    <nav className="relative flex flex-col gap-8">
                        {/* Connecting Line */}
                        <div className="absolute left-3 top-3 bottom-3 w-[1px] border-l border-dashed border-zinc-300 dark:border-zinc-700 z-0" />

                        {steps.map((step) => (
                            <button
                                key={step.number}
                                onClick={() => !isProcessing && setCurrentStep(step.number)}
                                disabled={isProcessing || (step.number === 2 && !selectedFile)}
                                className="group relative z-10 flex items-center gap-4 text-left outline-none disabled:opacity-50"
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
                    <div className="mx-auto max-w-7xl h-full flex flex-col">
                        <div className="flex-1">
                            {/* Step 1: 이미지 업로드 */}
                            {currentStep === 1 && (
                                <div className="space-y-8 h-full flex flex-col">
                                    <div className="space-y-2">
                                        <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                                            자산 내역 촬영/업로드
                                        </h2>
                                        <p className="text-lg text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                            증권사 앱의 잔고 화면이나 엑셀 표를 캡처하여 업로드해 주세요.<br />
                                            AI가 종목명, 수량, 평단가를 자동으로 인식합니다.
                                        </p>
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={onFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />

                                    <div
                                        onDragOver={onDragOver}
                                        onDragLeave={onDragLeave}
                                        onDrop={onDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`flex-1 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-300 min-h-[400px] cursor-pointer relative overflow-hidden
                                            ${isDragging
                                                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 scale-[0.99]"
                                                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                            }`}
                                    >
                                        {!previewUrl ? (
                                            <div className="text-center group p-12 pointer-events-none">
                                                <div className="mx-auto h-20 w-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:scale-110 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-all duration-300 mb-6">
                                                    <Scan className="h-10 w-10" />
                                                </div>
                                                <p className="text-xl font-bold text-zinc-900 dark:text-white">이미지를 여기에 드래그하거나</p>
                                                <button className="mt-4 text-emerald-500 font-bold hover:underline">파일 선택하기</button>
                                            </div>
                                        ) : (
                                            <div className="relative w-full h-full flex items-center justify-center p-8">
                                                <div className="relative max-h-full max-w-full shadow-2xl rounded-lg overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={previewUrl} alt="Preview" className="max-h-[500px] object-contain" />
                                                    <button
                                                        onClick={removeFile}
                                                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center border-2 border-white dark:border-zinc-950 hover:bg-red-500 transition-colors shadow-lg"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Loading Overlay */}
                                        {isProcessing && (
                                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
                                                <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mb-4" />
                                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">AI 분석 중...</h3>
                                                <p className="text-zinc-500">이미지에서 텍스트를 추출하고 있습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: 정보 확인 (OCR 결과 Mock) */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                                            <Search className="h-8 w-8 text-emerald-500" />
                                            분석 결과 확인
                                        </h2>
                                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                                            AI가 추출한 정보가 정확한지 확인해 주세요.
                                        </p>
                                    </div>

                                    {/* 편집 가능한 테이블 (Mock Data) */}
                                    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold w-12">#</th>
                                                    <th className="px-4 py-3 font-semibold">종목명</th>
                                                    <th className="px-4 py-3 font-semibold">보유량</th>
                                                    <th className="px-4 py-3 font-semibold">평단가</th>
                                                    <th className="px-4 py-3 font-semibold">상태</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-transparent">
                                                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                                    <td className="px-4 py-3 text-zinc-400">1</td>
                                                    <td className="px-4 py-3">
                                                        <input type="text" defaultValue="삼성전자" className="w-full bg-transparent font-bold text-zinc-900 dark:text-white focus:outline-none" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input type="text" defaultValue="15" className="w-full bg-transparent text-zinc-900 dark:text-white focus:outline-none" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input type="text" defaultValue="72,500" className="w-full bg-transparent text-zinc-900 dark:text-white focus:outline-none" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">인식 성공</span>
                                                    </td>
                                                </tr>
                                                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                                    <td className="px-4 py-3 text-zinc-400">2</td>
                                                    <td className="px-4 py-3">
                                                        <input type="text" defaultValue="SK하이닉스" className="w-full bg-transparent font-bold text-zinc-900 dark:text-white focus:outline-none" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input type="text" defaultValue="8" className="w-full bg-transparent text-zinc-900 dark:text-white focus:outline-none" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input type="text" defaultValue="128,000" className="w-full bg-transparent text-zinc-900 dark:text-white focus:outline-none" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">인식 성공</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="mt-12 flex items-center justify-center gap-4">
                            <button
                                onClick={handlePrevious}
                                disabled={currentStep === 1 || isProcessing}
                                className={`px-10 py-4 rounded-full font-bold transition-all ${currentStep === 1
                                    ? "opacity-0 pointer-events-none"
                                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                    }`}
                            >
                                이전
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={(currentStep === 1 && !selectedFile) || isProcessing}
                                className={`px-10 py-4 rounded-full font-bold shadow-xl transition-all ${currentStep === 1 && !selectedFile
                                    ? "bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600 shadow-none"
                                    : "bg-emerald-600 text-white shadow-emerald-900/10 hover:bg-emerald-500 hover:scale-105 active:scale-95"
                                    }`}
                            >
                                {isProcessing ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    currentStep === 2 ? "등록하기" : "AI 분석 시작"
                                )}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
