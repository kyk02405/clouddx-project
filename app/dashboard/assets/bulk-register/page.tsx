"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BulkRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const steps = [
    { number: 1, title: "리스트 준비" },
    { number: 2, title: "리스트 채우기" },
    { number: 3, title: "업로드" },
    { number: 4, title: "확인" },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/dashboard/assets");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Left Sidebar - Steps */}
      <div className="w-64 border-r border-gray-800 bg-gray-900 p-6">
        <h1 className="mb-8 text-xl font-bold text-white">대량 등록하기</h1>
        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex items-center gap-3 ${
                currentStep === step.number ? "text-white" : "text-gray-500"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep === step.number
                    ? "bg-white text-gray-900"
                    : currentStep > step.number
                    ? "bg-green-500 text-white"
                    : "border-2 border-gray-700"
                }`}
              >
                {currentStep > step.number ? "✓" : step.number}
              </div>
              <span className="text-sm font-medium">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-3xl">
          {/* Step 1: List Preparation */}
          {currentStep === 1 && (
            <div>
              <h2 className="mb-6 text-2xl font-bold text-white">
                종목/거래내역 리스트 준비
              </h2>
              <div className="rounded-lg bg-gray-900 p-6">
                <p className="mb-4 text-gray-300">
                  여러 개의 자산 보는 거래 내역을 CSV 파일을 업로드할 수 있습니다.
                </p>
                <p className="mb-6 text-sm text-gray-400">
                  아래 템플릿을 다운받으시고, 각 칼럼 리스트를 명시대로 채워주요.
                </p>

                <div className="space-y-3">
                  <button className="flex w-full items-center justify-between rounded-lg bg-gray-800 p-4 transition hover:bg-gray-750">
                    <span className="text-white">Windows용 탬플릿 다운로드</span>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button className="flex w-full items-center justify-between rounded-lg bg-gray-800 p-4 transition hover:bg-gray-750">
                    <span className="text-white">Mac용용 탬플릿 다운로드</span>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  CSV 파일은 엑셀로, excel, numbers 등 모든 프로그램으로 편집 가능합니다.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Fill List */}
          {currentStep === 2 && (
            <div>
              <h2 className="mb-6 text-2xl font-bold text-white">리스트 채우는 방법</h2>
              <div className="rounded-lg bg-gray-900 p-6">
                <p className="mb-6 text-gray-300">
                  종목별 최신 보유 현황을 입력하고자하시거나 거래 내역을 컴퓨겠습니다. 각 방법의 차이는 아래와 같습니다.
                </p>

                <div className="mb-6 space-y-6">
                  {/* Method 1 */}
                  <div>
                    <h3 className="mb-3 font-semibold text-white">
                      1. 종목별 최신 보유 현황 업로드
                    </h3>
                    <p className="mb-3 text-sm text-gray-400">
                      현재 보유 증권의 실을 한번만 엽력도 충분다, 평균가 파악도시나 증권끓를 참고하세요.
                      증권끓, 추국, 옵션 모든 가능하.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-700 text-sm">
                        <thead className="bg-gray-800">
                          <tr>
                            <th className="border border-gray-700 px-3 py-2 text-left text-gray-300">증권종목</th>
                            <th className="border border-gray-700 px-3 py-2 text-left text-gray-300">수량</th>
                            <th className="border border-gray-700 px-3 py-2 text-left text-gray-300">평단가</th>
                            <th className="border border-gray-700 px-3 py-2 text-left text-gray-300">평균</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800/50">
                          <tr>
                            <td className="border border-gray-700 px-3 py-2 text-white">삼성전자</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">2</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">88,000</td>
                            <td className="border border-gray-700 px-3 py-2 text-white"></td>
                          </tr>
                          <tr>
                            <td className="border border-gray-700 px-3 py-2 text-white">테슬라</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">10</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">256.50</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">1,250</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Method 2 */}
                  <div>
                    <h3 className="mb-3 font-semibold text-white">2. 거래내역 업로드</h3>
                    <p className="mb-3 text-sm text-gray-400">
                      증권끓 거래내역 현황를 입력하시면 자동으로석 평균가 계산이 가능합니다.
                      <br />
                      거래 발생일을 포함하 다운로드하시여 거래 수익률 시지 그래프에 나타낼 수 있는 조년 정 장 있습니다.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-700 text-sm">
                        <thead className="bg-gray-800">
                          <tr>
                            <th className="border border-gray-700 px-3 py-2 text-left text-gray-300">증권종목 이든</th>
                            <th className="border border-gray-700 px-3 py-2 text-left text-gray-300">수량</th>
                            <th className="border border-gray-700 px-3 py-2 text-left text-gray-300">평단가</th>
                            <th className="border border-gray-700 px-3 py-2 text-left text-gray-300">평균</th>
                            <th className="border border-gray-700 px-3 py-2 text-left text-gray-300">거래 유형</th>
                            <th className="border border-gray-700 px-3 py-2 text-left text-gray-300">기대타</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800/50">
                          <tr>
                            <td className="border border-gray-700 px-3 py-2 text-white">삼성전자</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">2</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">88,000</td>
                            <td className="border border-gray-700 px-3 py-2 text-white"></td>
                            <td className="border border-gray-700 px-3 py-2 text-white">매수</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">2022-04-07 16:40:30</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-700 px-3 py-2 text-white">테슬라</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">10</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">256.50</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">1,250</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">매수</td>
                            <td className="border border-gray-700 px-3 py-2 text-white">2023-04-07</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Upload */}
          {currentStep === 3 && (
            <div>
              <h2 className="mb-6 text-2xl font-bold text-white">업로드</h2>
              <div className="rounded-lg bg-gray-900 p-6">
                <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/50">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-500"
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
                    <p className="mt-4 text-gray-300">CSV 파일을 여기에 드래그하거나</p>
                    <button className="mt-2 rounded-lg bg-green-600 px-6 py-2 text-white transition hover:bg-green-700">
                      파일 선택
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div>
              <h2 className="mb-6 text-2xl font-bold text-white">확인</h2>
              <div className="rounded-lg bg-gray-900 p-6">
                <div className="mb-4 flex items-center gap-3 text-green-400">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg font-semibold">업로드 완료!</span>
                </div>
                <p className="text-gray-300">2개의 자산이 성공적으로 등록되었습니다.</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="rounded-lg border border-gray-700 px-6 py-2 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              이전
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg bg-white px-6 py-2 font-medium text-gray-900 transition hover:bg-gray-100"
            >
              {currentStep === 4 ? "완료" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
