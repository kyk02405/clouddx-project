
export interface Asset {
    name: string;
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    data: { value: number; date: string }[];
}

export interface WatchlistData {
    crypto: Asset[];
    stocks: Asset[];
}

export const mockWatchlist: WatchlistData = {
    crypto: [
        {
            name: "Bitcoin",
            symbol: "BTC",
            price: 128856000,
            change: -2982400,
            changePercent: -2.26,
            data: Array.from({ length: 30 }, (_, i) => ({
                date: `2024-01-${(i + 1).toString().padStart(2, "0")}`,
                value: 130000000 + Math.random() * 5000000 - 2500000,
            })),
        },
        {
            name: "Ethereum",
            symbol: "ETH",
            price: 4258000,
            change: -109200,
            changePercent: -2.50,
            data: Array.from({ length: 30 }, (_, i) => ({
                date: `2024-01-${(i + 1).toString().padStart(2, "0")}`,
                value: 4300000 + Math.random() * 200000 - 100000,
            })),
        },
        {
            name: "Tether",
            symbol: "USDT",
            price: 1463,
            change: -15,
            changePercent: -1.01,
            data: Array.from({ length: 30 }, (_, i) => ({
                date: `2024-01-${(i + 1).toString().padStart(2, "0")}`,
                value: 1460 + Math.random() * 10 - 5,
            })),
        },
        {
            name: "Cardano",
            symbol: "ADA",
            price: 511,
            change: -20,
            changePercent: -3.77,
            data: Array.from({ length: 30 }, (_, i) => ({
                date: `2024-01-${(i + 1).toString().padStart(2, "0")}`,
                value: 520 + Math.random() * 30 - 15,
            })),
        },
    ],
    stocks: [
        {
            name: "삼성전자",
            symbol: "005930",
            price: 152500,
            change: 9531,
            changePercent: 6.25,
            data: Array.from({ length: 30 }, (_, i) => ({
                date: `2024-01-${(i + 1).toString().padStart(2, "0")}`,
                value: 140000 + Math.random() * 20000,
            })),
        },
        {
            name: "Tesla Inc.",
            symbol: "TSLA",
            price: 449.06,
            change: 1.88,
            changePercent: 0.42,
            data: Array.from({ length: 30 }, (_, i) => ({
                date: `2024-01-${(i + 1).toString().padStart(2, "0")}`,
                value: 440 + Math.random() * 20 - 10,
            })),
        },
        {
            name: "NVIDIA Corp.",
            symbol: "NVDA",
            price: 187.68,
            change: 1.88,
            changePercent: 1.01,
            data: Array.from({ length: 30 }, (_, i) => ({
                date: `2024-01-${(i + 1).toString().padStart(2, "0")}`,
                value: 180 + Math.random() * 15,
            })),
        },
        {
            name: "Apple Inc.",
            symbol: "AAPL",
            price: 248.04,
            change: -13.01,
            changePercent: -4.98,
            data: Array.from({ length: 30 }, (_, i) => ({
                date: `2024-01-${(i + 1).toString().padStart(2, "0")}`,
                value: 260 - Math.random() * 15,
            })),
        },
    ],
};

export interface HoldingAsset {
    name: string;
    symbol: string;
    amount: number;
    averagePrice: number;
    currentPrice: number;
    change: number;
    changePercent: number;
    value: number;
    profit: number;
    profitPercent: number;
}

export const mockHoldings: HoldingAsset[] = [
    {
        name: "Bitcoin",
        symbol: "BTC",
        amount: 0.05,
        averagePrice: 85000000,
        currentPrice: 128856000,
        change: -2982400,
        changePercent: -2.26,
        value: 6442800,
        profit: 2192800,
        profitPercent: 51.6,
    },
    {
        name: "Ethereum",
        symbol: "ETH",
        amount: 10,
        averagePrice: 2500000,
        currentPrice: 4258000,
        change: -109200,
        changePercent: -2.50,
        value: 42580000,
        profit: 17580000,
        profitPercent: 70.3,
    },
    {
        name: "Samsung Electronics",
        symbol: "005930",
        amount: 100,
        averagePrice: 65000,
        currentPrice: 72000,
        change: 500,
        changePercent: 0.7,
        value: 7200000,
        profit: 700000,
        profitPercent: 10.7,
    },
];

export interface AssetSummary {
    totalAssets: number;
    totalInvested: number;
    totalProfit: number;
    profitRate: number;
    dailyChange: number;
    dailyChangeRate: number;
}

export const mockAssetSummary: AssetSummary = {
    totalAssets: 56222800, // mockHoldings의 value 합계 대략치
    totalInvested: 35750000,
    totalProfit: 20472800,
    profitRate: 57.26,
    dailyChange: -1200000,
    dailyChangeRate: -2.1,
};

export const mockTransactions = [
    {
        id: 1,
        type: "buy",
        asset: "Bitcoin",
        symbol: "BTC",
        amount: 0.01,
        price: 84000000,
        date: "2024-03-15",
        status: "completed",
    },
    {
        id: 2,
        type: "sell",
        asset: "Ethereum",
        symbol: "ETH",
        amount: 2,
        price: 4300000,
        date: "2024-03-14",
        status: "completed",
    },
];
