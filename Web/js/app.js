import * as API from './api.js';
import * as UI from './ui.js';
import { formatNumber } from './utils.js';

const state = {
    currency: 'krw',
    coins: [],
    favorites: JSON.parse(localStorage.getItem('favorites')) || [],
    filter: 'all',
    highlight: false,
    search: '',
    sortBy: 'market_cap_rank',
    sortOrder: 'asc'
};

// 초기화
async function init() {
    setLoading(true);
    
    // 1. 데이터 가져오기
    const [globalRes, trendingRes, marketData] = await Promise.all([
        API.fetchGlobal(),
        API.fetchTrending(),
        API.fetchMarkets(state.currency)
    ]);

    state.coins = marketData;

    // 2. 상단 글로벌 바 렌더링
    if (globalRes && globalRes.data) {
        const g = globalRes.data;
        document.getElementById('global-stats').innerHTML = 
            `코인: <span class="bold">${g.active_cryptocurrencies}</span> &nbsp; 거래소: <span class="bold">${g.markets}</span> &nbsp; ` +
            `점유율: BTC ${g.market_cap_percentage.btc.toFixed(1)}%`;
            
        // 메인 카드 업데이트
        document.getElementById('total-mcap').innerText = formatNumber(g.total_market_cap[state.currency], 'currency', state.currency);
        document.getElementById('total-vol').innerText = formatNumber(g.total_volume[state.currency], 'currency', state.currency);
    }

    // 3. 트렌딩 렌더링
    if (trendingRes && trendingRes.coins) {
        document.getElementById('trending-list').innerHTML = trendingRes.coins.slice(0,3).map(i => 
            `<li><div class="trend-coin"><img src="${i.item.small}"><span>${i.item.name}</span></div></li>`
        ).join('');
    }

    renderDashboard();
    setLoading(false);
}

// 대시보드 화면 그리기 (필터/정렬 적용)
function renderDashboard() {
    let list = state.coins.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(state.search) || c.symbol.toLowerCase().includes(state.search);
        const matchFav = state.filter === 'favorites' ? state.favorites.includes(c.id) : true;
        const matchHigh = state.highlight ? c.price_change_percentage_24h_in_currency >= 0 : true;
        return matchSearch && matchFav && matchHigh;
    });

    list.sort((a, b) => {
        let valA = a[state.sortBy] || 0;
        let valB = b[state.sortBy] || 0;
        return state.sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    UI.renderTable(list, state.currency, state.favorites);
    
    document.getElementById('coinTable').classList.remove('hidden');
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
}

// 상세 페이지 보기
async function showDetail(coinId) {
    const coin = state.coins.find(c => c.id === coinId);
    if(!coin) return;

    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('detail-view').classList.remove('hidden');
    window.scrollTo(0,0);

    const history = await API.fetchHistory(coinId, state.currency);
    UI.renderDetail(coin, history, state.currency);
}

// 로딩 상태 처리
function setLoading(loading) {
    const loader = document.getElementById('loading');
    const table = document.getElementById('coinTable');
    if(loading) {
        loader.classList.remove('hidden');
        table.classList.add('hidden');
    } else {
        loader.classList.add('hidden');
    }
}

// --- 이벤트 리스너 ---

// 즐겨찾기 (Custom Event)
window.addEventListener('toggleFav', (e) => {
    const id = e.detail;
    if (state.favorites.includes(id)) state.favorites = state.favorites.filter(f => f !== id);
    else state.favorites.push(id);
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
    renderDashboard();
});

// 테이블 행 클릭 -> 상세페이지 이동
document.getElementById('tableBody').addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (row && row.dataset.id) showDetail(row.dataset.id);
});

// 뒤로가기
document.getElementById('backBtn').addEventListener('click', () => {
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
});

// 검색, 필터, 정렬
document.getElementById('searchInput').addEventListener('input', (e) => { state.search = e.target.value.toLowerCase(); renderDashboard(); });
document.getElementById('currencySelect').addEventListener('change', (e) => { state.currency = e.target.value; init(); });
document.getElementById('refreshBtn').addEventListener('click', init);
document.getElementById('retryBtn').addEventListener('click', init);

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.filter = e.target.dataset.filter;
        renderDashboard();
    });
});

document.getElementById('highlightToggle').addEventListener('click', (e) => {
    state.highlight = !state.highlight;
    e.currentTarget.classList.toggle('active');
    renderDashboard();
});

document.querySelectorAll('.sort-btn').forEach(th => {
    th.addEventListener('click', () => {
        const key = th.dataset.key;
        if (state.sortBy === key) state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
        else { state.sortBy = key; state.sortOrder = 'desc'; }
        renderDashboard();
    });
});

// 앱 시작
document.addEventListener('DOMContentLoaded', init);