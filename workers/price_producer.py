"""
============================================
Price Producer - 시세 데이터 수집
============================================

주식/코인 시세 데이터를 외부 API에서 수집하여
Kafka 'prices' 토픽으로 발행합니다.

운영 환경: Node3에서 실행
토픽: prices
Consumer: Price Consumer (→ Redis 캐시 갱신)
"""

import asyncio
import json
import os
from datetime import datetime

from aiokafka import AIOKafkaProducer
import httpx

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC = "prices"

# 수집할 심볼 목록
SYMBOLS = {
    "crypto": ["BTC", "ETH", "SOL", "XRP"],
    "stock": ["AAPL", "NVDA", "TSLA", "MSFT"]
}


async def fetch_prices():
    """
    외부 API에서 시세 조회
    
    TODO: 실제 API 연동
    - 코인: CoinGecko API
    - 주식: Twelve Data / Polygon.io
    """
    # Mock 데이터 (실제 API 연동 전)
    prices = []
    
    for symbol in SYMBOLS["crypto"]:
        prices.append({
            "symbol": symbol,
            "asset_type": "crypto",
            "price": 50000 + (hash(symbol) % 10000),  # Mock
            "currency": "USD",
            "timestamp": datetime.utcnow().isoformat()
        })
    
    for symbol in SYMBOLS["stock"]:
        prices.append({
            "symbol": symbol,
            "asset_type": "stock",
            "price": 100 + (hash(symbol) % 500),  # Mock
            "currency": "USD",
            "timestamp": datetime.utcnow().isoformat()
        })
    
    return prices


async def main():
    """메인 실행 루프"""
    print(f"🚀 Price Producer 시작: {KAFKA_BOOTSTRAP_SERVERS}")
    
    producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    
    await producer.start()
    print(f"✅ Kafka 연결 성공, 토픽: {TOPIC}")
    
    try:
        while True:
            prices = await fetch_prices()
            
            for price_data in prices:
                await producer.send_and_wait(TOPIC, price_data)
                print(f"📤 발행: {price_data['symbol']} = {price_data['price']}")
            
            # 10초마다 갱신
            await asyncio.sleep(10)
            
    except KeyboardInterrupt:
        print("종료 요청")
    finally:
        await producer.stop()
        print("Producer 종료")


if __name__ == "__main__":
    asyncio.run(main())
