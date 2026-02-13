import logging
import re
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from pymongo import DESCENDING

from ..database import get_news_collection

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
    """MongoDB 기반 뉴스 목록 조회(페이지네이션)."""
    news_col = get_news_collection()

    if news_col is None:
        return PaginatedNewsResponse(items=[], total=0, page=page, limit=limit, total_pages=0)

    try:
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

        total = await news_col.count_documents(query_filter)
        total_pages = (total + limit - 1) // limit

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

        news_list: list[NewsItem] = []
        async for doc in cursor:
            body_content = doc.get("body") or doc.get("content") or doc.get("description") or ""

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
                    source=doc.get("source", "unknown"),
                    url=doc.get("link") or doc.get("url"),
                    published_at=pub_at,
                    section=doc.get("section", "general"),
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
        logger.error("News API error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch news data")
