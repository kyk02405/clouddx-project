
from fastapi import APIRouter, HTTPException, Query
from ..database import get_news_collection
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

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

@router.get("/", response_model=PaginatedNewsResponse)
async def get_latest_news(
    query: Optional[str] = Query(None, description="검색어 (종목명, 코드 등)"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(5, ge=1, le=50, description="페이지당 뉴스 수")
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
                {"$or": [
                    {"body": {"$exists": True, "$ne": ""}},
                    {"content": {"$exists": True, "$ne": ""}},
                    {"description": {"$exists": True, "$ne": ""}}
                ]}
            ]
        }

        # 검색어가 있는 경우 검색 조건 추가 (제목 또는 본문에 포함)
        if query:
            search_regex = {"$regex": query, "$options": "i"}
            query_filter["$and"].append({
                "$or": [
                    {"title": search_regex},
                    {"body": search_regex},
                    {"content": search_regex},
                    {"description": search_regex}
                ]
            })
        
        # 총 개수 조회
        total = await news_col.count_documents(query_filter)
        total_pages = (total + limit - 1) // limit  # 올림 계산
        
        # 페이지네이션 적용
        skip = (page - 1) * limit
        cursor = news_col.find(query_filter).sort("published_at", -1).skip(skip).limit(limit)
        
        news_list = []
        async for doc in cursor:
            # 본문 데이터 결정 (body 우선 -> content -> description)
            body_content = doc.get("body") or doc.get("content") or doc.get("description") or ""
            
            # published_at 변환 (ISO string 또는 datetime)
            pub_at = doc.get("published_at")
            if isinstance(pub_at, datetime):
                pub_at = pub_at.isoformat()
            else:
                pub_at = str(pub_at or "")

            news_list.append(NewsItem(
                id=str(doc["_id"]),
                title=doc.get("title", ""),
                content=body_content,
                source=doc.get("source", "알 수 없음"),
                url=doc.get("link") or doc.get("url"),
                published_at=pub_at,
                section=doc.get("section", "일반")
            ))
        
        print(f"✅ News API: Page {page}/{total_pages}, {len(news_list)} items")
        
        return PaginatedNewsResponse(
            items=news_list,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    except Exception as e:
        print(f"❌ News API Error: {e}")
        raise HTTPException(status_code=500, detail="뉴스 데이터를 가져오는데 실패했습니다.")
