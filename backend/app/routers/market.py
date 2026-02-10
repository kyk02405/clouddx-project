"""
============================================
Market Data Router
============================================

주식 및 암호화폐 시세 조회 API입니다.
Redis 캐시 우선 조회 후 캐시 미스 시 외부 API 호출.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List
import json

from ..services.market_data import kis_client, crypto_client
from ..cache import cache_get

router = APIRouter()


async def get_cached_price(symbol: str) -> dict | None:
    """Redis에서 캐시된 시세 조회"""
    try:
        cached = await cache_get(f"price:{symbol}")
        if cached:
            return json.loads(cached)
    except Exception as e:
        print(f"[WARNING] 캐시 조회 실패: {e}")
    return None

@router.get("/price/domestic/{code}")
async def get_domestic_stock_price(code: str):
    """
    국내 주식 현재가 조회 (KIS)
    - Redis 캐시 우선 조회
    - code: 종목코드 (예: 005930)
    """
    # 캐시 확인
    cached = await get_cached_price(code)
    if cached:
        cached["source"] = "cache"
        return cached

    # 캐시 미스: 외부 API 호출
    result = await kis_client.get_current_price(code, market="KR")
    result["source"] = "api"
    return result

@router.get("/price/overseas/{ticker}")
async def get_overseas_stock_price(ticker: str):
    """
    해외 주식 현재가 조회 (KIS)
    - Redis 캐시 우선 조회
    - ticker: 티커 (예: AAPL)
    """
    # 캐시 확인
    cached = await get_cached_price(ticker.upper())
    if cached:
        cached["source"] = "cache"
        return cached

    # 캐시 미스: 외부 API 호출
    result = await kis_client.get_current_price(ticker, market="US")
    result["source"] = "api"
    return result

@router.get("/price/crypto/{ticker}")
async def get_crypto_price(ticker: str):
    """
    암호화폐 현재가 조회 (Upbit)
    - Redis 캐시 우선 조회
    - ticker: 마켓코드 (예: KRW-BTC 또는 BTC)
    """
    # 심볼 정규화
    symbol = ticker.replace("KRW-", "").replace("/", "").upper()

    # 캐시 확인
    cached = await get_cached_price(symbol)
    if cached:
        cached["source"] = "cache"
        return cached

    # 캐시 미스: 외부 API 호출
    result = await crypto_client.get_current_price(ticker)
    result["source"] = "api"
    return result


@router.get("/prices/crypto")
async def get_multiple_crypto_prices(tickers: str = Query(..., description="쉼표로 구분된 티커 목록 (예: BTC,ETH,SOL)")):
    """
    여러 암호화폐 현재가 일괄 조회 (Upbit)
    - tickers: 쉼표로 구분된 티커 목록 (예: BTC,ETH,SOL)
    """
    ticker_list = [t.strip() for t in tickers.split(",") if t.strip()]
    results = []

    for ticker in ticker_list:
        try:
            data = await crypto_client.get_current_price(ticker)
            results.append(data)
        except Exception as e:
            results.append({"ticker": ticker, "error": str(e)})

    return {"prices": results, "count": len(results)}


@router.get("/prices/stocks")
async def get_multiple_stock_prices(symbols: str = Query(..., description="쉼표로 구분된 종목코드 목록")):
    """
    여러 주식 현재가 일괄 조회 (KIS)
    - symbols: 쉼표로 구분된 종목코드 목록 (국내: 005930, 해외: AAPL)
    """
    symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
    results = []

    for symbol in symbol_list:
        try:
            # 숫자 6자리면 국내, 아니면 해외로 간주
            if symbol.isdigit() and len(symbol) == 6:
                data = await kis_client.get_current_price(symbol, market="KR")
            else:
                data = await kis_client.get_current_price(symbol, market="US")
            results.append(data)
        except Exception as e:
            results.append({"code": symbol, "error": str(e)})

    return {"prices": results, "count": len(results)}

@router.get("/status")
async def get_market_status():
    """
    시장 데이터 및 서비스 상태 요약 조회
    """
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    return {
        "priceUpdate": now,
        "newsUpdate": now,
        "aiUpdate": now,
        "status": "healthy"
    }

@router.get("/history/{market_type}/{symbol}")
async def get_market_history(market_type: str, symbol: str, timeframe: str = "D", count: int = 30):
    """
    시장 데이터 이력(OHLCV) 조회
    - market_type: stock, crypto
    - symbol: 종목코드 또는 티커
    - timeframe: D(일봉), m(분봉) - 주식 / days, minutes/1 등 - 코인
    """
    if market_type == "stock":
        res = await kis_client.get_historical_data(symbol, timeframe=timeframe)
        # Sandbox에서 빈 값이 올 경우를 대비한 Mock Fallback
        if not res.get("history") or len(res.get("history", [])) == 0:
            from datetime import datetime, timedelta
            import random
            print(f"[WARN] KIS {symbol} history is empty, providing mock fallback.")
            mock_history = []
            base_p = 75000 if symbol == "005930" else 300
            for i in range(count):
                date = (datetime.now() - timedelta(days=count-i)).strftime("%Y-%m-%d")
                change = base_p * random.uniform(-0.02, 0.02)
                base_p += change
                mock_history.append({
                    "date": date,
                    "open": round(base_p * 0.99, 2),
                    "high": round(base_p * 1.01, 2),
                    "low": round(base_p * 0.98, 2),
                    "close": round(base_p, 2),
                    "volume": random.randint(1000, 100000)
                })
            return {"code": symbol, "history": mock_history, "mock": True}
        return res
    elif market_type == "crypto":
        # Upbit timeframe mapping (D -> days, m -> minutes/1, or direct mapping)
        if timeframe == "D" or timeframe == "days":
            upbit_tf = "days"
        elif timeframe == "m" or timeframe == "minutes":
            upbit_tf = "minutes/1"
        elif timeframe.startswith("minutes/"):
            upbit_tf = timeframe
        elif timeframe.isdigit():
            upbit_tf = f"minutes/{timeframe}"
        else:
            upbit_tf = "days" # Default
            
        return await crypto_client.get_historical_data(symbol, timeframe=upbit_tf, count=count)
    else:
        raise HTTPException(status_code=400, detail="Invalid market type")
