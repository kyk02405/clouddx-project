"""
============================================
Indexer Consumer - Elasticsearch 인덱싱
============================================

Kafka 'news' 토픽의 메시지를 소비하여
Bedrock Titan으로 임베딩 생성 후 Elasticsearch에 인덱싱합니다.

운영 환경: Node3에서 실행
토픽: news
ES 호스트: Node3 (호스트 설치)
"""

import asyncio
import json
import os
from datetime import datetime
from functools import partial

import boto3
from aiokafka import AIOKafkaConsumer
from elasticsearch import AsyncElasticsearch

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-2")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
TOPIC = "news"
GROUP_ID = "indexer-consumer-group"
INDEX_NAME = "news"

# Bedrock 임베딩 모델 (Amazon Titan Embeddings V2 - 1024차원)
EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0"


def create_bedrock_client():
    """Bedrock Runtime 클라이언트 생성"""
    kwargs = {"region_name": AWS_REGION, "service_name": "bedrock-runtime"}
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY
    return boto3.client(**kwargs)


def generate_embedding_sync(bedrock_client, text: str) -> list[float] | None:
    """Bedrock Titan으로 텍스트 임베딩 생성 (동기)"""
    try:
        # 입력 텍스트 길이 제한 (Titan은 최대 8192 토큰)
        truncated = text[:4000]

        response = bedrock_client.invoke_model(
            modelId=EMBEDDING_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "inputText": truncated,
                "dimensions": 1024,
                "normalize": True,
            }),
        )

        result = json.loads(response["body"].read())
        return result["embedding"]

    except Exception as e:
        print(f"[WARN] 임베딩 생성 실패 (건너뜀): {e}")
        return None


async def generate_embedding(bedrock_client, text: str) -> list[float] | None:
    """비동기 래퍼 - 동기 Bedrock 호출을 스레드풀에서 실행"""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None, partial(generate_embedding_sync, bedrock_client, text)
    )


async def ensure_index(es: AsyncElasticsearch):
    """뉴스 인덱스 생성 (없는 경우)"""
    if not await es.indices.exists(index=INDEX_NAME):
        await es.indices.create(
            index=INDEX_NAME,
            body={
                "settings": {
                    "number_of_shards": 1,
                    "number_of_replicas": 0,
                },
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
                        "related_assets": {"type": "keyword"},
                        "embedding": {
                            "type": "dense_vector",
                            "dims": 1024,
                            "index": True,
                            "similarity": "cosine",
                        },
                    }
                },
            },
        )
        print(f"[OK] 인덱스 생성: {INDEX_NAME}")


async def main():
    """메인 실행 루프"""
    print(f"[START] Indexer Consumer 시작")
    print(f"   Kafka: {KAFKA_BOOTSTRAP_SERVERS}")
    print(f"   Elasticsearch: {ELASTICSEARCH_URL}")

    # Bedrock 클라이언트 초기화
    bedrock_client = None
    try:
        bedrock_client = create_bedrock_client()
        print(f"[OK] Bedrock 연결 (모델: {EMBEDDING_MODEL_ID})")
    except Exception as e:
        print(f"[WARN] Bedrock 초기화 실패 - 임베딩 없이 인덱싱합니다: {e}")

    # Elasticsearch 연결
    es = AsyncElasticsearch(hosts=[ELASTICSEARCH_URL])
    await ensure_index(es)

    # Kafka Consumer 연결
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id=GROUP_ID,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
    )

    await consumer.start()
    print(f"[OK] Kafka 연결 성공, 토픽: {TOPIC}, 그룹: {GROUP_ID}")

    try:
        async for message in consumer:
            news_data = message.value

            try:
                # 인덱싱할 문서 준비
                doc = {**news_data, "indexed_at": datetime.utcnow().isoformat()}

                # 임베딩 생성 (제목 + 본문을 결합하여 벡터화)
                if bedrock_client:
                    embed_text = f"{news_data.get('title', '')} {news_data.get('content', '')}"
                    embedding = await generate_embedding(bedrock_client, embed_text)
                    if embedding:
                        doc["embedding"] = embedding

                # URL을 doc_id로 사용하여 중복 방지
                doc_id = news_data.get("url")
                kwargs = {"index": INDEX_NAME, "document": doc}
                if doc_id:
                    kwargs["id"] = doc_id

                await es.index(**kwargs)
                has_vec = "embedding" in doc
                print(f"[OK] 인덱싱: {news_data.get('title', '?')[:40]}... (vec={has_vec})")
            except Exception as e:
                print(f"[ERROR] 인덱싱 실패: {e} | 데이터: {news_data.get('title', '?')[:40]}")

    except KeyboardInterrupt:
        print("종료 요청")
    finally:
        await consumer.stop()
        await es.close()
        print("Consumer 종료")


if __name__ == "__main__":
    asyncio.run(main())
