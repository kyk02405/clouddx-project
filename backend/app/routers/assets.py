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
from typing import Optional, Dict
from bson import ObjectId
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError

from ..database import get_assets_collection
from ..models.asset import AssetCreateExtended, BulkAssetCreate, BulkAssetResponse
from ..services.exchange_rate import get_exchange_rate
from ..services.market_data import kis_client, crypto_client
import asyncio

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
    
    try:
        cursor = assets.find(query)
        docs = await cursor.to_list(length=100)
        
        # 실시간 시세 조회를 위한 비동기 작업 생성
        tasks = []
        for doc in docs:
            # ... (omitted for brevity in replacement but kept in file)
            symbol = doc["symbol"]
            asset_type = doc["asset_type"]
            if asset_type == "stock":
                tasks.append(kis_client.get_current_price(symbol))
            elif asset_type == "crypto":
                tasks.append(crypto_client.get_current_price(symbol))
            else:
                tasks.append(asyncio.sleep(0, result=None))

        # 시세 동시 조회
        prices = await asyncio.gather(*tasks, return_exceptions=True)
        
        result = []
        for i, doc in enumerate(docs):
            price_data = prices[i]
            current_price = doc.get("current_price", doc["average_price"])
            
            if price_data and not isinstance(price_data, Exception) and "price" in price_data:
                current_price = price_data["price"]
                
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

    except Exception as e:
        print(f"❌ Error in list_assets: {e}")
        # DB 연결 실패 시 빈 목록 반환 (500 에러 방지)
        return {"assets": [], "total": 0, "error": str(e)}


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


@router.post("/bulk", response_model=BulkAssetResponse)
async def bulk_create_assets(
    bulk_request: BulkAssetCreate,
    user_id: str = Query(..., description="사용자 ID")
):
    assets = get_assets_collection()
    now = datetime.utcnow()

    merged_assets: Dict[str, AssetCreateExtended] = {}
    merged_rows: Dict[str, int] = {}

    for index, asset in enumerate(bulk_request.assets):
        symbol = asset.symbol.upper()
        if symbol in merged_assets:
            existing = merged_assets[symbol]
            total_quantity = existing.quantity + asset.quantity
            if total_quantity != 0:
                existing.average_price = (
                    existing.average_price * existing.quantity
                    + asset.average_price * asset.quantity
                ) / total_quantity
            else:
                existing.average_price = 0
            existing.quantity = total_quantity

            if existing.exchange_rate is None and asset.exchange_rate is not None:
                existing.exchange_rate = asset.exchange_rate
        else:
            if asset.symbol != symbol:
                asset.symbol = symbol
            merged_assets[symbol] = asset
            merged_rows[symbol] = index

    failures = []
    operations = []
    operation_meta = []

    for symbol, asset_data in merged_assets.items():
        row_index = merged_rows.get(symbol)
        try:
            currency = (asset_data.currency or "KRW").upper()
            asset_data.currency = currency

            exchange_rate = asset_data.exchange_rate
            if currency in {"USD", "JPY"} and exchange_rate is None:
                exchange_rate = await get_exchange_rate(currency, "KRW")
                asset_data.exchange_rate = exchange_rate

            existing = await assets.find_one({"user_id": user_id, "symbol": symbol})
            existing_quantity = existing.get("quantity", 0) if existing else 0
            existing_average = existing.get("average_price", 0) if existing else 0

            incoming_quantity = asset_data.quantity
            incoming_average = asset_data.average_price
            total_quantity = existing_quantity + incoming_quantity
            if total_quantity != 0:
                new_average = (
                    existing_average * existing_quantity
                    + incoming_average * incoming_quantity
                ) / total_quantity
            else:
                new_average = 0

            update_fields = {
                "user_id": user_id,
                "symbol": symbol,
                "name": asset_data.name,
                "asset_type": asset_data.asset_type,
                "quantity": total_quantity,
                "average_price": new_average,
                "currency": currency,
                "updated_at": now,
            }

            optional_fields = [
                "exchange_rate",
                "transaction_type",
                "transaction_date",
                "account_name",
            ]
            for field in optional_fields:
                value = getattr(asset_data, field)
                if value is not None:
                    update_fields[field] = value

            update_doc = {
                "$set": update_fields,
                "$setOnInsert": {
                    "created_at": now,
                    "current_price": new_average,
                },
            }

            operations.append(
                UpdateOne({"user_id": user_id, "symbol": symbol}, update_doc, upsert=True)
            )
            operation_meta.append({"row": row_index, "symbol": symbol})
        except Exception as exc:
            failures.append({"row": row_index, "symbol": symbol, "error": str(exc)})

    created_ids = []
    success_count = len(operations)

    if operations:
        try:
            result = await assets.bulk_write(operations, ordered=False)
            if result.upserted_ids:
                created_ids = [str(_id) for _id in result.upserted_ids.values()]
        except BulkWriteError as exc:
            write_errors = exc.details.get("writeErrors", []) if exc.details else []
            for error in write_errors:
                error_index = error.get("index")
                meta = (
                    operation_meta[error_index]
                    if error_index is not None and error_index < len(operation_meta)
                    else {"row": None, "symbol": None}
                )
                failures.append({
                    "row": meta["row"],
                    "symbol": meta["symbol"],
                    "error": error.get("errmsg", str(exc)),
                })
            upserted = exc.details.get("upserted", []) if exc.details else []
            created_ids = [str(item.get("_id")) for item in upserted if item.get("_id")]
            success_count = max(0, success_count - len(write_errors))
        except Exception as exc:
            for meta in operation_meta:
                failures.append({
                    "row": meta["row"],
                    "symbol": meta["symbol"],
                    "error": str(exc),
                })
            success_count = 0

    return BulkAssetResponse(
        success_count=success_count,
        failure_count=len(failures),
        failures=failures,
        created_ids=created_ids,
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
