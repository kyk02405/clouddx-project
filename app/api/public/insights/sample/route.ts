import { NextResponse } from "next/server";

export async function GET() {
    const data = {
        insights: [
            {
                id: 1,
                type: "summary",
                title: "오늘의 포트폴리오 요약",
                content: "총 자산가치는 전일 대비 2.8% 상승했습니다. 암호화폐(BTC, ETH)와 주식(AAPL, TSLA)의 동반 상승으로 수익률이 개선되었으며, 한국 주식 비중 확대를 고려할 시점입니다.",
                confidence: 87,
                timestamp: "2026-01-26T10:00:00Z",
            },
            {
                id: 2,
                type: "risk",
                title: "리스크 경고",
                content: "SOL과 TSLA 포지션의 변동성이 평균 대비 각각 15%, 12% 높습니다. 고변동성 자산의 익절/손절 기준 재설정을 권장합니다.",
                level: "medium",
                affectedAssets: ["SOL", "TSLA"],
                timestamp: "2026-01-26T09:30:00Z",
            },
            {
                id: 3,
                type: "action",
                title: "추천 액션",
                content: "삼성전자 배당락일이 다가오고 있으며, 현재 배당수익률 2.8%입니다. AAPL도 실적 발표 후 상승 모멘텀이 있어 추가 매수 타이밍으로 판단됩니다.",
                priority: "high",
                expectedROI: "8-12% (3개월)",
                timestamp: "2026-01-26T08:45:00Z",
            },
        ],
    };

    return NextResponse.json(data);
}

