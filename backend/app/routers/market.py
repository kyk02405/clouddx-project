"""
============================================
Market Data Router
============================================

주식 및 암호화폐 시세 조회 API입니다.
"""

from fastapi import APIRouter, HTTPException
from ..services.market_data import kis_client, crypto_client

router = APIRouter()

@router.get("/price/domestic/{code}")
async def get_domestic_stock_price(code: str):
    """
    국내 주식 현재가 조회 (KIS)
    - code: 종목코드 (예: 005930)
    """
    return await kis_client.get_current_price(code, market="KR")

@router.get("/price/overseas/{ticker}")
async def get_overseas_stock_price(ticker: str):
    """
    해외 주식 현재가 조회 (KIS)
    - ticker: 티커 (예: AAPL)
    """
    # 해외 로직은 국내와 파라미터가 다를 수 있어 구분 예정
    # 현재는 placeholder 로직 사용
    return await kis_client.get_current_price(ticker, market="US")

@router.get("/price/crypto/{ticker}")
async def get_crypto_price(ticker: str):
    """
    암호화폐 현재가 조회 (Upbit)
    - ticker: 마켓코드 (예: KRW-BTC)
    """
    return await crypto_client.get_current_price(ticker)
