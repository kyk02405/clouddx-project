"""Elasticsearch connection helpers."""

import logging

from elasticsearch import AsyncElasticsearch

from .config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

es_client: AsyncElasticsearch | None = None


async def connect_to_elasticsearch():
    """Initialize Elasticsearch connection."""
    global es_client

    try:
        es_client = AsyncElasticsearch(hosts=[settings.ELASTICSEARCH_URL])
        info = await es_client.info()
        logger.info("Elasticsearch connected: %s", settings.ELASTICSEARCH_URL)
        logger.info("cluster=%s version=%s", info["cluster_name"], info["version"]["number"])
    except Exception as e:
        logger.warning("Elasticsearch connection failed (retry later): %s", e)
        es_client = None


async def close_elasticsearch_connection():
    """Close Elasticsearch connection."""
    global es_client

    if es_client:
        await es_client.close()
        logger.info("Elasticsearch connection closed")


def get_elasticsearch() -> AsyncElasticsearch | None:
    """Return Elasticsearch client."""
    return es_client


NEWS_INDEX = "news"
ASSETS_INDEX = "assets"


async def ensure_indices():
    """Create required indices if they do not exist."""
    if not es_client:
        return

    if not await es_client.indices.exists(index=NEWS_INDEX):
        await es_client.indices.create(
            index=NEWS_INDEX,
            body={
                "settings": {
                    "number_of_shards": 1,
                    "number_of_replicas": settings.ES_NEWS_REPLICAS,
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
        logger.info("Index created: %s", NEWS_INDEX)
