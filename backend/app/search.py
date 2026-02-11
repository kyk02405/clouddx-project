"""
============================================
Elasticsearch 검색 엔진 연결
============================================

뉴스 검색, 자산 검색 등에 사용되는 Elasticsearch 클라이언트입니다.

운영 환경:
- Elasticsearch & Kibana: Node3 호스트에 설치
- Indexer Consumer가 Kafka 메시지를 받아 ES에 인덱싱
"""

from elasticsearch import AsyncElasticsearch
from .config import get_settings

settings = get_settings()

# Elasticsearch 클라이언트
es_client: AsyncElasticsearch = None


async def connect_to_elasticsearch():
    """Elasticsearch 연결 초기화"""
    global es_client

    try:
        es_client = AsyncElasticsearch(hosts=[settings.ELASTICSEARCH_URL])
        info = await es_client.info()
        print(f"[OK] Elasticsearch 연결 성공: {settings.ELASTICSEARCH_URL}")
        print(f"   클러스터: {info['cluster_name']}, 버전: {info['version']['number']}")
    except Exception as e:
        print(f"[WARNING] Elasticsearch 연결 실패 (나중에 재시도): {e}")
        es_client = None


async def close_elasticsearch_connection():
    """Elasticsearch 연결 종료"""
    global es_client

    if es_client:
        await es_client.close()
        print("Elasticsearch 연결 종료")


def get_elasticsearch() -> AsyncElasticsearch:
    """Elasticsearch 클라이언트 반환 (FastAPI 의존성 주입용)"""
    return es_client


# ============================================
# 인덱스 정의
# ============================================

NEWS_INDEX = "news"
ASSETS_INDEX = "assets"


async def ensure_indices():
    """필요한 인덱스 생성 (존재하지 않는 경우)"""
    if not es_client:
        return

    # 뉴스 인덱스
    if not await es_client.indices.exists(index=NEWS_INDEX):
        await es_client.indices.create(
            index=NEWS_INDEX,
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
        print(f"[OK] 인덱스 생성: {NEWS_INDEX}")
