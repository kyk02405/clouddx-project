"""
============================================
Stock Search Service
============================================

종목 검색 기능:
- 국내 주식: KRX Open API에서 전체 상장 종목 조회 (24h Redis 캐시)
             조회 실패 시 embedded fallback 목록으로 대체
- 해외 주식: S&P500/NASDAQ 주요 종목 embedded 목록
- 코인:      주요 암호화폐 embedded 목록
"""

import json
import logging

import httpx

from ..cache import cache_get, cache_set

logger = logging.getLogger(__name__)

_KR_CACHE_KEY = "stock_search:kr_list"
_KR_CACHE_TTL = 86400  # 24시간

# ============================================================
# 국내 주식 Fallback (KRX 조회 실패 시 사용)
# KOSPI/KOSDAQ 시가총액 상위 종목
# ============================================================
_KR_FALLBACK: list[tuple[str, str, str]] = [
    ("005930", "삼성전자", "KOSPI"),
    ("000660", "SK하이닉스", "KOSPI"),
    ("035420", "NAVER", "KOSPI"),
    ("005380", "현대차", "KOSPI"),
    ("000270", "기아", "KOSPI"),
    ("035720", "카카오", "KOSPI"),
    ("373220", "LG에너지솔루션", "KOSPI"),
    ("068270", "셀트리온", "KOSPI"),
    ("105560", "KB금융", "KOSPI"),
    ("055550", "신한지주", "KOSPI"),
    ("051910", "LG화학", "KOSPI"),
    ("006400", "삼성SDI", "KOSPI"),
    ("207940", "삼성바이오로직스", "KOSPI"),
    ("028260", "삼성물산", "KOSPI"),
    ("096770", "SK이노베이션", "KOSPI"),
    ("003550", "LG", "KOSPI"),
    ("066570", "LG전자", "KOSPI"),
    ("032830", "삼성생명", "KOSPI"),
    ("010950", "S-Oil", "KOSPI"),
    ("011170", "롯데케미칼", "KOSPI"),
    ("017670", "SK텔레콤", "KOSPI"),
    ("030200", "KT", "KOSPI"),
    ("015760", "한국전력", "KOSPI"),
    ("033780", "KT&G", "KOSPI"),
    ("090430", "아모레퍼시픽", "KOSPI"),
    ("018260", "삼성에스디에스", "KOSPI"),
    ("034730", "SK", "KOSPI"),
    ("034020", "두산에너빌리티", "KOSPI"),
    ("012330", "현대모비스", "KOSPI"),
    ("000810", "삼성화재", "KOSPI"),
    ("086790", "하나금융지주", "KOSPI"),
    ("138040", "메리츠금융지주", "KOSPI"),
    ("047050", "포스코인터내셔널", "KOSPI"),
    ("005490", "POSCO홀딩스", "KOSPI"),
    ("042660", "한화오션", "KOSPI"),
    ("009150", "삼성전기", "KOSPI"),
    ("010130", "고려아연", "KOSPI"),
    ("018880", "한온시스템", "KOSPI"),
    ("003490", "대한항공", "KOSPI"),
    ("001570", "금양", "KOSPI"),
    ("024110", "기업은행", "KOSPI"),
    ("000100", "유한양행", "KOSPI"),
    ("326030", "SK바이오팜", "KOSPI"),
    ("196170", "알테오젠", "KOSDAQ"),
    ("263750", "펄어비스", "KOSDAQ"),
    ("039030", "이오테크닉스", "KOSDAQ"),
    ("035900", "JYP Ent.", "KOSDAQ"),
    ("122870", "와이지엔터테인먼트", "KOSDAQ"),
    ("041510", "에스엠", "KOSDAQ"),
    ("293490", "카카오게임즈", "KOSDAQ"),
    ("357780", "솔브레인", "KOSDAQ"),
    ("091990", "셀트리온헬스케어", "KOSDAQ"),
    ("328130", "루닛", "KOSDAQ"),
    ("950130", "엑스페릭스", "KOSDAQ"),
    ("236810", "엔씨소프트", "KOSPI"),
    ("251270", "넷마블", "KOSPI"),
    ("035760", "CJ ENM", "KOSDAQ"),
    ("112040", "위메이드", "KOSDAQ"),
]

