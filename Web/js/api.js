const API_BASE = 'https://api.coingecko.com/api/v3';

// Mock Data Generator (API 실패시 사용)
const getMockData = (currency) => {
    const names = ['Bitcoin','Ethereum','Tether','BNB','Solana','XRP','USDC','Cardano','Avalanche','Dogecoin'];
    const symbols = ['btc','eth','usdt','bnb','sol','xrp','usdc','ada','avax','doge'];
    
    return names.map((name, i) => ({
        id: names[i].toLowerCase(),
        market_cap_rank: i + 1,
        name: name,
        symbol: symbols[i],
        current_price: 10000 / (i + 1),
        price_change_percentage_1h_in_currency: Math.random() * 1 - 0.5,
        price_change_percentage_24h_in_currency: Math.random() * 10 - 5,
        price_change_percentage_7d_in_currency: Math.random() * 20 - 10,
        total_volume: 50000000 * (10-i),
        market_cap: 1000000000 * (10-i),
        high_24h: 11000 / (i+1),
        low_24h: 9000 / (i+1),
        circulating_supply: 19000000,
        max_supply: 21000000,
        image: `https://assets.coingecko.com/coins/images/${i+1}/small/bitcoin.png`, 
        sparkline_in_7d: { price: Array.from({length: 20}, () => Math.random() * 100) }
    }));
};

// 안전한 Fetch 함수
async function safeFetch(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('API Error');
        return await res.json();
    } catch (e) {
        console.warn('API 호출 실패, Mock 데이터 사용:', e);
        return null; // 실패 시 null 반환
    }
}

export const fetchGlobal = async () => safeFetch(`${API_BASE}/global`);
export const fetchTrending = async () => safeFetch(`${API_BASE}/search/trending`);

export const fetchMarkets = async (currency) => {
    const data = await safeFetch(`${API_BASE}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h,24h,7d`);
    if (data) return data;
    return getMockData(currency); // 실패하면 Mock 데이터 반환
};

// 상세 차트용 히스토리 (API 없으면 랜덤 생성)
export const fetchHistory = async (coinId, currency) => {
    const data = await safeFetch(`${API_BASE}/coins/${coinId}/market_chart?vs_currency=${currency}&days=7`);
    if(data && data.prices) return data.prices.map(p => p[1]);
    return Array.from({length: 50}, () => 100 + Math.random() * 20); // 랜덤
};