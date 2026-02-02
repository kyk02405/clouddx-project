"""
============================================
Indexer Consumer - Elasticsearch 인덱싱
============================================

Kafka 'news' 토픽의 메시지를 소비하여
Elasticsearch에 인덱싱합니다.

운영 환경: Node3에서 실행
토픽: news
ES 호스트: Node3 (호스트 설치)
"""

import asyncio
import json
import os
from datetime import datetime

from aiokafka import AIOKafkaConsumer
from elasticsearch import AsyncElasticsearch

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
TOPIC = "news"
GROUP_ID = "indexer-consumer-group"
INDEX_NAME = "news"


async def ensure_index(es: AsyncElasticsearch):
    """뉴스 인덱스 생성 (없는 경우)"""
    if not await es.indices.exists(index=INDEX_NAME):
        await es.indices.create(
            index=INDEX_NAME,
            body={
                "mappings": {
                    "properties": {
                        "title": {"type": "text", "analyzer": "standard"},
                        "content": {"type": "text", "analyzer": "standard"},
                        "summary": {"type": "text", "analyzer": "standard"},
                        "source": {"type": "keyword"},
                        "url": {"type": "keyword"},
                        "published_at": {"type": "date"},
                        "indexed_at": {"type": "date"},
                        "tags": {"type": "keyword"},
                        "related_assets": {"type": "keyword"}
                    }
                }
            }
        )
        print(f"✅ 인덱스 생성: {INDEX_NAME}")


async def main():
    """메인 실행 루프"""
    print(f"🚀 Indexer Consumer 시작")
    print(f"   Kafka: {KAFKA_BOOTSTRAP_SERVERS}")
    print(f"   Elasticsearch: {ELASTICSEARCH_URL}")
    
    # Elasticsearch 연결
    es = AsyncElasticsearch(hosts=[ELASTICSEARCH_URL])
    await ensure_index(es)
    
    # Kafka Consumer 연결
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id=GROUP_ID,
        value_deserializer=lambda v: json.loads(v.decode('utf-8'))
    )
    
    await consumer.start()
    print(f"✅ Kafka 연결 성공, 토픽: {TOPIC}, 그룹: {GROUP_ID}")
    
    try:
        async for message in consumer:
            news_data = message.value
            
            # 인덱싱할 문서 준비
            doc = {
                **news_data,
                "indexed_at": datetime.utcnow().isoformat()
            }
            
            # Elasticsearch에 인덱싱
            result = await es.index(index=INDEX_NAME, document=doc)
            print(f"📥 인덱싱 완료: {news_data['title'][:30]}... (ID: {result['_id']})")
            
    except KeyboardInterrupt:
        print("종료 요청")
    finally:
        await consumer.stop()
        await es.close()
        print("Consumer 종료")


if __name__ == "__main__":
    asyncio.run(main())