# ============================================================
# 해외 주식 Embedded 목록 (S&P 500 주요 + 인기 종목)
# ============================================================
_US_STOCKS: list[dict] = [
    # Tech Mega Cap
    {"symbol": "NVDA", "name": "NVIDIA Corporation"},
    {"symbol": "AAPL", "name": "Apple Inc."},
    {"symbol": "MSFT", "name": "Microsoft Corporation"},
    {"symbol": "GOOGL", "name": "Alphabet Inc. (Class A)"},
    {"symbol": "GOOG", "name": "Alphabet Inc. (Class C)"},
    {"symbol": "AMZN", "name": "Amazon.com Inc."},
    {"symbol": "META", "name": "Meta Platforms Inc."},
    {"symbol": "TSLA", "name": "Tesla Inc."},
    {"symbol": "AVGO", "name": "Broadcom Inc."},
    {"symbol": "TSM", "name": "Taiwan Semiconductor Manufacturing"},
    # Financials
    {"symbol": "JPM", "name": "JPMorgan Chase & Co."},
    {"symbol": "V", "name": "Visa Inc."},
    {"symbol": "MA", "name": "Mastercard Inc."},
    {"symbol": "BAC", "name": "Bank of America Corp."},
    {"symbol": "WFC", "name": "Wells Fargo & Company"},
    {"symbol": "GS", "name": "Goldman Sachs Group Inc."},
    {"symbol": "MS", "name": "Morgan Stanley"},
    {"symbol": "BRK-B", "name": "Berkshire Hathaway Inc. (B)"},
    {"symbol": "C", "name": "Citigroup Inc."},
    {"symbol": "AXP", "name": "American Express Company"},
    {"symbol": "SCHW", "name": "Charles Schwab Corp."},
    {"symbol": "BLK", "name": "BlackRock Inc."},
    # Consumer / Retail
    {"symbol": "WMT", "name": "Walmart Inc."},
    {"symbol": "COST", "name": "Costco Wholesale Corp."},
    {"symbol": "MCD", "name": "McDonald's Corporation"},
    {"symbol": "NKE", "name": "Nike Inc."},
    {"symbol": "SBUX", "name": "Starbucks Corporation"},
    {"symbol": "TGT", "name": "Target Corporation"},
    {"symbol": "HD", "name": "The Home Depot Inc."},
    {"symbol": "LOW", "name": "Lowe's Companies Inc."},
    {"symbol": "TJX", "name": "TJX Companies Inc."},
    {"symbol": "LULU", "name": "Lululemon Athletica Inc."},
    # Media / Entertainment
    {"symbol": "DIS", "name": "The Walt Disney Company"},
    {"symbol": "NFLX", "name": "Netflix Inc."},
    {"symbol": "SPOT", "name": "Spotify Technology S.A."},
    {"symbol": "PARA", "name": "Paramount Global"},
    {"symbol": "WBD", "name": "Warner Bros. Discovery Inc."},
    # Healthcare / Pharma
    {"symbol": "LLY", "name": "Eli Lilly and Company"},
    {"symbol": "JNJ", "name": "Johnson & Johnson"},
    {"symbol": "UNH", "name": "UnitedHealth Group Inc."},
    {"symbol": "MRK", "name": "Merck & Co. Inc."},
    {"symbol": "PFE", "name": "Pfizer Inc."},
    {"symbol": "ABBV", "name": "AbbVie Inc."},
    {"symbol": "NVO", "name": "Novo Nordisk A/S"},
    {"symbol": "BMY", "name": "Bristol-Myers Squibb Company"},
    {"symbol": "AMGN", "name": "Amgen Inc."},
    {"symbol": "GILD", "name": "Gilead Sciences Inc."},
    # Semiconductors
    {"symbol": "AMD", "name": "Advanced Micro Devices Inc."},
    {"symbol": "INTC", "name": "Intel Corporation"},
    {"symbol": "QCOM", "name": "QUALCOMM Inc."},
    {"symbol": "MU", "name": "Micron Technology Inc."},
    {"symbol": "AMAT", "name": "Applied Materials Inc."},
    {"symbol": "LRCX", "name": "Lam Research Corporation"},
    {"symbol": "ASML", "name": "ASML Holding N.V."},
    {"symbol": "KLAC", "name": "KLA Corporation"},
    {"symbol": "TXN", "name": "Texas Instruments Inc."},
    {"symbol": "ARM", "name": "Arm Holdings plc"},
    # Enterprise / Cloud / SaaS
    {"symbol": "ORCL", "name": "Oracle Corporation"},
    {"symbol": "CRM", "name": "Salesforce Inc."},
    {"symbol": "ADBE", "name": "Adobe Inc."},
    {"symbol": "NOW", "name": "ServiceNow Inc."},
    {"symbol": "SNOW", "name": "Snowflake Inc."},
    {"symbol": "PLTR", "name": "Palantir Technologies Inc."},
    {"symbol": "DDOG", "name": "Datadog Inc."},
    {"symbol": "CRWD", "name": "CrowdStrike Holdings Inc."},
    {"symbol": "ZS", "name": "Zscaler Inc."},
    {"symbol": "PANW", "name": "Palo Alto Networks Inc."},
    {"symbol": "NET", "name": "Cloudflare Inc."},
    {"symbol": "TEAM", "name": "Atlassian Corporation"},
    {"symbol": "SHOP", "name": "Shopify Inc."},
    # AI / New Tech
    {"symbol": "SMCI", "name": "Super Micro Computer Inc."},
    {"symbol": "DELL", "name": "Dell Technologies Inc."},
    {"symbol": "HPE", "name": "Hewlett Packard Enterprise"},
    {"symbol": "IONQ", "name": "IonQ Inc."},
    {"symbol": "QUBT", "name": "Quantum Computing Inc."},
    # Crypto / Fintech
    {"symbol": "COIN", "name": "Coinbase Global Inc."},
    {"symbol": "MSTR", "name": "MicroStrategy Inc."},
    {"symbol": "HOOD", "name": "Robinhood Markets Inc."},
    {"symbol": "SQ", "name": "Block Inc. (Square)"},
    {"symbol": "PYPL", "name": "PayPal Holdings Inc."},
    {"symbol": "SOFI", "name": "SoFi Technologies Inc."},
    # Mobility / Logistics
    {"symbol": "UBER", "name": "Uber Technologies Inc."},
    {"symbol": "LYFT", "name": "Lyft Inc."},
    {"symbol": "ABNB", "name": "Airbnb Inc."},
    {"symbol": "BKNG", "name": "Booking Holdings Inc."},
    {"symbol": "EXPE", "name": "Expedia Group Inc."},
    # China Stocks
    {"symbol": "BABA", "name": "Alibaba Group Holding"},
    {"symbol": "JD", "name": "JD.com Inc."},
    {"symbol": "PDD", "name": "PDD Holdings Inc. (Pinduoduo)"},
    {"symbol": "BIDU", "name": "Baidu Inc."},
    {"symbol": "NIO", "name": "NIO Inc."},
    {"symbol": "LI", "name": "Li Auto Inc."},
    {"symbol": "XPEV", "name": "XPeng Inc."},
    # EV / Auto
    {"symbol": "GM", "name": "General Motors Company"},
    {"symbol": "F", "name": "Ford Motor Company"},
    {"symbol": "RIVN", "name": "Rivian Automotive Inc."},
    {"symbol": "LCID", "name": "Lucid Group Inc."},
    # Energy
    {"symbol": "XOM", "name": "Exxon Mobil Corporation"},
    {"symbol": "CVX", "name": "Chevron Corporation"},
    {"symbol": "COP", "name": "ConocoPhillips"},
    {"symbol": "OXY", "name": "Occidental Petroleum Corp."},
    # Telecom
    {"symbol": "T", "name": "AT&T Inc."},
    {"symbol": "VZ", "name": "Verizon Communications Inc."},
    {"symbol": "TMUS", "name": "T-Mobile US Inc."},
    # Aerospace / Defense
    {"symbol": "BA", "name": "Boeing Company"},
    {"symbol": "LMT", "name": "Lockheed Martin Corporation"},
    {"symbol": "RTX", "name": "RTX Corporation (Raytheon)"},
    {"symbol": "NOC", "name": "Northrop Grumman Corporation"},
    # ETFs
    {"symbol": "SPY", "name": "SPDR S&P 500 ETF Trust"},
    {"symbol": "QQQ", "name": "Invesco QQQ Trust (NASDAQ 100)"},
    {"symbol": "IWM", "name": "iShares Russell 2000 ETF"},
    {"symbol": "VTI", "name": "Vanguard Total Stock Market ETF"},
    {"symbol": "VOO", "name": "Vanguard S&P 500 ETF"},
    {"symbol": "SCHD", "name": "Schwab US Dividend Equity ETF"},
    {"symbol": "TQQQ", "name": "ProShares UltraPro QQQ (3x)"},
    {"symbol": "SOXL", "name": "Direxion Daily Semiconductor Bull 3X"},
    {"symbol": "SOXX", "name": "iShares Semiconductor ETF"},
    {"symbol": "ARKK", "name": "ARK Innovation ETF"},
    {"symbol": "GLD", "name": "SPDR Gold Shares ETF"},
    {"symbol": "SLV", "name": "iShares Silver Trust ETF"},
]

