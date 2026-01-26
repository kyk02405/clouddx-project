import { NextResponse } from "next/server";

export async function GET() {
    const data = {
        crypto: {
            topMovers: [
                { symbol: "BTC", name: "Bitcoin", price: 45230, change: 5.2, volume: "32.5B" },
                { symbol: "ETH", name: "Ethereum", price: 2340, change: 3.8, volume: "15.2B" },
                { symbol: "SOL", name: "Solana", price: 98.5, change: -2.1, volume: "2.8B" },
            ],
            volatility: [
                { symbol: "DOGE", name: "Dogecoin", price: 0.082, volatility: 12.5, range: "0.075-0.089" },
                { symbol: "SHIB", name: "Shiba Inu", price: 0.000015, volatility: 10.3, range: "0.000013-0.000017" },
                { symbol: "AVAX", name: "Avalanche", price: 36.2, volatility: 8.7, range: "33.1-39.5" },
            ],
        },
        stocks: {
            topMovers: [
                { symbol: "AAPL", name: "Apple Inc.", price: 185.5, change: 2.3, volume: "58.2M", market: "US" },
                { symbol: "TSLA", name: "Tesla Inc.", price: 242.8, change: 4.1, volume: "125.3M", market: "US" },
                { symbol: "005930", name: "삼성전자", price: 73500, change: 1.8, volume: "15.2M", market: "KR" },
                { symbol: "NVDA", name: "NVIDIA Corp.", price: 495.2, change: -1.2, volume: "42.1M", market: "US" },
                { symbol: "000660", name: "SK하이닉스", price: 128000, change: 3.5, volume: "8.5M", market: "KR" },
            ],
            volatility: [
                { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.3, volatility: 8.2, range: "138.5-145.8", market: "US" },
                { symbol: "MSFT", name: "Microsoft Corp.", price: 378.9, volatility: 6.5, range: "372.1-383.2", market: "US" },
                { symbol: "035420", name: "NAVER", price: 215000, volatility: 9.1, range: "205000-225000", market: "KR" },
            ],
        },
        trendKeywords: [
            { keyword: "ETF 승인", count: 245, trend: "up" },
            { keyword: "비트코인 반감기", count: 189, trend: "up" },
            { keyword: "AI 반도체", count: 178, trend: "up" },
            { keyword: "SEC 규제", count: 156, trend: "neutral" },
            { keyword: "테슬라 실적", count: 142, trend: "up" },
            { keyword: "알트코인 시즌", count: 132, trend: "up" },
            { keyword: "삼성전자 배당", count: 115, trend: "neutral" },
        ],
    };

    return NextResponse.json(data);
}

