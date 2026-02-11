"""
============================================
Market Data Router
============================================

二쇱떇 諛??뷀샇?뷀룓 ?쒖꽭 議고쉶 API?낅땲??
Redis 罹먯떆 ?곗꽑 議고쉶 ??罹먯떆 誘몄뒪 ???몃? API ?몄텧.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List
import json

from ..services.market_data import kis_client, crypto_client
from ..cache import cache_get
from ..config import get_settings

router = APIRouter()
settings = get_settings()


async def get_cached_price(symbol: str) -> dict | None:
    """Redis?먯꽌 罹먯떆???쒖꽭 議고쉶"""
    try:
        cached = await cache_get(f"price:{symbol}")
        if cached:
            return json.loads(cached)
    except Exception as e:
        print(f"[WARNING] 罹먯떆 議고쉶 ?ㅽ뙣: {e}")
    return None

@router.get("/price/domestic/{code}")
async def get_domestic_stock_price(code: str):
    """
    援?궡 二쇱떇 ?꾩옱媛 議고쉶 (KIS)
    - Redis 罹먯떆 ?곗꽑 議고쉶
    - code: 醫낅ぉ肄붾뱶 (?? 005930)
    """
    # 罹먯떆 ?뺤씤
    cached = await get_cached_price(code)
    if cached:
        cached["source"] = "cache"
        return cached

    # 罹먯떆 誘몄뒪: ?몃? API ?몄텧
    result = await kis_client.get_current_price(code, market="KR")
    result["source"] = "api"
    return result

@router.get("/price/overseas/{ticker}")
async def get_overseas_stock_price(ticker: str):
    """
    ?댁쇅 二쇱떇 ?꾩옱媛 議고쉶 (KIS)
    - Redis 罹먯떆 ?곗꽑 議고쉶
    - ticker: ?곗빱 (?? AAPL)
    """
    # 罹먯떆 ?뺤씤
    cached = await get_cached_price(ticker.upper())
    if cached:
        cached["source"] = "cache"
        return cached

    # 罹먯떆 誘몄뒪: ?몃? API ?몄텧
    result = await kis_client.get_current_price(ticker, market="US")
    result["source"] = "api"
    return result

@router.get("/price/crypto/{ticker}")
async def get_crypto_price(ticker: str):
    """
    ?뷀샇?뷀룓 ?꾩옱媛 議고쉶 (Upbit)
    - Redis 罹먯떆 ?곗꽑 議고쉶
    - ticker: 留덉폆肄붾뱶 (?? KRW-BTC ?먮뒗 BTC)
    """
    # ?щ낵 ?뺢퇋??
    symbol = ticker.replace("KRW-", "").replace("/", "").upper()

    # 罹먯떆 ?뺤씤
    cached = await get_cached_price(symbol)
    if cached:
        cached["source"] = "cache"
        return cached

    # 罹먯떆 誘몄뒪: ?몃? API ?몄텧
    result = await crypto_client.get_current_price(ticker)
    result["source"] = "api"
    return result


@router.get("/prices/crypto")
async def get_multiple_crypto_prices(tickers: str = Query(..., description="?쇳몴濡?援щ텇???곗빱 紐⑸줉 (?? BTC,ETH,SOL)")):
    """
    ?щ윭 ?뷀샇?뷀룓 ?꾩옱媛 ?쇨큵 議고쉶 (Upbit)
    - tickers: ?쇳몴濡?援щ텇???곗빱 紐⑸줉 (?? BTC,ETH,SOL)
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
async def get_multiple_stock_prices(symbols: str = Query(..., description="?쇳몴濡?援щ텇??醫낅ぉ肄붾뱶 紐⑸줉")):
    """
    ?щ윭 二쇱떇 ?꾩옱媛 ?쇨큵 議고쉶 (KIS)
    - symbols: ?쇳몴濡?援щ텇??醫낅ぉ肄붾뱶 紐⑸줉 (援?궡: 005930, ?댁쇅: AAPL)
    """
    symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
    results = []

    for symbol in symbol_list:
        try:
            # ?レ옄 6?먮━硫?援?궡, ?꾨땲硫??댁쇅濡?媛꾩＜
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
    ?쒖옣 ?곗씠??諛??쒕퉬???곹깭 ?붿빟 議고쉶
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
    ?쒖옣 ?곗씠???대젰(OHLCV) 議고쉶
    - market_type: stock, crypto
    - symbol: 醫낅ぉ肄붾뱶 ?먮뒗 ?곗빱
    - timeframe: D(?쇰큺), m(遺꾨큺) - 二쇱떇 / days, minutes/1 ??- 肄붿씤
    """
    if market_type == "stock":
        # Stock (KIS) timeframe 留ㅽ븨: W(二쇰큺), M(?붾큺), Y(?붾큺 12媛?
        kis_tf = timeframe
        actual_count = count
        if timeframe == "Y":
            kis_tf = "M"
            actual_count = 12
        res = await kis_client.get_historical_data(symbol, timeframe=kis_tf)
        # Sandbox?먯꽌 鍮?媛믪씠 ??寃쎌슦瑜??鍮꾪븳 Mock Fallback
        if not res.get("history") or len(res.get("history", [])) == 0:
            if not settings.DEBUG:
                raise HTTPException(status_code=503, detail="시세 데이터를 가져올 수 없습니다")
            from datetime import datetime, timedelta
            import random
            print(f"[WARN] KIS {symbol} history is empty, providing mock fallback.")
            mock_history = []
            # ?꾩옱媛 API?먯꽌 湲곗? 媛寃?議고쉶 (?ъ씠?쒕컮? ?쇱튂?쒗궎湲??꾪빐)
            try:
                market = "KR" if symbol.isdigit() and len(symbol) == 6 else "US"
                current = await kis_client.get_current_price(symbol, market=market)
                base_p = float(current.get("price", 0))
                if base_p <= 0:
                    base_p = 75000 if symbol == "005930" else 300
            except Exception:
                base_p = 75000 if symbol == "005930" else 300
            # ?꾩옱媛 ??怨쇨굅 諛⑺뼢?쇰줈 ??궛?섏뿬 留덉?留??곗씠??= ?꾩옱媛
            prices = [base_p]
            for i in range(actual_count - 1):
                change = prices[-1] * random.uniform(-0.015, 0.015)
                prices.append(prices[-1] - change)
            prices.reverse()  # 怨쇨굅?믫쁽???쒖꽌

            for i in range(actual_count):
                date = (datetime.now() - timedelta(days=actual_count-i)).strftime("%Y-%m-%d")
                p = prices[i]
                mock_history.append({
                    "date": date,
                    "open": round(p * random.uniform(0.995, 1.005), 2),
                    "high": round(p * random.uniform(1.005, 1.015), 2),
                    "low": round(p * random.uniform(0.985, 0.995), 2),
                    "close": round(p, 2),
                    "volume": random.randint(1000, 100000)
                })
            return {"code": symbol, "history": mock_history, "mock": True}
        return res
    elif market_type == "crypto":
        # Upbit timeframe 留ㅽ븨
        actual_count = count
        if timeframe == "D" or timeframe == "days":
            upbit_tf = "days"
        elif timeframe == "W" or timeframe == "weeks":
            upbit_tf = "weeks"
        elif timeframe == "M" or timeframe == "months":
            upbit_tf = "months"
        elif timeframe == "Y":
            upbit_tf = "months"
            actual_count = 12
        elif timeframe == "m" or timeframe == "minutes":
            upbit_tf = "minutes/1"
        elif timeframe.startswith("minutes/"):
            upbit_tf = timeframe
        elif timeframe.isdigit():
            upbit_tf = f"minutes/{timeframe}"
        else:
            upbit_tf = "days"

        return await crypto_client.get_historical_data(symbol, timeframe=upbit_tf, count=actual_count)
    else:
        raise HTTPException(status_code=400, detail="Invalid market type")