# ============================================================
# 암호화폐 Embedded 목록
# ============================================================
_CRYPTO_LIST: list[dict] = [
    {"symbol": "BTC", "name": "Bitcoin"},
    {"symbol": "ETH", "name": "Ethereum"},
    {"symbol": "XRP", "name": "Ripple"},
    {"symbol": "SOL", "name": "Solana"},
    {"symbol": "DOGE", "name": "Dogecoin"},
    {"symbol": "ADA", "name": "Cardano"},
    {"symbol": "AVAX", "name": "Avalanche"},
    {"symbol": "DOT", "name": "Polkadot"},
    {"symbol": "LINK", "name": "Chainlink"},
    {"symbol": "MATIC", "name": "Polygon"},
    {"symbol": "UNI", "name": "Uniswap"},
    {"symbol": "ATOM", "name": "Cosmos"},
    {"symbol": "LTC", "name": "Litecoin"},
    {"symbol": "BCH", "name": "Bitcoin Cash"},
    {"symbol": "FIL", "name": "Filecoin"},
    {"symbol": "NEAR", "name": "NEAR Protocol"},
    {"symbol": "ARB", "name": "Arbitrum"},
    {"symbol": "OP", "name": "Optimism"},
    {"symbol": "APT", "name": "Aptos"},
    {"symbol": "SUI", "name": "Sui"},
    {"symbol": "TON", "name": "Toncoin"},
    {"symbol": "SHIB", "name": "Shiba Inu"},
    {"symbol": "PEPE", "name": "Pepe"},
    {"symbol": "TRX", "name": "TRON"},
    {"symbol": "XLM", "name": "Stellar"},
]


