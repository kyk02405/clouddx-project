export interface Asset {
    symbol: string;
    name: string;
    price: string;
    change: string;
    isPositive: boolean;
    country?: string;
    type: "주식" | "코인" | "지수" | "펀드" | "부동산";
    logo: string;
    logoColor?: string;
    stats?: {
        open: string;
        high: string;
        low: string;
        volume: string;
        marketCap: string;
        peRatio?: string;
        dividendYield?: string;
        high52W: string;
        low52W: string;
    };
}

export const allAssets: Asset[] = [
    // 주식 - 인기 종목
    {
        symbol: "NVDA", name: "엔비디아", price: "187.67", change: "+1.53%", isPositive: true, country: "🇺🇸", type: "주식", logo: "N", logoColor: "bg-green-500 text-white",
        stats: { open: "185.00", high: "188.50", low: "184.20", volume: "45.2M", marketCap: "4.6T", peRatio: "75.2", high52W: "195.95", low52W: "78.50" }
    },
    {
        symbol: "TSLA", name: "테슬라", price: "449.06", change: "-0.07%", isPositive: false, country: "🇺🇸", type: "주식", logo: "T", logoColor: "bg-red-600 text-white",
        stats: { open: "450.10", high: "455.00", low: "445.50", volume: "32.1M", marketCap: "1.4T", peRatio: "89.5", high52W: "480.00", low52W: "152.00" }
    },
    {
        symbol: "AAPL", name: "애플", price: "248.04", change: "-0.12%", isPositive: false, country: "🇺🇸", type: "주식", logo: "🍎", logoColor: "bg-zinc-900 dark:bg-zinc-800 text-white",
        stats: { open: "249.00", high: "250.50", low: "247.10", volume: "28.5M", marketCap: "3.8T", peRatio: "32.1", dividendYield: "0.5%", high52W: "255.00", low52W: "165.00" }
    },
    {
        symbol: "005930", name: "삼성전자", price: "152,100", change: "0.00%", isPositive: true, country: "🇰🇷", type: "주식", logo: "S", logoColor: "bg-blue-600 text-white",
        stats: { open: "152,100", high: "153,500", low: "151,000", volume: "12.5M", marketCap: "890T", peRatio: "12.5", dividendYield: "2.1%", high52W: "160,000", low52W: "58,000" }
    },
    {
        symbol: "MSFT", name: "마이크로소프트", price: "415.30", change: "+0.42%", isPositive: true, country: "🇺🇸", type: "주식", logo: "M", logoColor: "bg-cyan-600 text-white",
        stats: { open: "414.00", high: "418.20", low: "413.50", volume: "18.2M", marketCap: "3.1T", peRatio: "35.4", dividendYield: "0.8%", high52W: "450.00", low52W: "310.00" }
    },
    {
        symbol: "GOOGL", name: "알파벳", price: "172.50", change: "-0.85%", isPositive: false, country: "🇺🇸", type: "주식", logo: "G", logoColor: "bg-blue-500 text-white",
        stats: { open: "174.00", high: "175.20", low: "171.80", volume: "22.5M", marketCap: "2.1T", peRatio: "25.8", high52W: "190.00", low52W: "120.00" }
    },
    {
        symbol: "AMZN", name: "아마존", price: "185.12", change: "+1.20%", isPositive: true, country: "🇺🇸", type: "주식", logo: "a", logoColor: "bg-orange-500 text-white",
        stats: { open: "183.50", high: "186.40", low: "182.80", volume: "25.8M", marketCap: "1.9T", peRatio: "42.1", high52W: "200.00", low52W: "130.00" }
    },
    {
        symbol: "META", name: "메타", price: "592.10", change: "+2.15%", isPositive: true, country: "🇺🇸", type: "주식", logo: "∞", logoColor: "bg-blue-600 text-white",
        stats: { open: "580.00", high: "595.00", low: "578.50", volume: "15.4M", marketCap: "1.5T", peRatio: "28.4", high52W: "600.00", low52W: "280.00" }
    },
    {
        symbol: "AMD", name: "AMD", price: "115.20", change: "+0.90%", isPositive: true, country: "🇺🇸", type: "주식", logo: "A", logoColor: "bg-black text-white",
        stats: { open: "114.50", high: "116.80", low: "113.80", volume: "35.1M", marketCap: "186B", peRatio: "45.2", high52W: "220.00", low52W: "95.00" }
    },
    {
        symbol: "NFLX", name: "넷플릭스", price: "720.50", change: "-1.10%", isPositive: false, country: "🇺🇸", type: "주식", logo: "N", logoColor: "bg-red-600 text-white",
        stats: { open: "725.00", high: "730.00", low: "715.00", volume: "8.5M", marketCap: "310B", peRatio: "38.5", high52W: "750.00", low52W: "400.00" }
    },
    {
        symbol: "INTC", name: "인텔", price: "22.50", change: "-0.50%", isPositive: false, country: "🇺🇸", type: "주식", logo: "i", logoColor: "bg-blue-700 text-white",
        stats: { open: "22.80", high: "23.00", low: "22.20", volume: "55.2M", marketCap: "95B", peRatio: "18.5", dividendYield: "1.5%", high52W: "50.00", low52W: "18.00" }
    },
    {
        symbol: "PLTR", name: "팔란티어", price: "45.30", change: "+3.20%", isPositive: true, country: "🇺🇸", type: "주식", logo: "P", logoColor: "bg-black text-white",
        stats: { open: "44.00", high: "46.10", low: "43.50", volume: "65.4M", marketCap: "100B", peRatio: "85.2", high52W: "50.00", low52W: "15.00" }
    },
    {
        symbol: "COIN", name: "코인베이스", price: "240.10", change: "+5.10%", isPositive: true, country: "🇺🇸", type: "주식", logo: "C", logoColor: "bg-blue-500 text-white",
        stats: { open: "230.00", high: "245.00", low: "228.00", volume: "12.1M", marketCap: "55B", peRatio: "42.5", high52W: "280.00", low52W: "70.00" }
    },
    {
        symbol: "035720", name: "카카오", price: "62,300", change: "+0.65%", isPositive: true, country: "🇰🇷", type: "주식", logo: "K", logoColor: "bg-yellow-400 text-zinc-900",
        stats: { open: "61,800", high: "62,800", low: "61,500", volume: "3.6M", marketCap: "27.3T", peRatio: "490.4", dividendYield: "0.25%", high52W: "71,600", low52W: "35,700" }
    },

    // 코인
    {
        symbol: "BTC", name: "비트코인", price: "98,400", change: "+2.1%", isPositive: true, country: "🌐", type: "코인", logo: "₿", logoColor: "bg-orange-500 text-white",
        stats: { open: "96,500", high: "99,000", low: "96,000", volume: "42.5B", marketCap: "1.9T", high52W: "100,000", low52W: "45,000" }
    },
    {
        symbol: "ETH", name: "이더리움", price: "2,450", change: "+1.2%", isPositive: true, country: "🌐", type: "코인", logo: "Ξ", logoColor: "bg-indigo-500 text-white",
        stats: { open: "2,420", high: "2,480", low: "2,410", volume: "15.2B", marketCap: "295B", high52W: "4,000", low52W: "1,500" }
    },
    {
        symbol: "SOL", name: "솔라나", price: "145.20", change: "+5.4%", isPositive: true, country: "🌐", type: "코인", logo: "S", logoColor: "bg-purple-600 text-white",
        stats: { open: "138.00", high: "148.50", low: "137.00", volume: "5.8B", marketCap: "65B", high52W: "200.00", low52W: "20.00" }
    },
    {
        symbol: "XRP", name: "리플", price: "0.62", change: "-1.5%", isPositive: false, country: "🌐", type: "코인", logo: "X", logoColor: "bg-black text-white",
        stats: { open: "0.63", high: "0.64", low: "0.61", volume: "1.2B", marketCap: "34B", high52W: "0.90", low52W: "0.40" }
    },
    {
        symbol: "DOGE", name: "도지코인", price: "0.14", change: "+8.5%", isPositive: true, country: "🌐", type: "코인", logo: "Ð", logoColor: "bg-amber-400 text-white",
        stats: { open: "0.13", high: "0.15", low: "0.12", volume: "2.5B", marketCap: "20B", high52W: "0.22", low52W: "0.06" }
    },

    // 지수/펀드/부동산 (검색용 데이터)
    {
        symbol: "SPX", name: "S&P 500", price: "5,120", change: "+0.12%", isPositive: true, country: "🇺🇸", type: "지수", logo: "S", logoColor: "bg-zinc-600 text-white",
        stats: { open: "5,115", high: "5,130", low: "5,110", volume: "-", marketCap: "-", high52W: "5,200", low52W: "4,100" }
    },
    {
        symbol: "NAS100", name: "나스닥 100", price: "18,245", change: "+0.45%", isPositive: true, country: "🇺🇸", type: "지수", logo: "N", logoColor: "bg-cyan-600 text-white",
        stats: { open: "18,150", high: "18,300", low: "18,100", volume: "-", marketCap: "-", high52W: "19,000", low52W: "14,000" }
    },
    {
        symbol: "KOSPI", name: "코스피", price: "2,560", change: "-0.34%", isPositive: false, country: "🇰🇷", type: "지수", logo: "K", logoColor: "bg-blue-800 text-white",
        stats: { open: "2,570", high: "2,575", low: "2,550", volume: "450M", marketCap: "-", high52W: "2,800", low52W: "2,200" }
    },
    {
        symbol: "SCHD", name: "Schwab 미국 배당", price: "29.14", change: "-0.10%", isPositive: false, country: "🇺🇸", type: "펀드", logo: "S", logoColor: "bg-blue-500 text-white",
        stats: { open: "29.20", high: "29.25", low: "29.10", volume: "2.1M", marketCap: "50B", dividendYield: "3.5%", high52W: "31.00", low52W: "26.00" }
    },
    {
        symbol: "TQQQ", name: "나스닥100 3배", price: "54.38", change: "+0.89%", isPositive: true, country: "🇺🇸", type: "펀드", logo: "T", logoColor: "bg-cyan-500 text-white",
        stats: { open: "54.00", high: "55.10", low: "53.80", volume: "45.2M", marketCap: "15B", high52W: "65.00", low52W: "35.00" }
    },
    {
        symbol: "VNQ", name: "Vanguard 부동산", price: "80.20", change: "+0.5%", isPositive: true, country: "🇺🇸", type: "부동산", logo: "V", logoColor: "bg-red-800 text-white",
        stats: { open: "79.80", high: "80.50", low: "79.50", volume: "3.2M", marketCap: "32B", dividendYield: "4.1%", high52W: "90.00", low52W: "70.00" }
    },
];

export const initialMyAssetSymbols = ["005930", "035720", "ETH", "BTC"];
export const miniChartPath = "M0 15 L10 12 L20 18 L30 10 L40 14 L50 8 L60 12 L70 5";
