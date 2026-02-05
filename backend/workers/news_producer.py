"""
============================================
News Producer - 뉴스 크롤링
============================================

금융 뉴스를 크롤링하여 Kafka 'news' 토픽으로 발행합니다.

운영 환경: Node3에서 실행
토픽: news
Consumer:
  - AI Consumer (→ Ollama 요약/태깅)
  - Indexer Consumer (→ Elasticsearch 인덱싱)
"""

import asyncio
import json
import os
from datetime import datetime

from aiokafka import AIOKafkaProducer
import httpx

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC = "news"

# 크롤링 대상 소스 (예시)
NEWS_SOURCES = [
    {"name": "네이버 금융", "url": "https://finance.naver.com"},
    {"name": "한경", "url": "https://www.hankyung.com"},
]


async def crawl_news():
    """
    뉴스 크롤링

    TODO: 실제 크롤링 구현
    - BeautifulSoup / Playwright 사용
    - 금융 뉴스 RSS 피드 활용
    """
    # Mock 데이터 (실제 크롤링 전)
    news_items = [
        {
            "title": "비트코인, 10만 달러 돌파 임박",
            "content": "비트코인이 사상 최고가를 경신하며...",
            "source": "네이버 금융",
            "url": "https://example.com/news/1",
            "published_at": datetime.utcnow().isoformat(),
            "related_assets": ["BTC", "ETH"],
        },
        {
            "title": "NVIDIA, AI 칩 수요 급증으로 실적 호조",
            "content": "엔비디아가 AI 반도체 시장에서...",
            "source": "한경",
            "url": "https://example.com/news/2",
            "published_at": datetime.utcnow().isoformat(),
            "related_assets": ["NVDA", "AMD"],
        },
    ]

    return news_items


async def main():
    """메인 실행 루프"""
    print(f"[START] News Producer 시작: {KAFKA_BOOTSTRAP_SERVERS}")

    producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )

    await producer.start()
    print(f"[OK] Kafka 연결 성공, 토픽: {TOPIC}")

    try:
        while True:
            news_items = await crawl_news()

            for news in news_items:
                await producer.send_and_wait(TOPIC, news)
                print(f"📤 발행: {news['title'][:30]}...")

            # 5분마다 크롤링
            await asyncio.sleep(300)

    except KeyboardInterrupt:
        print("종료 요청")
    finally:
        await producer.stop()
        print("Producer 종료")


if __name__ == "__main__":
    asyncio.run(main())
