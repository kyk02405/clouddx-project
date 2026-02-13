import logging
import asyncio
import json
import re
from functools import partial

import boto3
from fastapi import APIRouter, HTTPException, Query
from ..database import get_news_collection
from ..search import get_elasticsearch, NEWS_INDEX
from ..config import get_settings
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from pymongo import DESCENDING

router = APIRouter()
logger = logging.getLogger(__name__)


class NewsItem(BaseModel):
    id: str
    title: str
    content: str
    source: str
    url: Optional[str]
    published_at: str
    section: Optional[str]


class SearchNewsItem(BaseModel):
    id: str
    title: str
    content: str
    summary: str
    source: str
    url: Optional[str]
    published_at: Optional[str]
    tags: List[str] = []
    related_assets: List[str] = []
    score: Optional[float] = None


class SearchResponse(BaseModel):
    items: List[SearchNewsItem]
    total: int
    query: str
    took_ms: int


class PaginatedNewsResponse(BaseModel):
    items: List[NewsItem]
    total: int
    page: int
    limit: int
    total_pages: int


@router.get("", response_model=PaginatedNewsResponse)
async def get_latest_news(
    query: Optional[str] = Query(None, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(5, ge=1, le=50, description="Page size"),
):
    """
    理쒖떊 ?댁뒪 紐⑸줉 議고쉶 (?섏씠吏?ㅼ씠??吏??
    """
    news_col = get_news_collection()

    if news_col is None:
        return PaginatedNewsResponse(items=[], total=0, page=page, limit=limit, total_pages=0)

    try:
        # body ?먮뒗 content ?꾨뱶媛 鍮꾩뼱?덉? ?딆? 臾몄꽌 議고쉶
        # 湲곕낯 荑쇰━: ?댁슜???덈뒗 ?댁뒪留?
        query_filter = {
            "$and": [
                {"title": {"$exists": True, "$ne": ""}},
                {
                    "$or": [
                        {"body": {"$exists": True, "$ne": ""}},
                        {"content": {"$exists": True, "$ne": ""}},
                        {"description": {"$exists": True, "$ne": ""}},
                    ]
                },
            ]
        }

        # 寃?됱뼱媛 ?덈뒗 寃쎌슦 寃??議곌굔 異붽? (?쒕ぉ ?먮뒗 蹂몃Ц???ы븿)
        if query:
            search_regex = {"$regex": re.escape(query), "$options": "i"}
            query_filter["$and"].append(
                {
                    "$or": [
                        {"title": search_regex},
                        {"body": search_regex},
                        {"content": search_regex},
                        {"description": search_regex},
                    ]
                }
            )

        # 珥?媛쒖닔 議고쉶
        total = await news_col.count_documents(query_filter)
        total_pages = (total + limit - 1) // limit  # ?щ┝ 怨꾩궛

        # ?섏씠吏?ㅼ씠???곸슜
        skip = (page - 1) * limit
        cursor = (
            news_col.find(query_filter)
            .sort(
                [
                    ("published_at_ts", DESCENDING),
                    ("ingested_at", DESCENDING),
              ("_id", DESCENDING),
          ]
      )
      .skip(skip)
      .limit(limit)
  )

        news_list = []
        async for doc in cursor:
            # 蹂몃Ц ?곗씠??寃곗젙 (body ?곗꽑 -> content -> description)
            body_content = (
                doc.get("body") or doc.get("content") or doc.get("description") or ""
            )

            # published_at 蹂??(ISO string ?먮뒗 datetime)
            pub_at = doc.get("published_at")
            if isinstance(pub_at, datetime):
                pub_at = pub_at.isoformat()
            else:
                pub_at = str(pub_at or "")

            news_list.append(
                NewsItem(
                    id=str(doc["_id"]),
                    title=doc.get("title", ""),
                    content=body_content,
                    source=doc.get("source", "?????놁쓬"),
                    url=doc.get("link") or doc.get("url"),
                    published_at=pub_at,
                    section=doc.get("section", "?쇰컲"),
                )
            )

        logger.info("News API page=%s/%s items=%s", page, total_pages, len(news_list))

        return PaginatedNewsResponse(
            items=news_list,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )
    except Exception as e:
        logger.error("News API Error: %s", e)
        raise HTTPException(
            status_code=500, detail="?댁뒪 ?곗씠?곕? 媛?몄삤?붾뜲 ?ㅽ뙣?덉뒿?덈떎."
        )


@router.get("/search", response_model=SearchResponse)
async def search_news(
    q: str = Query(..., min_length=1, description="Search keyword"),
    source: Optional[str] = Query(None, description="Source filter"),
    asset: Optional[str] = Query(None, description="Asset code filter"),
    size: int = Query(10, ge=1, le=50, description="Result size"),
):
    """
    Elasticsearch 湲곕컲 ?댁뒪 寃??

    - ?ㅼ썙??寃?? ?쒕ぉ, 蹂몃Ц, ?붿빟?먯꽌 multi_match
    - Fuzzy 寃?? ?ㅽ? 援먯젙 吏??
    - 異쒖쿂/醫낅ぉ ?꾪꽣留?媛??
    """
    es = get_elasticsearch()
    if not es:
        raise HTTPException(status_code=503, detail="Elasticsearch ?곌껐 ?덈맖")

    # multi_match 荑쇰━ (?쒕ぉ 媛以묒튂 3諛?
    must_query = {
        "multi_match": {
            "query": q,
            "fields": ["title^3", "content", "summary"],
            "fuzziness": "AUTO",
        }
    }

    # ?꾪꽣 議곌굔
    filter_clauses = []
    if source:
        filter_clauses.append({"term": {"source": source}})
    if asset:
        filter_clauses.append({"term": {"related_assets": asset}})

    body = {
        "query": {
            "bool": {
                "must": [must_query],
                "filter": filter_clauses,
            }
        },
        "sort": [
            {"_score": {"order": "desc"}},
            {"published_at": {"order": "desc"}},
        ],
        "size": size,
    }

    try:
        result = await es.search(index=NEWS_INDEX, body=body)

        items = []
        for hit in result["hits"]["hits"]:
            src = hit["_source"]
            items.append(
                SearchNewsItem(
                    id=hit["_id"],
                    title=src.get("title", ""),
                    content=src.get("content", ""),
                    summary=src.get("summary", ""),
                    source=src.get("source", ""),
                    url=src.get("url"),
                    published_at=src.get("published_at"),
                    tags=src.get("tags", []),
                    related_assets=src.get("related_assets", []),
                    score=hit.get("_score"),
                )
            )

        total = result["hits"]["total"]["value"]

        return SearchResponse(
            items=items,
            total=total,
            query=q,
            took_ms=result.get("took", 0),
        )

    except Exception as e:
        logger.error("ES Search Error: %s", e)
        raise HTTPException(status_code=500, detail=f"寃???ㅽ뙣: {str(e)}")


# Bedrock ?꾨쿋???대씪?댁뼵??(lazy init)
_bedrock_client = None
EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0"


def _get_bedrock_client():
    global _bedrock_client
    if _bedrock_client is None:
        settings = get_settings()
        kwargs = {"region_name": settings.AWS_REGION, "service_name": "bedrock-runtime"}
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        _bedrock_client = boto3.client(**kwargs)
    return _bedrock_client


def _embed_text_sync(text: str) -> list[float]:
    client = _get_bedrock_client()
    response = client.invoke_model(
        modelId=EMBEDDING_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps({"inputText": text[:4000], "dimensions": 1024, "normalize": True}),
    )
    return json.loads(response["body"].read())["embedding"]


@router.get("/semantic-search", response_model=SearchResponse)
async def semantic_search_news(
    q: str = Query(..., min_length=1, description="Natural language query"),
    size: int = Query(10, ge=1, le=50, description="Result size"),
):
    """
    ?쒕㎤???섎? 湲곕컲) ?댁뒪 寃??

    ?ъ슜??荑쇰━瑜?踰≫꽣?뷀븳 ??ES knn 寃?됱쑝濡??섎??곸쑝濡??좎궗???댁뒪瑜?李얠뒿?덈떎.
    ?ㅼ썙??寃?됯낵 踰≫꽣 寃?됱쓣 寃고빀???섏씠釉뚮━??諛⑹떇?낅땲??
    """
    es = get_elasticsearch()
    if not es:
        raise HTTPException(status_code=503, detail="Elasticsearch ?곌껐 ?덈맖")

    # 荑쇰━ ?띿뒪?몃? 踰≫꽣??
    try:
        loop = asyncio.get_running_loop()
        query_vector = await loop.run_in_executor(None, partial(_embed_text_sync, q))
    except Exception as e:
        logger.error("荑쇰━ ?꾨쿋???ㅽ뙣: %s", e)
        raise HTTPException(status_code=503, detail="?꾨쿋???쒕퉬???곌껐 ?ㅽ뙣")

    # ?섏씠釉뚮━??寃?? knn(踰≫꽣) + keyword(?띿뒪?? 寃고빀
    body = {
        "knn": {
            "field": "embedding",
            "query_vector": query_vector,
            "k": size,
            "num_candidates": size * 5,
        },
        "query": {
            "multi_match": {
                "query": q,
                "fields": ["title^3", "content", "summary"],
            }
        },
        "size": size,
    }

    try:
        result = await es.search(index=NEWS_INDEX, body=body)

        items = []
        for hit in result["hits"]["hits"]:
            src = hit["_source"]
            items.append(
                SearchNewsItem(
                    id=hit["_id"],
                    title=src.get("title", ""),
                    content=src.get("content", ""),
                    summary=src.get("summary", ""),
                    source=src.get("source", ""),
                    url=src.get("url"),
                    published_at=src.get("published_at"),
                    tags=src.get("tags", []),
                    related_assets=src.get("related_assets", []),
                    score=hit.get("_score"),
                )
            )

        total = result["hits"]["total"]["value"]

        return SearchResponse(
            items=items,
            total=total,
            query=q,
            took_ms=result.get("took", 0),
        )

    except Exception as e:
        logger.error("Semantic Search Error: %s", e)
        raise HTTPException(status_code=500, detail=f"?쒕㎤??寃???ㅽ뙣: {str(e)}")


