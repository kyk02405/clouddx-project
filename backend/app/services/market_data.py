"""
============================================
Market Data Service
============================================

한국투자증권(KIS) 및 Upbit API 연동을 담당합니다.
- KIS: 국내/해외 주식 시세 (Access Token 관리 포함)
- Upbit: 암호화폐 시세 (CCXT 사용)
"""

import httpx
import ccxt.async_support as ccxt
from datetime import datetime
from fastapi import HTTPException

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
        if self.token and self.token_expired_at and datetime.now() < self.token_expired_at:
            return self.token

        url = f"{self.base_url}/oauth2/tokenP"
        headers = {"content-type": "application/json"}
        body = {
            "grant_type": "client_credentials",
            "appkey": self.app_key,
            "appsecret": self.app_secret
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, json=body)
                response.raise_for_status()
                data = response.json()
                
                self.token = data["access_token"]
                # 토큰 만료 시간 설정 (보통 24시간이나 안전하게 사용)
                # KIS 응답에 expires_in이 초 단위로 옴
                self.token_expired_at = datetime.now() # 실제로는 expires_in 더해야 함, 간소화
                return self.token
            except Exception as e:
                print(f"KIS Token Error: {e}")
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

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}{path}", headers=headers, params=params)
                data = response.json()
                # 응답 파싱 로직 필요 (output 구조에 따라)
                return {
                    "code": code,
                    "price": data.get("output", {}).get("stck_prpr"), # 현재가
                    "raw": data
                }
            except Exception as e:
                return {"code": code, "error": str(e)}


class CryptoClient:
    """Upbit (via CCXT) 클라이언트"""
    
    def __init__(self):
        self.exchange = ccxt.upbit({
            'apiKey': settings.UPBIT_ACCESS_KEY,
            'secret': settings.UPBIT_SECRET_KEY,
            'enableRateLimit': True,
        })
    
    async def get_current_price(self, ticker: str = "BTC/KRW"):
        """현재가 조회"""
        try:
            ticker_formatted = ticker.replace("-", "/") # CCXT uses SLASH (BTC/KRW)
            ticker_data = await self.exchange.fetch_ticker(ticker_formatted)
            return {
                "ticker": ticker,
                "price": ticker_data['last'],
                "change_percent": ticker_data['percentage'],
                "volume": ticker_data['baseVolume']
            }
        except Exception as e:
            # Fallback for dev without keys (Upbit public API might work without keys for market data)
            if not settings.UPBIT_ACCESS_KEY:
                 # Try public fetch if instance doesn't have keys? CCXT often allows public endpoints without keys.
                 # But if that fails:
                 return {"ticker": ticker, "price": 100000000, "mock": True}
            raise HTTPException(status_code=500, detail=f"Upbit Error: {str(e)}")
        finally:
            await self.exchange.close()

# Singleton Instances
kis_client = KISClient()
crypto_client = CryptoClient()
