import logging
"""
============================================
Market Data Router
============================================

二쇱떇 諛??뷀샇?뷀룓 ?쒖꽭 議고쉶 API?낅땲??
Redis 罹먯떆 ?곗꽑 議고쉶 ??罹먯떆 誘몄뒪 ???몃? API ?몄텧.
"""

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from typing import List
import json
import asyncio
from datetime import datetime, timezone

from ..services.market_data import kis_client, crypto_client
from ..services.exchange_rate import get_exchange_rate
from ..services.stock_search import search_stocks
from ..cache import cache_get
from ..config import get_settings

router = APIRouter()
logger = logging.getLogger(__name__)
settings = get_settings()

# 통화(현금) 코드 목록 - 주식/코인 시세 조회에서 제외
CURRENCY_CODES = {"USD", "EUR", "JPY", "GBP", "CNY", "CHF", "CAD", "AUD", "HKD", "SGD", "NZD", "TWD", "THB", "VND", "KRW"}


# ============================================================
# 종목 검색 엔드포인트
# ============================================================

@router.get("/search")
async def search_market(
    q: str = Query(..., min_length=1, description="검색어 (이름, 심볼, 종목코드)"),
    type: str = Query("all", description="자산 유형: all | stock | crypto"),
    limit: int = Query(20, ge=1, le=50, description="최대 결과 수"),
):
    """
    종목/코인 검색 API

    - 국내 주식: KRX 전체 상장 종목 (이름/종목코드 검색)
    - 해외 주식: S&P500/NASDAQ 주요 종목 (이름/심볼 검색)
    - 코인: 주요 암호화폐 (이름/심볼 검색)
    """
    results = await search_stocks(q=q, asset_type=type, limit=limit)
    return {"results": results, "total": len(results), "query": q}


async def get_cached_price(symbol: str) -> dict | None:
    """Redis?먯꽌 罹먯떆???쒖꽭 議고쉶"""
    try:
        cached = await cache_get(f"price:{symbol}")
        if cached:
            return json.loads(cached)
    except Exception as e:
        logger.warning("罹먯떆 議고쉶 ?ㅽ뙣: %s", e)
    return None


def normalize_symbol(raw: str) -> str:
    token = (raw or "").strip().upper()
    if token.startswith("KRW-"):
        token = token.replace("KRW-", "", 1)
    return token


def _is_overseas_stock(symbol: str) -> bool:
    """6자리 숫자가 아닌 알파벳 심볼은 해외 주식으로 판단"""
    return symbol.isalpha() and len(symbol) <= 6 and not (symbol.isdigit() and len(symbol) == 6)


async def _convert_to_krw(data: dict) -> dict:
    """해외 주식 가격(USD)을 KRW로 변환"""
    price = data.get("price")
    if price and price > 0:
        try:
            rate = await get_exchange_rate("USD", "KRW")
            data["price_usd"] = price
            data["price"] = round(price * rate, 2)
            data["exchange_rate"] = rate
            data["currency"] = "KRW"
            if "change" in data and data["change"]:
                data["change_usd"] = data["change"]
                data["change"] = round(float(data["change"]) * rate, 2)
        except Exception as e:
            logger.warning("환율 변환 실패, USD 가격 유지: %s", e)
    return data


async def get_price_snapshot(symbol: str) -> dict:
    normalized = normalize_symbol(symbol)
    if not normalized:
        return {"symbol": symbol, "error": "empty symbol"}

    # 통화(현금) 심볼은 환율로 처리
    if normalized in CURRENCY_CODES:
        try:
            if normalized == "KRW":
                rate = 1.0
            else:
                rate = await get_exchange_rate(normalized, "KRW")
            return {"symbol": normalized, "price": rate, "currency": "KRW", "source": "exchange_rate", "asset_type": "cash"}
        except Exception as e:
            return {"symbol": normalized, "error": str(e), "source": "error"}

    cached = await get_cached_price(normalized)
    if cached:
        cached["source"] = "cache"
        cached["symbol"] = normalized
        return cached

    # Cache miss fallback: stock(KIS) / crypto(Upbit)
    try:
        is_overseas = _is_overseas_stock(normalized)
        if normalized.isdigit() and len(normalized) == 6:
            data = await kis_client.get_current_price(normalized, market="KR")
        elif is_overseas:
            data = await kis_client.get_current_price(normalized, market="US")
            data = await _convert_to_krw(data)
        else:
            data = await crypto_client.get_current_price(normalized)
        data["source"] = "api"
        data["symbol"] = normalized
        return data
    except Exception as e:
        return {"symbol": normalized, "error": str(e), "source": "error"}


