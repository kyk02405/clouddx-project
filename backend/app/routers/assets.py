"""
============================================
자산 API 라우터
============================================

사용자 자산(주식, 코인) CRUD API입니다.

데이터 흐름:
- 사용자 → FastAPI → MongoDB Primary (Node2)
- 조회 시 Read Replica (Node3) 사용 가능
- 시세 정보는 Kafka Producer → Price Topic → Consumer 경로로 갱신
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from bson import ObjectId

from ..database import get_assets_collection

router = APIRouter()


# ============================================
# 요청/응답 모델
# ============================================

class AssetCreate(BaseModel):
    """자산 등록 요청"""
    symbol: str           # 티커 심볼 (BTC, AAPL, 005930)
    name: str             # 표시 이름
    asset_type: str       # 'stock' | 'crypto' | 'etf'
    quantity: float       # 보유 수량
    average_price: float  # 평균 매입가
    currency: str = "KRW" # 통화


class AssetUpdate(BaseModel):
    """자산 수정 요청"""
    quantity: Optional[float] = None
    average_price: Optional[float] = None


class AssetResponse(BaseModel):
    """자산 응답"""
    id: str
    symbol: str
    name: str
    asset_type: str
    quantity: float
    average_price: float
    current_price: Optional[float] = None
    profit: Optional[float] = None
    profit_percent: Optional[float] = None
    currency: str
    created_at: datetime
    updated_at: datetime


# ============================================
# API 엔드포인트
# ============================================

@router.get("/")
async def list_assets(
    user_id: str = Query(..., description="사용자 ID"),
    asset_type: Optional[str] = Query(None, description="자산 유형 필터")
):
    """
    사용자 자산 목록 조회
    
    - MongoDB에서 사용자의 모든 자산 조회
    - 현재가 정보는 캐시(Redis) 또는 별도 시세 API에서 조회
    """
    assets = get_assets_collection()
    
    query = {"user_id": user_id}
    if asset_type:
        query["asset_type"] = asset_type
    
    cursor = assets.find(query)
    result = []
    
    async for doc in cursor:
        # TODO: 현재가 정보 조회 (Redis 캐시 또는 외부 API)
        current_price = doc.get("current_price", doc["average_price"])
        quantity = doc["quantity"]
        avg_price = doc["average_price"]
        
        profit = (current_price - avg_price) * quantity
        profit_percent = ((current_price - avg_price) / avg_price * 100) if avg_price > 0 else 0
        
        result.append(AssetResponse(
            id=str(doc["_id"]),
            symbol=doc["symbol"],
            name=doc["name"],
            asset_type=doc["asset_type"],
            quantity=quantity,
            average_price=avg_price,
            current_price=current_price,
            profit=profit,
            profit_percent=profit_percent,
            currency=doc.get("currency", "KRW"),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"]
        ))
    
    return {"assets": result, "total": len(result)}


@router.post("/", response_model=AssetResponse)
async def create_asset(user_id: str, asset: AssetCreate):
    """
    자산 등록
    
    - CSV 업로드, OCR, 직접 입력 등으로 호출됨
    - MongoDB Primary(Node2)에 저장
    """
    assets = get_assets_collection()
    
    now = datetime.utcnow()
    asset_doc = {
        "user_id": user_id,
        "symbol": asset.symbol.upper(),
        "name": asset.name,
        "asset_type": asset.asset_type,
        "quantity": asset.quantity,
        "average_price": asset.average_price,
        "current_price": asset.average_price,  # 초기값
        "currency": asset.currency,
        "created_at": now,
        "updated_at": now
    }
    
    result = await assets.insert_one(asset_doc)
    
    return AssetResponse(
        id=str(result.inserted_id),
        symbol=asset_doc["symbol"],
        name=asset_doc["name"],
        asset_type=asset_doc["asset_type"],
        quantity=asset_doc["quantity"],
        average_price=asset_doc["average_price"],
        current_price=asset_doc["current_price"],
        profit=0,
        profit_percent=0,
        currency=asset_doc["currency"],
        created_at=now,
        updated_at=now
    )


@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: str, asset: AssetUpdate):
    """
    자산 수정
    
    - 수량, 평균가 업데이트
    """
    assets = get_assets_collection()
    
    update_data = {"updated_at": datetime.utcnow()}
    if asset.quantity is not None:
        update_data["quantity"] = asset.quantity
    if asset.average_price is not None:
        update_data["average_price"] = asset.average_price
    
    result = await assets.find_one_and_update(
        {"_id": ObjectId(asset_id)},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다")
    
    return AssetResponse(
        id=str(result["_id"]),
        symbol=result["symbol"],
        name=result["name"],
        asset_type=result["asset_type"],
        quantity=result["quantity"],
        average_price=result["average_price"],
        current_price=result.get("current_price"),
        currency=result.get("currency", "KRW"),
        created_at=result["created_at"],
        updated_at=result["updated_at"]
    )


@router.delete("/{asset_id}")
async def delete_asset(asset_id: str):
    """
    자산 삭제
    """
    assets = get_assets_collection()
    
    result = await assets.delete_one({"_id": ObjectId(asset_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다")
    
    return {"message": "자산이 삭제되었습니다"}
