import { formatNumber, generateSparkline, generateDetailChart } from './utils.js';

// 대시보드 테이블 렌더링
export const renderTable = (coins, currency, favorites) => {
    const tbody = document.getElementById('tableBody');
    if (!coins.length) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 40px;">데이터가 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = coins.map(coin => {
        const isFav = favorites.includes(coin.id);
        const p1h = coin.price_change_percentage_1h_in_currency || 0;
        const p24h = coin.price_change_percentage_24h_in_currency || 0;
        const p7d = coin.price_change_percentage_7d_in_currency || 0;
        
        // 중요: data-id 속성으로 클릭 시 id 식별
        return `
        <tr data-id="${coin.id}">
            <td data-label="즐겨찾기" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('toggleFav', {detail: '${coin.id}'}))">
                <span class="star-btn ${isFav ? 'active' : ''}">★</span>
            </td>
            <td data-label="순위" class="text-sub">#${coin.market_cap_rank}</td>
            <td data-label="코인">
                <div class="coin-info">
                    <img src="${coin.image}" alt="">
                    <div><div class="bold">${coin.name}</div><div class="coin-symbol">${coin.symbol}</div></div>
                </div>
            </td>
            <td data-label="가격" class="bold">${formatNumber(coin.current_price, 'currency', currency)}</td>
            <td data-label="1h" class="${p1h >= 0 ? 'text-up' : 'text-down'}">${formatNumber(p1h, 'percent')}</td>
            <td data-label="24h" class="${p24h >= 0 ? 'text-up' : 'text-down'}">${formatNumber(p24h, 'percent')}</td>
            <td data-label="7d" class="${p7d >= 0 ? 'text-up' : 'text-down'}">${formatNumber(p7d, 'percent')}</td>
            <td data-label="거래량">${formatNumber(coin.total_volume, 'currency', currency)}</td>
            <td data-label="시가총액">${formatNumber(coin.market_cap, 'currency', currency)}</td>
            <td data-label="7일 차트"><div class="sparkline-container">${generateSparkline(coin.sparkline_in_7d.price, p7d >= 0)}</div></td>
        </tr>`;
    }).join('');
};

// 상세 페이지 렌더링 (CoinGecko 스타일)
export const renderDetail = (coin, history, currency) => {
    const container = document.getElementById('detail-content');
    const isUp = coin.price_change_percentage_24h_in_currency >= 0;

    container.innerHTML = `
        <div class="detail-header">
            <img src="${coin.image}" class="detail-icon">
            <div>
                <h1 class="bold" style="font-size:28px;">${coin.name} <span class="text-sub text-lg">(${coin.symbol.toUpperCase()})</span></h1>
                <span class="badge-rank">Rank #${coin.market_cap_rank}</span>
            </div>
        </div>

        <div class="detail-grid">
            <!-- Left Panel -->
            <div class="card">
                <div class="text-sub bold">현재 가격</div>
                <div class="price-large">${formatNumber(coin.current_price, 'currency', currency)}</div>
                <div class="${isUp ? 'text-up' : 'text-down'} bold" style="font-size:16px; margin-bottom: 24px;">
                    ${formatNumber(coin.price_change_percentage_24h_in_currency, 'percent')} (24h)
                </div>

                <div class="stat-row"><span class="stat-label">시가총액</span><span class="bold">${formatNumber(coin.market_cap, 'currency', currency)}</span></div>
                <div class="stat-row"><span class="stat-label">24h 거래량</span><span class="bold">${formatNumber(coin.total_volume, 'currency', currency)}</span></div>
                <div class="stat-row"><span class="stat-label">24h 고가/저가</span><span>${formatNumber(coin.high_24h, 'currency', currency)} / ${formatNumber(coin.low_24h, 'currency', currency)}</span></div>
                <div class="stat-row"><span class="stat-label">유통 공급량</span><span>${formatNumber(coin.circulating_supply)}</span></div>
                <div class="stat-row"><span class="stat-label">최대 공급량</span><span>${formatNumber(coin.max_supply)}</span></div>
            </div>

            <!-- Right Panel (Chart) -->
            <div class="card chart-box">
                <div class="chart-header-row">
                    <h3 class="bold">가격 차트 (7일)</h3>
                    <div class="chart-tabs">
                        <div class="chart-tab active">7D</div>
                        <div class="chart-tab">1M</div>
                    </div>
                </div>
                <div style="height: 300px; width: 100%;">
                    ${generateDetailChart(history, isUp)}
                </div>
            </div>
        </div>
    `;
};