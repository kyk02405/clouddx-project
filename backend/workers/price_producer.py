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
import logging
import os
from datetime import datetime

from aiokafka import AIOKafkaProducer
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC = "prices"
MAX_RECONNECT_DELAY = 60

# 수집할 심볼 목록
SYMBOLS = {
    "crypto": ["BTC", "ETH", "SOL", "XRP"],
    "stock": ["AAPL", "NVDA", "TSLA", "MSFT"],
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
        prices.append(
            {
                "symbol": symbol,
                "asset_type": "crypto",
                "price": 50000 + (hash(symbol) % 10000),  # Mock
                "currency": "USD",
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

    for symbol in SYMBOLS["stock"]:
        prices.append(
            {
                "symbol": symbol,
                "asset_type": "stock",
                "price": 100 + (hash(symbol) % 500),  # Mock
                "currency": "USD",
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

    return prices


async def create_producer() -> AIOKafkaProducer:
    """Kafka producer를 생성하고 연결합니다. 실패 시 지수 백오프로 재시도합니다."""
    delay = 1
    while True:
        try:
            producer = AIOKafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            )
            await producer.start()
            logger.info("Kafka 연결 성공, 토픽: %s", TOPIC)
            return producer
        except Exception as e:
            logger.warning("Kafka 연결 실패 (%s), %d초 후 재시도", e, delay)
            await asyncio.sleep(delay)
            delay = min(delay * 2, MAX_RECONNECT_DELAY)


async def main():
    """메인 실행 루프"""
    logger.info("Price Producer 시작: %s", KAFKA_BOOTSTRAP_SERVERS)

    producer = await create_producer()

    try:
        while True:
            try:
                prices = await fetch_prices()

                for price_data in prices:
                    await producer.send_and_wait(TOPIC, price_data)

                logger.info("발행 완료: %d건", len(prices))
            except Exception as e:
                logger.error("발행 실패, 재연결 시도: %s", e)
                try:
                    await producer.stop()
                except Exception:
                    pass
                producer = await create_producer()

            await asyncio.sleep(10)

    except KeyboardInterrupt:
        logger.info("종료 요청")
    finally:
        await producer.stop()
        logger.info("Producer 종료")


if __name__ == "__main__":
    asyncio.run(main())
