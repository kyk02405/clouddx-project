"""
============================================
News Producer - 뉴스 크롤링
============================================

금융 뉴스를 크롤링하여 Kafka 'news' 토픽으로 발행합니다.
MongoDB Atlas에도 원문을 저장합니다.

운영 환경: Node3에서 실행
토픽: news
Consumer:
  - Indexer Consumer (→ Elasticsearch 인덱싱)
"""

import asyncio
import json
import logging
import os
import re
from datetime import datetime

from aiokafka import AIOKafkaProducer
import httpx
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "clouddx")
TOPIC = os.getenv("KAFKA_NEWS_TOPIC", "news")
MAX_RECONNECT_DELAY = 60

# 크롤링 대상: 네이버 금융 뉴스 RSS
NAVER_FINANCE_RSS = "https://news.google.com/rss/search?q=주식+OR+ETF+OR+코스피+OR+코스닥&hl=ko&gl=KR&ceid=KR:ko"

# 네이버 금융 주요뉴스 페이지
NAVER_FINANCE_NEWS_URL = "https://finance.naver.com/news/mainnews.naver"

# 관심 키워드 (관련 종목 태깅용)
ASSET_KEYWORDS = {
    "삼성전자": ["005930", "삼성전자"],
    "SK하이닉스": ["000660", "SK하이닉스", "하이닉스"],
    "NVIDIA": ["NVDA", "엔비디아", "NVIDIA"],
    "비트코인": ["BTC", "비트코인"],
    "이더리움": ["ETH", "이더리움"],
    "테슬라": ["TSLA", "테슬라", "Tesla"],
    "애플": ["AAPL", "애플", "Apple"],
    "코스피": ["KOSPI", "코스피"],
    "코스닥": ["KOSDAQ", "코스닥"],
    "S&P500": ["SPX", "S&P", "S&P500"],
}


def extract_related_assets(text: str) -> list[str]:
    """뉴스 본문에서 관련 종목/자산 키워드를 추출"""
    found = set()
    for asset_name, keywords in ASSET_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                found.add(keywords[0])  # 종목코드/티커를 추가
                break
    return list(found)


def clean_html(html_text: str) -> str:
    """HTML 태그 제거 및 텍스트 정리"""
    if not html_text:
        return ""
    text = re.sub(r"<[^>]+>", "", html_text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


async def crawl_naver_finance_news(client: httpx.AsyncClient) -> list[dict]:
    """네이버 금융 주요뉴스 크롤링"""
    news_items = []

    try:
        resp = await client.get(
            NAVER_FINANCE_NEWS_URL,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
        )
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        articles = soup.select("ul.newsList li")

        for article in articles[:10]:  # 최신 10개
            title_tag = article.select_one("dd.articleSubject a")
            summary_tag = article.select_one("dd.articleSummary")

            if not title_tag:
                continue

            title = title_tag.get_text(strip=True)
            url = title_tag.get("href", "")
            if url and not url.startswith("http"):
                url = f"https://finance.naver.com{url}"

            summary = ""
            if summary_tag:
                summary = summary_tag.get_text(strip=True)
                # 날짜/출처 부분 제거
                summary = re.sub(r"\d{4}-\d{2}-\d{2}.*$", "", summary).strip()

            combined_text = f"{title} {summary}"
            related = extract_related_assets(combined_text)

            news_items.append({
                "title": title,
                "content": summary,
                "summary": summary[:200] if summary else title,
                "source": "네이버 금융",
                "url": url,
                "published_at": datetime.utcnow().isoformat(),
                "tags": ["finance", "korea"],
                "related_assets": related,
            })

        logger.info("네이버 금융: %d건 수집", len(news_items))

    except Exception as e:
        logger.error("네이버 금융 크롤링 실패: %s", e)

    return news_items


async def crawl_hankyung_news(client: httpx.AsyncClient) -> list[dict]:
    """한국경제 증권 뉴스 크롤링"""
    news_items = []
    url = "https://www.hankyung.com/finance/stock"

    try:
        resp = await client.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            follow_redirects=True,
        )
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        articles = soup.select("ul.news_list li, div.article_list li, div.news-item")

        for article in articles[:10]:
            a_tag = article.select_one("a")
            if not a_tag:
                continue

            title = a_tag.get_text(strip=True)
            link = a_tag.get("href", "")
            if link and not link.startswith("http"):
                link = f"https://www.hankyung.com{link}"

            if not title or len(title) < 5:
                continue

            related = extract_related_assets(title)

            news_items.append({
                "title": title,
                "content": "",
                "summary": title,
                "source": "한국경제",
                "url": link,
                "published_at": datetime.utcnow().isoformat(),
                "tags": ["finance", "stock"],
                "related_assets": related,
            })

        logger.info("한국경제: %d건 수집", len(news_items))

    except Exception as e:
        logger.error("한국경제 크롤링 실패: %s", e)

    return news_items


async def save_to_mongodb(news_items: list[dict]):
    """MongoDB Atlas에 원문 저장 (중복 방지)"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        mongo_client = AsyncIOMotorClient(MONGODB_URL)
        db = mongo_client[MONGODB_DB_NAME]
        collection = db["news"]

        saved = 0
        for item in news_items:
            # URL 기반 중복 체크
            if item.get("url"):
                existing = await collection.find_one({"url": item["url"]})
                if existing:
                    continue

            item["created_at"] = datetime.utcnow()
            await collection.insert_one(item)
            saved += 1

        mongo_client.close()
        logger.info("MongoDB 저장: %d건 (중복 제외)", saved)

    except Exception as e:
        logger.error("MongoDB 저장 실패: %s", e)


async def create_producer() -> AIOKafkaProducer:
    """Kafka producer를 생성하고 연결합니다. 실패 시 지수 백오프로 재시도합니다."""
    delay = 1
    while True:
        try:
            producer = AIOKafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v, ensure_ascii=False).encode("utf-8"),
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
    logger.info("News Producer 시작: %s", KAFKA_BOOTSTRAP_SERVERS)

    producer = await create_producer()

    try:
        while True:
            async with httpx.AsyncClient(timeout=30.0) as client:
                results = await asyncio.gather(
                    crawl_naver_finance_news(client),
                    crawl_hankyung_news(client),
                    return_exceptions=True,
                )

            all_news = []
            for result in results:
                if isinstance(result, list):
                    all_news.extend(result)
                elif isinstance(result, Exception):
                    logger.error("크롤링 예외: %s", result)

            if all_news:
                await save_to_mongodb(all_news)

                published = 0
                needs_reconnect = False
                for news in all_news:
                    try:
                        news.pop("_id", None)
                        news.pop("created_at", None)
                        await producer.send_and_wait(TOPIC, news)
                        published += 1
                    except Exception as e:
                        logger.error("Kafka 발행 실패: %s", e)
                        needs_reconnect = True
                        break

                logger.info("Kafka 발행 완료: %d건", published)

                if needs_reconnect:
                    logger.warning("Kafka 재연결 시도")
                    try:
                        await producer.stop()
                    except Exception:
                        pass
                    producer = await create_producer()
            else:
                logger.info("수집된 뉴스 없음")

            logger.info("다음 크롤링까지 300초 대기")
            await asyncio.sleep(300)

    except KeyboardInterrupt:
        logger.info("종료 요청")
    finally:
        await producer.stop()
        logger.info("Producer 종료")


if __name__ == "__main__":
    asyncio.run(main())
