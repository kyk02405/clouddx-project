// 숫자/통화 포맷팅
export const formatNumber = (num, type = 'standard', currency = 'krw') => {
    if (num === null || num === undefined) return '-';
    
    if (type === 'currency') {
        return new Intl.NumberFormat('ko-KR', { 
            style: 'currency', 
            currency: currency.toUpperCase(),
            maximumSignificantDigits: 10 
        }).format(num);
    }
    
    if (type === 'percent') {
        return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
    }
    
    // 큰 숫자 축약
    if (num > 1e12) return (num / 1e12).toFixed(2) + ' T';
    if (num > 1e9) return (num / 1e9).toFixed(2) + ' B';
    if (num > 1e6) return (num / 1e6).toFixed(2) + ' M';
    
    return num.toLocaleString();
};

// 미니 스파크라인 (리스트용)
export const generateSparkline = (prices, isUp) => {
    const width = 120, height = 40;
    return createSvgPath(prices, width, height, isUp, false);
};

// 상세 페이지용 대형 영역 차트
export const generateDetailChart = (prices, isUp) => {
    return createSvgPath(prices, 800, 300, isUp, true);
};

// 내부 차트 생성 로직
function createSvgPath(prices, width, height, isUp, isArea) {
    if(!prices || prices.length === 0) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const padding = isArea ? 20 : 0; // 여백

    const points = prices.map((p, i) => {
        const x = (i / (prices.length - 1)) * width;
        const y = height - ((p - min) / range) * (height - padding * 2) - padding;
        return `${x},${y}`;
    }).join(' ');

    const color = isUp ? '#00b894' : '#d63031'; // Mint or Red
    
    if (isArea) {
        return `
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%; height:100%;">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${color};stop-opacity:0.2" />
                    <stop offset="100%" style="stop-color:${color};stop-opacity:0" />
                </linearGradient>
            </defs>
            <path d="M0,${height} L0,${height} L${points.split(' ')[0]} ${points} L${width},${height} Z" fill="url(#grad)" />
            <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
        </svg>`;
    } else {
        return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" fill="none"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
}