def parse_symbol_list(raw: str | None) -> set[str]:
    if not raw:
        return set()
    out: set[str] = set()
    for token in raw.split(","):
        sym = normalize_symbol(token)
        if sym:
            out.add(sym)
    return out

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
            upper_sym = symbol.strip().upper()
            # 통화 코드는 환율로 처리
            if upper_sym in CURRENCY_CODES:
                if upper_sym == "KRW":
                    results.append({"code": upper_sym, "price": 1.0, "currency": "KRW", "source": "exchange_rate"})
                else:
                    rate = await get_exchange_rate(upper_sym, "KRW")
                    results.append({"code": upper_sym, "price": rate, "currency": "KRW", "source": "exchange_rate"})
                continue
            # 숫자 6자리면 국내, 아니면 해외로 간주
            if symbol.isdigit() and len(symbol) == 6:
                data = await kis_client.get_current_price(symbol, market="KR")
            else:
                data = await kis_client.get_current_price(symbol, market="US")
                data = await _convert_to_krw(data)
            results.append(data)
        except Exception as e:
            results.append({"code": symbol, "error": str(e)})

    return {"prices": results, "count": len(results)}

@router.get("/exchange-rate")
async def get_exchange_rate_api(
    from_currency: str = Query("USD", alias="from"),
    to_currency: str = Query("KRW", alias="to"),
):
    """환율 조회 (예: /api/v1/market/exchange-rate?from=USD&to=KRW)"""
    try:
        rate = await get_exchange_rate(from_currency.upper(), to_currency.upper())
        return {"from": from_currency.upper(), "to": to_currency.upper(), "rate": rate}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


@router.websocket("/ws")
async def market_price_ws(
    websocket: WebSocket,
):
    """
    실시간 시세 스트림(WebSocket)

    - 연결 URL 예시: /api/v1/market/ws?symbols=005930,AAPL,BTC&interval_ms=2000
    - 메시지(선택):
      {"action":"subscribe","symbols":["TSLA","ETH"]}
      {"action":"unsubscribe","symbols":["AAPL"]}
      {"action":"set","symbols":["005930","BTC"]}
      {"action":"ping"}
    """
    params = websocket.query_params
    symbols = parse_symbol_list(params.get("symbols"))

    try:
        interval_ms = int(params.get("interval_ms", "2000"))
    except ValueError:
        interval_ms = 2000
    interval_sec = max(0.5, min(interval_ms / 1000.0, 30.0))

    await websocket.accept()
    await websocket.send_json(
        {
            "type": "connected",
            "symbols": sorted(symbols),
            "interval_ms": int(interval_sec * 1000),
        }
    )

    try:
        while True:
            # Handle client control message with timeout.
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=interval_sec)
                try:
                    payload = json.loads(message)
                except json.JSONDecodeError:
                    await websocket.send_json({"type": "error", "message": "invalid json"})
                    continue

                action = str(payload.get("action", "")).lower()
                incoming = payload.get("symbols") or []
                incoming_set = {normalize_symbol(str(s)) for s in incoming if normalize_symbol(str(s))}

                if action == "subscribe":
                    symbols |= incoming_set
                    await websocket.send_json({"type": "subscribed", "symbols": sorted(symbols)})
                elif action == "unsubscribe":
                    symbols -= incoming_set
                    await websocket.send_json({"type": "subscribed", "symbols": sorted(symbols)})
                elif action == "set":
                    symbols = incoming_set
                    await websocket.send_json({"type": "subscribed", "symbols": sorted(symbols)})
                elif action == "ping":
                    await websocket.send_json({"type": "pong"})
                else:
                    await websocket.send_json({"type": "error", "message": "unknown action"})

            except asyncio.TimeoutError:
                # Periodic push interval
                pass

            if not symbols:
                await websocket.send_json({"type": "prices", "items": [], "ts": datetime.now(timezone.utc).isoformat()})
                continue

            tasks = [get_price_snapshot(sym) for sym in sorted(symbols)]
            items = await asyncio.gather(*tasks)
            await websocket.send_json(
                {
                    "type": "prices",
                    "items": items,
                    "ts": datetime.now(timezone.utc).isoformat(),
                }
            )

    except WebSocketDisconnect:
        logger.info("market websocket client disconnected")

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
        # 분봉 데이터가 비어있으면 (장 마감 후 등) 일봉으로 fallback
        if (not res.get("history") or len(res.get("history", [])) == 0) and kis_tf not in ("D", "W", "M"):
            logger.info("KIS %s minute history empty; fallback to daily", symbol)
            res = await kis_client.get_historical_data(symbol, timeframe="D")
            if res.get("history"):
                res["fallback"] = "daily"
                return res
        # Sandbox?먯꽌 鍮?媛믪씠 ??寃쎌슦瑜??鍮꾪븳 Mock Fallback
        if not res.get("history") or len(res.get("history", [])) == 0:
            if not settings.DEBUG:
                raise HTTPException(status_code=503, detail="시세 데이터를 가져올 수 없습니다")
            from datetime import datetime, timedelta
            import random
            logger.warning("KIS %s history empty; providing mock fallback", symbol)
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



