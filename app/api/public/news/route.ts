import { NextResponse } from "next/server";

export async function GET() {
    const data = {
        all: [
            {
                id: 1,
                title: "비트코인, 45,000달러 돌파하며 강세 지속",
                summary: "기관 투자자들의 매수세가 이어지며 비트코인이 45,000달러를 돌파했습니다.",
                time: "12분 전",
                category: "BTC",
                source: "CoinDesk",
            },
            {
                id: 2,
                title: "애플, AI 기능 탑재한 아이폰 16 출시 예정",
                summary: "애플이 차세대 AI 칩을 탑재한 아이폰 16을 올해 하반기 출시할 계획입니다.",
                time: "25분 전",
                category: "US Stocks",
                source: "Bloomberg",
            },
            {
                id: 3,
                title: "이더리움 2.0 스테이킹 참여율 30% 돌파",
                summary: "이더리움 2.0 네트워크의 스테이킹 참여율이 사상 최고치를 경신했습니다.",
                time: "1시간 전",
                category: "ETH",
                source: "CryptoNews",
            },
            {
                id: 4,
                title: "삼성전자, 3분기 실적 예상치 상회",
                summary: "삼성전자가 반도체 부문 회복으로 시장 예상을 뛰어넘는 실적을 발표했습니다.",
                time: "2시간 전",
                category: "KR Stocks",
                source: "연합뉴스",
            },
            {
                id: 5,
                title: "SEC, 비트코인 현물 ETF 추가 승인 검토 중",
                summary: "미국 증권거래위원회가 여러 비트코인 현물 ETF 신청을 검토하고 있습니다.",
                time: "3시간 전",
                category: "규제",
                source: "Bloomberg",
            },
            {
                id: 6,
                title: "테슬라, 전기차 배터리 기술 혁신 발표",
                summary: "테슬라가 주행거리 50% 향상된 차세대 배터리 기술을 공개했습니다.",
                time: "4시간 전",
                category: "US Stocks",
                source: "CNBC",
            },
            {
                id: 7,
                title: "솔라나 네트워크, DeFi 거래량 신기록 달성",
                summary: "솔라나 기반 DeFi 프로토콜들의 일일 거래량이 100억 달러를 넘어섰습니다.",
                time: "5시간 전",
                category: "SOL",
                source: "The Block",
            },
        ],
        myAssets: [
            {
                id: 8,
                title: "비트코인 온체인 지표, 강세 신호 지속",
                summary: "거래소 유출량 증가와 장기 보유자 증가로 강세 전망이 우세합니다.",
                time: "30분 전",
                category: "BTC",
                source: "Glassnode",
            },
            {
                id: 9,
                title: "삼성전자, 신규 파운드리 고객 확보",
                summary: "삼성전자가 주요 글로벌 반도체 기업과 파운드리 계약을 체결했습니다.",
                time: "1시간 전",
                category: "KR Stocks",
                source: "한국경제",
            },
            {
                id: 10,
                title: "이더리움 가스비 역대 최저 수준 기록",
                summary: "레이어2 솔루션 확산으로 이더리움 메인넷 가스비가 급감했습니다.",
                time: "2시간 전",
                category: "ETH",
                source: "Etherscan",
            },
            {
                id: 11,
                title: "엔비디아, AI 반도체 수요 급증으로 가이던스 상향",
                summary: "엔비디아가 데이터센터 AI 수요 증가로 분기 매출 전망을 상향 조정했습니다.",
                time: "3시간 전",
                category: "US Stocks",
                source: "Reuters",
            },
        ],
    };

    return NextResponse.json(data);
}

