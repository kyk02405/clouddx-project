
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
                date: `2024-01-${i + 1}`,
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
                date: `2024-01-${i + 1}`,
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
                date: `2024-01-${i + 1}`,
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
                date: `2024-01-${i + 1}`,
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
                date: `2024-01-${i + 1}`,
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
                date: `2024-01-${i + 1}`,
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
                date: `2024-01-${i + 1}`,
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
                date: `2024-01-${i + 1}`,
                value: 260 - Math.random() * 15,
            })),
        },
    ],
};
