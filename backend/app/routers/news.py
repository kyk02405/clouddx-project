import asyncio
import json
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


@router.get("/", response_model=PaginatedNewsResponse)
async def get_latest_news(
    query: Optional[str] = Query(None, description="검색어 (종목명, 코드 등)"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(5, ge=1, le=50, description="페이지당 뉴스 수"),
):
    """
    최신 뉴스 목록 조회 (페이지네이션 지원)
    """
    news_col = get_news_collection()

    try:
        # body 또는 content 필드가 비어있지 않은 문서 조회
        # 기본 쿼리: 내용이 있는 뉴스만
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

        # 검색어가 있는 경우 검색 조건 추가 (제목 또는 본문에 포함)
        if query:
            search_regex = {"$regex": query, "$options": "i"}
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

        # 총 개수 조회
        total = await news_col.count_documents(query_filter)
        total_pages = (total + limit - 1) // limit  # 올림 계산

        # 페이지네이션 적용
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
            # 본문 데이터 결정 (body 우선 -> content -> description)
            body_content = (
                doc.get("body") or doc.get("content") or doc.get("description") or ""
            )

            # published_at 변환 (ISO string 또는 datetime)
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
                    source=doc.get("source", "알 수 없음"),
                    url=doc.get("link") or doc.get("url"),
                    published_at=pub_at,
                    section=doc.get("section", "일반"),
                )
            )

        print(f"[OK] News API: Page {page}/{total_pages}, {len(news_list)} items")

        return PaginatedNewsResponse(
            items=news_list,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )
    except Exception as e:
        print(f"[FAIL] News API Error: {e}")
        raise HTTPException(
            status_code=500, detail="뉴스 데이터를 가져오는데 실패했습니다."
        )


@router.get("/search", response_model=SearchResponse)
async def search_news(
    q: str = Query(..., min_length=1, description="검색어"),
    source: Optional[str] = Query(None, description="출처 필터 (네이버 금융, 한국경제 등)"),
    asset: Optional[str] = Query(None, description="관련 종목 필터 (005930, NVDA 등)"),
    size: int = Query(10, ge=1, le=50, description="결과 수"),
):
    """
    Elasticsearch 기반 뉴스 검색

    - 키워드 검색: 제목, 본문, 요약에서 multi_match
    - Fuzzy 검색: 오타 교정 지원
    - 출처/종목 필터링 가능
    """
    es = get_elasticsearch()
    if not es:
        raise HTTPException(status_code=503, detail="Elasticsearch 연결 안됨")

    # multi_match 쿼리 (제목 가중치 3배)
    must_query = {
        "multi_match": {
            "query": q,
            "fields": ["title^3", "content", "summary"],
            "fuzziness": "AUTO",
        }
    }

    # 필터 조건
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
        print(f"[FAIL] ES Search Error: {e}")
        raise HTTPException(status_code=500, detail=f"검색 실패: {str(e)}")


# Bedrock 임베딩 클라이언트 (lazy init)
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
    q: str = Query(..., min_length=1, description="자연어 검색 쿼리"),
    size: int = Query(10, ge=1, le=50, description="결과 수"),
):
    """
    시맨틱(의미 기반) 뉴스 검색

    사용자 쿼리를 벡터화한 뒤 ES knn 검색으로 의미적으로 유사한 뉴스를 찾습니다.
    키워드 검색과 벡터 검색을 결합한 하이브리드 방식입니다.
    """
    es = get_elasticsearch()
    if not es:
        raise HTTPException(status_code=503, detail="Elasticsearch 연결 안됨")

    # 쿼리 텍스트를 벡터화
    try:
        loop = asyncio.get_running_loop()
        query_vector = await loop.run_in_executor(None, partial(_embed_text_sync, q))
    except Exception as e:
        print(f"[FAIL] 쿼리 임베딩 실패: {e}")
        raise HTTPException(status_code=503, detail="임베딩 서비스 연결 실패")

    # 하이브리드 검색: knn(벡터) + keyword(텍스트) 결합
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
        print(f"[FAIL] Semantic Search Error: {e}")
        raise HTTPException(status_code=500, detail=f"시맨틱 검색 실패: {str(e)}")
