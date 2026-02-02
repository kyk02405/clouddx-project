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

    // OCR 처리 결과 상태
    const [ocrResult, setOcrResult] = useState<{
        import_id: string;
        raw_text: string;
        items: Array<{ symbol: string; amount: number; avg_price?: number }>;
    } | null>(null);

    const steps = [
        { number: 1, title: "이미지 업로드", id: "upload" },
        { number: 2, title: "정보 확인", id: "verify" },
    ];

    const handleNext = async () => {
        if (currentStep === 1 && selectedFile) {
            // 실제 OCR API 호출
            setIsProcessing(true);
            try {
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("user_id", "demo-user");

                const uploadResponse = await fetch("http://localhost:8002/import/ocr", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadResponse.ok) throw new Error("OCR 업로드 실패");

                const uploadData = await uploadResponse.json();

                // Draft 결과 조회
                const draftResponse = await fetch(`http://localhost:8002/import/draft/${uploadData.import_id}`);
                if (!draftResponse.ok) throw new Error("OCR 결과 조회 실패");

                const draftData = await draftResponse.json();
                setOcrResult(draftData);
                setCurrentStep(2);
            } catch (error) {
                console.error("❌ OCR 처리 에러:", error);
                alert("OCR 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
            } finally {
                setIsProcessing(false);
            }
        } else if (currentStep === 2) {
            // 최종 등록 전 LocalStorage에 저장하여 폼으로 전달
            if (ocrResult?.items) {
                const cartData = ocrResult.items.map(item => ({
                    id: item.symbol,
                    uid: Math.random().toString(36).substr(2, 9),
                    symbol: item.symbol,
                    name: item.symbol, // 기본값으로 심볼 사용
                    type: "crypto" as const,
                    quantity: item.amount,
                    price: item.avg_price || 0,
                    date: new Date().toISOString(),
                    market: "Upbit"
                }));
                localStorage.setItem("ocr_cart", JSON.stringify(cartData));
            }
            router.push("/direct-register");
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

                                    <div className="flex-1 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[400px]">
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
                                            className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer relative overflow-hidden
                                                ${isDragging
                                                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 scale-[0.99]"
                                                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 hover:border-zinc-300 dark:hover:border-zinc-700"
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

                                    {/* OCR 안내 섹션 추가 */}
                                    <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <Scan className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">정확한 인식을 위한 AI 스캔 가이드</h3>
                                                <p className="text-zinc-500 dark:text-zinc-400">필수 항목들이 포함된 화면을 촬영해 주세요.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Correct Example */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-emerald-500">
                                                    <Check className="h-5 w-5" />
                                                    <span className="font-bold">좋은 예시 (Correct)</span>
                                                </div>
                                                <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden border-4 border-emerald-500 shadow-xl shadow-emerald-500/10">
                                                    <Image 
                                                        src="/ocr-samples/good.png" 
                                                        alt="Correct Example" 
                                                        fill 
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                                                    <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded">PASS</div>
                                                </div>
                                                <p className="text-sm text-zinc-500 leading-relaxed">
                                                    <strong className="text-zinc-900 dark:text-zinc-100">보유수량, 매수평균가</strong> 등의 필드명이 정확히 명시된 상세 내역 화면을 권장합니다.
                                                </p>
                                            </div>

                                            {/* Wrong Example */}
                                            <div className="space-y-4 opacity-70 grayscale-[0.5]">
                                                <div className="flex items-center gap-2 text-red-500">
                                                    <X className="h-5 w-5" />
                                                    <span className="font-bold">잘못된 예시 (Wrong)</span>
                                                </div>
                                                <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-700">
                                                    <Image 
                                                        src="/ocr-samples/bad.png" 
                                                        alt="Wrong Example" 
                                                        fill 
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-zinc-900/40 pointer-events-none" />
                                                    <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded">FAIL</div>
                                                </div>
                                                <p className="text-sm text-zinc-400 leading-relaxed">
                                                    자산 요약(Summary) 화면은 개별 자산의 상세 정보(수량/가격)가 누락되어 있어 AI가 인식하기 어렵습니다.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-8 py-4 px-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 flex items-center gap-4">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                                TIP: 종목명 주위에 괄호 티커(예: BTC)가 포함된 화면일수록 인식률이 비약적으로 향상됩니다.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: 정보 확인 (실제 OCR 결과) */}
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

                                    {/* 편집 가능한 테이블 (실제 OCR 결과) */}
                                    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold w-12">#</th>
                                                    <th className="px-4 py-3 font-semibold">종목명</th>
                                                    <th className="px-4 py-3 font-semibold">자산 타입</th>
                                                    <th className="px-4 py-3 font-semibold">보유량</th>
                                                    <th className="px-4 py-3 font-semibold">평단가</th>
                                                    <th className="px-4 py-3 font-semibold">상태</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-transparent">
                                                {ocrResult?.items.map((item, index) => (
                                                    <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                                        <td className="px-4 py-3 text-zinc-400">{index + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="text"
                                                                defaultValue={item.symbol}
                                                                className="w-full bg-transparent font-bold text-zinc-900 dark:text-white focus:outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                                defaultValue="crypto"
                                                            >
                                                                <option value="crypto">코인</option>
                                                                <option value="stock">주식</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="text"
                                                                defaultValue={item.amount}
                                                                className="w-full bg-transparent text-zinc-900 dark:text-white focus:outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/50 transition-all">
                                                                <input
                                                                    type="text"
                                                                    defaultValue={item.avg_price?.toLocaleString() || "-"}
                                                                    className="w-full bg-transparent text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none"
                                                                />
                                                                <span className="text-[10px] font-black text-zinc-400 select-none">KRW</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
                                                                <div className="relative">
                                                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                                    <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
                                                                </div>
                                                                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 tracking-tight">인식 성공</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
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