# ============================================================
# KRX 전체 종목 조회 (KRX Open API)
# ============================================================

async def _fetch_krx_list() -> list[dict] | None:
    """KRX 공공 API에서 전체 상장 종목 조회"""
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                "https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd",
                data={
                    "bld": "dbms/MDC/STAT/standard/MDCSTAT01901",
                    "locale": "ko_KR",
                    "mktId": "ALL",
                    "share": "1",
                    "money": "1",
                    "csvxls_isNo": "false",
                },
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Referer": "https://data.krx.co.kr",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            )
            resp.raise_for_status()
            items = resp.json().get("output", [])
            result = [
                {
                    "code": item["ISU_SRT_CD"],
                    "name": item["ISU_ABBRV"],
                    "market": item.get("MKT_NM", "KOSPI"),
                }
                for item in items
                if item.get("ISU_SRT_CD") and item.get("ISU_ABBRV")
            ]
            logger.info("KRX 종목 목록 조회 성공: %d개", len(result))
            return result
    except Exception as exc:
        logger.warning("KRX 종목 목록 조회 실패 (fallback 사용): %s", exc)
        return None


async def _get_kr_stocks() -> list[dict]:
    """국내 주식 목록 반환 (Redis 캐시 → KRX API → embedded fallback 순서)"""
    # 1. Redis 캐시 확인
    try:
        cached = await cache_get(_KR_CACHE_KEY)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    # 2. KRX API 호출
    stocks = await _fetch_krx_list()
    if stocks:
        try:
            await cache_set(
                _KR_CACHE_KEY,
                json.dumps(stocks, ensure_ascii=False),
                expire_seconds=_KR_CACHE_TTL,
            )
        except Exception:
            pass
        return stocks

    # 3. Embedded fallback
    logger.info("KRX fallback 목록 사용: %d개", len(_KR_FALLBACK))
    return [{"code": c, "name": n, "market": m} for c, n, m in _KR_FALLBACK]


# ============================================================
# 통합 검색 함수
# ============================================================

async def search_stocks(q: str, asset_type: str = "all", limit: int = 20) -> list[dict]:
    """
    종목/코인 통합 검색

    Args:
        q: 검색어 (이름, 심볼, 종목코드 부분 매칭)
        asset_type: "all" | "stock" | "crypto"
        limit: 최대 반환 개수

    Returns:
        [{id, symbol, name, type, market}, ...]
    """
    q_lower = q.strip().lower()
    if not q_lower:
        return []

    results: list[dict] = []

    if asset_type in ("all", "stock"):
        # 국내 주식 검색 (코드 또는 이름 부분 일치)
        kr_stocks = await _get_kr_stocks()
        for s in kr_stocks:
            if q_lower in s["name"].lower() or q_lower in s["code"].lower():
                results.append(
                    {
                        "id": s["code"],
                        "symbol": s["code"],
                        "name": s["name"],
                        "type": "stock",
                        "market": "KR",
                        "exchange": s.get("market", "KOSPI"),
                    }
                )
                if len(results) >= limit:
                    return results

        # 해외 주식 검색 (심볼 또는 이름 부분 일치)
        for s in _US_STOCKS:
            if q_lower in s["name"].lower() or q_lower in s["symbol"].lower():
                results.append(
                    {
                        "id": s["symbol"],
                        "symbol": s["symbol"],
                        "name": s["name"],
                        "type": "stock",
                        "market": "US",
                        "exchange": "US",
                    }
                )
                if len(results) >= limit:
                    return results

    if asset_type in ("all", "crypto"):
        # 코인 검색
        for s in _CRYPTO_LIST:
            if q_lower in s["name"].lower() or q_lower in s["symbol"].lower():
                results.append(
                    {
                        "id": s["symbol"],
                        "symbol": s["symbol"],
                        "name": s["name"],
                        "type": "crypto",
                        "market": None,
                        "exchange": "Crypto",
                    }
                )
                if len(results) >= limit:
                    return results

    return results[:limit]
