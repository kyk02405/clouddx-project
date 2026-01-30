"""
============================================
Market Data Service
============================================

한국투자증권(KIS) 및 Upbit API 연동을 담당합니다.
- KIS: 국내/해외 주식 시세 (Access Token 관리 포함)
- Upbit: 암호화폐 시세 (CCXT 사용)
"""

import httpx
from datetime import datetime
from fastapi import HTTPException

try:
    import ccxt.async_support as ccxt
except ImportError:
    ccxt = None


from ..config import get_settings

settings = get_settings()

class KISClient:
    """한국투자증권 Open API 클라이언트"""
    
    def __init__(self):
        self.base_url = "https://openapivts.koreainvestment.com:29443" if settings.KIS_MODE == "virtual" else "https://openapi.koreainvestment.com:9443"
        self.app_key = settings.KIS_APP_KEY
        self.app_secret = settings.KIS_APP_SECRET
        self.token = None
        self.token_expired_at = None

    async def _get_access_token(self):
        """접근 토큰 발급/갱신"""
        # 기존 토큰 유효성 확인 (만료 1분 전까지 유효한 것으로 간주)
        if self.token and self.token_expired_at and datetime.now().timestamp() < self.token_expired_at:
            return self.token

        url = f"{self.base_url}/oauth2/tokenP"
        headers = {"content-type": "application/json"}
        body = {
            "grant_type": "client_credentials",
            "appkey": self.app_key,
            "appsecret": self.app_secret
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(url, headers=headers, json=body)
                response.raise_for_status()
                data = response.json()
                
                self.token = data["access_token"]
                # 토큰 만료 시간 설정 (보통 24시간이나 안전하게 사용)
                expires_in = int(data.get("expires_in", 86400))
                self.token_expired_at = datetime.now().timestamp() + expires_in - 60
                print(f"✅ KIS 토큰 발급 완료 (만료: {expires_in}초)")
                return self.token
            except Exception as e:
                print(f"❌ KIS Token Error: {e}")
                # 개발/테스트 중 키가 없을 때를 대비한 모의 토큰 (실제 호출은 실패함)
                if settings.DEBUG:
                    return "MOCK_TOKEN"
                raise HTTPException(status_code=500, detail="증권사 연동 실패")

    async def get_current_price(self, code: str, market: str = "KR"):
        """현재가 조회 (국내: KR, 해외: US)"""
        token = await self._get_access_token()
        
        headers = {
            "content-type": "application/json",
            "authorization": f"Bearer {token}",
            "appkey": self.app_key,
            "appsecret": self.app_secret,
            "tr_id": "FHKST01010100" if market == "KR" else "HHDFS00000300" # 국내/해외 TR ID 다름 (예시)
        }
        
        # 실제 구현시에는 market 타입에 따라 URL과 TR_ID가 달라야 함
        # 여기서는 국내 주식 예시만 구현
        path = "/uapi/domestic-stock/v1/quotations/inquire-price"
        params = {
            "fid_cond_mrkt_div_code": "J",
            "fid_input_iscd": code
        }

        # Mock Mode for initial dev without keys
        if not self.app_key:
             return {"code": code, "price": 75000, "change": 1.5}

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(f"{self.base_url}{path}", headers=headers, params=params)
                data = response.json()
                print(f"DEBUG KIS Response: {data}")
                output = data.get("output", {})
                price = output.get("stck_prpr")
                return {
                    "code": code,
                    "price": float(price) if price else 0,
                    "change": float(output.get("prdy_vrss", 0)),
                    "raw": data
                }
            except Exception as e:
                print(f"❌ KIS API Error: {e}")
                return {"code": code, "error": str(e)}

    async def get_historical_data(self, code: str, timeframe: str = "D", market: str = "KR"):
        """종목 이력 데이터(OHLCV) 조회 (국내/해외 지원)"""
        token = await self._get_access_token()
        
        # 해외 주식 여부 판단 (숫자 6자리면 국내, 아니면 해외로 간주거나 파라미터 따름)
        is_overseas = not (code.isdigit() and len(code) == 6) or market == "US"
        
        if is_overseas:
            # 해외 주식 일봉 (미국 기준 예시)
            tr_id = "HHDFS76240000"
            path = "/uapi/overseas-price/v1/quotations/daily-chartprice"
            params = {
                "AUTH": "",
                "EXCD": "NAS", # 기본 나스닥 (TSLA, NVDA, AAPL 등)
                "SYMB": code,
                "GUBN": "0", # 0:일, 1:주, 2:월
                "BYMD": "",
                "MODP": "1"
            }
        else:
            # 국내 주식
            tr_id = "FHKST03010100" if timeframe == "D" else "FHKST03010200"
            path = "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice" if timeframe == "D" else "/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice"
            params = {
                "fid_cond_mrkt_div_code": "J",
                "fid_input_iscd": code,
                "fid_period_div_code": "D" if timeframe == "D" else "m",
                "fid_org_adj_prc": "1"
            }
            if timeframe != "D":
                params["fid_etc_cls_code"] = ""
                params["fid_pw_resn_code"] = ""

        headers = {
            "content-type": "application/json",
            "authorization": f"Bearer {token}",
            "appkey": self.app_key,
            "appsecret": self.app_secret,
            "tr_id": tr_id,
            "custtype": "P"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(f"{self.base_url}{path}", headers=headers, params=params)
                data = response.json()
                
                history = []
                if is_overseas:
                    # 해외 데이터 포맷: output2
                    output2 = data.get("output2", [])
                    for item in output2:
                        history.append({
                            "date": f"{item['xymd'][:4]}-{item['xymd'][4:6]}-{item['xymd'][6:]}",
                            "open": float(item['open']),
                            "high": float(item['high']),
                            "low": float(item['low']),
                            "close": float(item['last']),
                            "volume": float(item['tvol'])
                        })
                else:
                    # 국내 데이터 포맷: output2
                    output2 = data.get("output2", [])
                    for item in output2:
                        date_str = item.get("stck_bsop_date") or item.get("stck_cntg_hour")
                        formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}" if date_str and len(date_str) == 8 else date_str
                        history.append({
                            "date": formatted_date,
                            "open": float(item.get("stck_oprc", 0)),
                            "high": float(item.get("stck_hgpr", 0)),
                            "low": float(item.get("stck_lwpr", 0)),
                            "close": float(item.get("stck_clpr", 0)),
                            "volume": float(item.get("acml_vol", 0))
                        })
                
                return {"code": code, "history": history[::-1], "market": "US" if is_overseas else "KR"}
            except Exception as e:
                print(f"❌ KIS History API Error ({code}): {e}")
                return {"code": code, "error": str(e), "history": []}


class CryptoClient:
    """Upbit 직접 호출 클라이언트 (ccxt 대신 httpx 사용)"""
    
    def __init__(self):
        self.base_url = "https://api.upbit.com/v1"
        self.access_key = settings.UPBIT_ACCESS_KEY
        self.secret_key = settings.UPBIT_SECRET_KEY

    async def get_current_price(self, ticker: str = "KRW-BTC"):
        """Upbit 시세 조회 (Public API 우선)"""
        # 티커 형식 보정 (BTC/KRW -> KRW-BTC)
        ticker_formatted = ticker.replace("/", "-")
        if not "-" in ticker_formatted:
            ticker_formatted = f"KRW-{ticker_formatted}"

        url = f"{self.base_url}/ticker"
        params = {"markets": ticker_formatted}

        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                response = await client.get(url, params=params)
                
                # Upbit Public API는 키 없이도 조회가 가능함
                if response.status_code == 200:
                    data = response.json()
                    if not data:
                        raise ValueError(f"No data for ticker: {ticker_formatted}")
                    
                    ticker_data = data[0]
                    return {
                        "ticker": ticker_formatted,
                        "price": float(ticker_data['trade_price']),
                        "change_percent": float(ticker_data['signed_change_rate']) * 100,
                        "volume": float(ticker_data['acc_trade_volume_24h']),
                        "updated_at": datetime.fromtimestamp(ticker_data['timestamp']/1000).isoformat()
                    }
                else:
                    error_data = response.json()
                    raise Exception(f"Upbit API Error: {error_data}")

            except Exception as e:
                print(f"❌ Upbit API Error Details: {e}")
                # Fallback: API 키가 없는 개발 환경용 모의 데이터
                if not self.access_key or settings.DEBUG:
                     return {
                         "ticker": ticker_formatted, 
                         "price": 100000000.0 if "BTC" in ticker_formatted else 50000.0, 
                         "mock": True,
                         "note": "Upbit API 연결 실패 또는 개발 모드"
                     }
                raise HTTPException(status_code=500, detail=f"Upbit Service Unavailable: {str(e)}")

    async def get_historical_data(self, ticker: str = "KRW-BTC", timeframe: str = "days", count: int = 30):
        """Upbit 이력 데이터(OHLCV) 조회"""
        ticker_formatted = ticker.replace("/", "-")
        if not "-" in ticker_formatted:
            ticker_formatted = f"KRW-{ticker_formatted}"

        # timeframe: days, minutes/1, minutes/60 등
        path = f"/candles/{timeframe}"
        url = f"{self.base_url}{path}"
        params = {"market": ticker_formatted, "count": count}

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    history = []
                    for item in data:
                        history.append({
                            "date": item['candle_date_time_kst'],
                            "open": float(item['opening_price']),
                            "high": float(item['high_price']),
                            "low": float(item['low_price']),
                            "close": float(item['trade_price']),
                            "volume": float(item['candle_acc_trade_volume'])
                        })
                    return {"ticker": ticker_formatted, "history": history[::-1]}
                else:
                    return {"ticker": ticker_formatted, "error": response.text, "history": []}
            except Exception as e:
                print(f"❌ Upbit History API Error: {e}")
                return {"ticker": ticker_formatted, "error": str(e), "history": []}

# Singleton Instances
kis_client = KISClient()
crypto_client = CryptoClient()
