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

import asyncio
from datetime import datetime
from typing import Dict, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from ..database import get_database, get_assets_collection
from ..models.asset import AssetCreateExtended, BulkAssetCreate, BulkAssetResponse
from ..services.exchange_rate import get_exchange_rate
from ..services.market_data import kis_client, crypto_client
from .auth import get_current_user, UserResponse

router = APIRouter()


# ============================================
# 요청/응답 모델
# ============================================


class AssetCreate(BaseModel):
    """자산 등록 요청"""

    symbol: str  # 티커 심볼 (BTC, AAPL, 005930)
    name: str  # 표시 이름
    asset_type: str  # 'stock' | 'crypto' | 'etf'
    quantity: float  # 보유 수량
    average_price: float  # 평균 매입가
    currency: str = "KRW"  # 통화
    memo: Optional[str] = None  # 사용자 메모/AI 요약
    buy_reason: Optional[str] = None  # 매수 사유 (News, Technical 등)


class AssetUpdate(BaseModel):
    """자산 수정 요청"""

    quantity: Optional[float] = None
    average_price: Optional[float] = None
    memo: Optional[str] = None
    buy_reason: Optional[str] = None
    ai_analysis: Optional[str] = None


class SellRequest(BaseModel):
    """자산 매도 요청"""

    quantity: float
    sell_price: float
    sell_reason: Optional[str] = None
    sell_date: datetime = datetime.utcnow()
    memo: Optional[str] = None


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
    profit_percent: Optional[float] = None
    currency: str
    memo: Optional[str] = None
    buy_reason: Optional[str] = None
    ai_analysis: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ============================================
# API 엔드포인트
# ============================================


@router.get("/")
async def list_assets(
    current_user: UserResponse = Depends(get_current_user),
    asset_type: Optional[str] = Query(None, description="자산 유형 필터"),
):
    """
    사용자 자산 목록 조회

    - MongoDB에서 사용자의 모든 자산 조회
    - 현재가 정보는 캐시(Redis) 또는 별도 시세 API에서 조회
    """
    assets = get_assets_collection()

    # FX rates (KRW base)
    try:
        usd_to_krw = await get_exchange_rate("USD", "KRW")
    except Exception as e:
        print(f"[WARNING] FX rate lookup failed (USD->KRW): {e}")
        usd_to_krw = 1.0

    query = {"user_id": current_user.id}
    if asset_type:
        query["asset_type"] = asset_type

    try:
        cursor = assets.find(query)
        docs = await cursor.to_list(length=100)

        # 실시간 시세 조회를 위한 비동기 작업 생성
        tasks = []
        task_meta = []
        for doc in docs:
            # ... (omitted for brevity in replacement but kept in file)
            symbol = doc["symbol"]
            asset_type = doc["asset_type"]
            if asset_type == "stock":
                currency = (doc.get("currency") or "KRW").upper()
                if symbol in {"USD", "KRW", "JPY"}:
                    tasks.append(get_exchange_rate(symbol, "KRW"))
                    task_meta.append({"kind": "fx", "symbol": symbol})
                elif currency == "USD" or (not symbol.isdigit()):
                    tasks.append(kis_client.get_current_price(symbol, market="US"))
                    task_meta.append({"kind": "stock_usd"})
                else:
                    tasks.append(kis_client.get_current_price(symbol, market="KR"))
                    task_meta.append({"kind": "stock_kr"})
            elif asset_type == "crypto":
                tasks.append(crypto_client.get_current_price(symbol))
                task_meta.append({"kind": "crypto"})
            else:
                tasks.append(asyncio.sleep(0, result=None))
                task_meta.append({"kind": "other"})

        # 시세 동시 조회
        prices = await asyncio.gather(*tasks, return_exceptions=True)

        result = []
        update_ops = []
        now = datetime.utcnow()
        for i, doc in enumerate(docs):
            price_data = prices[i]
            current_price = doc.get("current_price", doc["average_price"])
            avg_price = doc["average_price"]
            original_currency = (doc.get("currency") or "KRW").upper()
            display_currency = original_currency
            meta = task_meta[i] if i < len(task_meta) else {"kind": "other"}

            if (
                price_data
                and not isinstance(price_data, Exception)
                and isinstance(price_data, dict)
                and "price" in price_data
            ):
                current_price = price_data["price"]

            # FX cash (USD/JPY/KRW) -> KRW base
            if meta.get("kind") == "fx":
                if price_data and not isinstance(price_data, Exception):
                    current_price = float(price_data)
                display_currency = "KRW"

            # USD assets -> convert to KRW for display/analysis
            if original_currency == "USD" and meta.get("kind") in {"stock_usd"}:
                # Heuristic: if avg_price is very large, assume it's already KRW
                avg_is_krw = avg_price >= 10000
                if not avg_is_krw:
                    avg_price = avg_price * usd_to_krw
                current_price = current_price * usd_to_krw
                display_currency = "KRW"

            # Update DB only for non-converted assets
            if (
                price_data
                and not isinstance(price_data, Exception)
                and isinstance(price_data, dict)
                and "price" in price_data
                and display_currency == original_currency
            ):
                update_ops.append(
                    UpdateOne(
                        {"_id": doc["_id"]},
                        {"$set": {"current_price": current_price, "updated_at": now}},
                    )
                )

            quantity = doc["quantity"]

            profit = (current_price - avg_price) * quantity
            profit_percent = (
                ((current_price - avg_price) / avg_price * 100) if avg_price > 0 else 0
            )

            result.append(
                AssetResponse(
                    id=str(doc["_id"]),
                    symbol=doc["symbol"],
                    name=doc["name"],
                    asset_type=doc["asset_type"],
                    quantity=quantity,
                    average_price=avg_price,
                    current_price=current_price,
                    profit=profit,
                    profit_percent=profit_percent,
                    currency=display_currency,
                    memo=doc.get("memo"),
                    buy_reason=doc.get("buy_reason"),
                    ai_analysis=doc.get("ai_analysis"),
                    created_at=doc["created_at"],
                    updated_at=doc["updated_at"],
                )
            )

        # DB?먯꽌 current_price ?낅뜲?댄듃 (媛?ν븳 寃쎌슦)
        if update_ops:
            try:
                await assets.bulk_write(update_ops, ordered=False)
            except Exception as e:
                print(f"[WARNING] Failed to update current_price: {e}")

        return {"assets": result, "total": len(result)}

    except Exception as e:
        import traceback

        error_msg = f"Error in list_assets: {e}\n{traceback.format_exc()}"
        print(error_msg)
        return {"status": "error", "detail": str(e), "assets": []}


@router.post("/", response_model=AssetResponse)
async def create_asset(
    asset: AssetCreate, current_user: UserResponse = Depends(get_current_user)
):
    """
    Asset Registration
    """
    assets = get_assets_collection()
    now = datetime.utcnow()
    asset_doc = {
        "user_id": current_user.id,  # 인증된 ID 사용
        "symbol": asset.symbol.upper(),
        "name": asset.name,
        "asset_type": asset.asset_type,
        "quantity": asset.quantity,
        "average_price": asset.average_price,
        "current_price": asset.average_price,  # 초기값
        "currency": asset.currency,
        "memo": asset.memo,
        "buy_reason": asset.buy_reason,
        "ai_analysis": None,  # 초기생성시엔 비어있음 (비동기로 채우거나 별도 요청)
        "created_at": now,
        "updated_at": now,
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
        memo=asset_doc.get("memo"),
        buy_reason=asset_doc.get("buy_reason"),
        ai_analysis=None,
        created_at=now,
        updated_at=now,
    )


@router.post("/{asset_id}/sell")
async def sell_asset(
    asset_id: str,
    sell_data: SellRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    자산 매도

    - 매도 수량만큼 자산 차감
    - 실현손익 계산
    - Transaction 기록 생성
    """
    assets = get_assets_collection()
    db = get_database()
    transactions = db["transactions"]

    # 1. 자산 조회 및 수량 차감 (Atomic)
    # find_one_and_update를 사용하여 Race Condition 방지 (#4)
    now = datetime.utcnow()
    try:
        updated_asset = await assets.find_one_and_update(
            {
                "_id": ObjectId(asset_id),
                "user_id": current_user.id,
                "quantity": {"$gte": sell_data.quantity},
            },
            {"$inc": {"quantity": -sell_data.quantity}, "$set": {"updated_at": now}},
            return_document=True,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="잘못된 자산 ID입니다")

    if not updated_asset:
        # 자산이 없거나 수량이 부족한 경우
        existing_asset = await assets.find_one(
            {"_id": ObjectId(asset_id), "user_id": current_user.id}
        )
        if not existing_asset:
            raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다")
        raise HTTPException(
            status_code=400,
            detail=f"매도 수량({sell_data.quantity})이 보유 수량({existing_asset['quantity']})을 초과합니다",
        )

    # 3. 실현손익 계산
    average_price = updated_asset["average_price"]
    # ... 이전 수량은 updated_asset["quantity"] + sell_data.quantity 임

    if sell_data.quantity <= 0:
        raise HTTPException(status_code=400, detail="매도 수량은 0보다 커야 합니다")

    # 3. 실현손익 계산
    average_price = updated_asset["average_price"]
    realized_profit = (sell_data.sell_price - average_price) * sell_data.quantity
    profit_rate = (
        ((sell_data.sell_price - average_price) / average_price * 100)
        if average_price > 0
        else 0
    )

    # 4. Transaction 기록 생성
    now = datetime.utcnow()
    transaction_doc = {
        "user_id": current_user.id,
        "asset_id": asset_id,
        "symbol": updated_asset["symbol"],
        "name": updated_asset["name"],
        "transaction_type": "sell",
        "quantity": sell_data.quantity,
        "price": sell_data.sell_price,
        "total_amount": sell_data.sell_price * sell_data.quantity,
        "buy_reason": None,
        "sell_reason": sell_data.sell_reason,
        "realized_profit": realized_profit,
        "memo": sell_data.memo,
        "transaction_date": sell_data.sell_date,
        "created_at": now,
    }

    result = await transactions.insert_one(transaction_doc)

    # 5. 자산이 0이면 삭제
    if updated_asset["quantity"] == 0:
        await assets.delete_one({"_id": ObjectId(asset_id)})
        message = "전량 매도 완료 (자산 삭제)"
    else:
        message = "매도 완료"

    return {
        "message": message,
        "sold_quantity": sell_data.quantity,
        "remaining_quantity": updated_asset["quantity"],
        "realized_profit": realized_profit,
        "profit_rate": profit_rate,
        "transaction_id": str(result.inserted_id),
    }


@router.post("/bulk", response_model=BulkAssetResponse)
async def bulk_create_assets(
    bulk_request: BulkAssetCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    assets = get_assets_collection()
    now = datetime.utcnow()
    # user_id = user_id # Query에서 직접 받음

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

            existing = await assets.find_one(
                {"user_id": current_user.id, "symbol": symbol}
            )
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
                "user_id": current_user.id,
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
                "memo",
                "buy_reason",
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
                UpdateOne(
                    {"user_id": current_user.id, "symbol": symbol},
                    update_doc,
                    upsert=True,
                )
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
                failures.append(
                    {
                        "row": meta["row"],
                        "symbol": meta["symbol"],
                        "error": error.get("errmsg", str(exc)),
                    }
                )
            upserted = exc.details.get("upserted", []) if exc.details else []
            created_ids = [str(item.get("_id")) for item in upserted if item.get("_id")]
            success_count = max(0, success_count - len(write_errors))
        except Exception as exc:
            for meta in operation_meta:
                failures.append(
                    {
                        "row": meta["row"],
                        "symbol": meta["symbol"],
                        "error": str(exc),
                    }
                )
            success_count = 0

    return BulkAssetResponse(
        success_count=success_count,
        failure_count=len(failures),
        failures=failures,
        created_ids=created_ids,
    )


@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: str,
    asset: AssetUpdate,
    current_user: UserResponse = Depends(get_current_user),
):
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
    if asset.memo is not None:
        update_data["memo"] = asset.memo
    if asset.buy_reason is not None:
        update_data["buy_reason"] = asset.buy_reason
    if asset.ai_analysis is not None:
        update_data["ai_analysis"] = asset.ai_analysis

    result = await assets.find_one_and_update(
        {"_id": ObjectId(asset_id), "user_id": current_user.id},
        {"$set": update_data},
        return_document=True,
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
        memo=result.get("memo"),
        buy_reason=result.get("buy_reason"),
        ai_analysis=result.get("ai_analysis"),
        created_at=result["created_at"],
        updated_at=result["updated_at"],
    )


@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: str, current_user: UserResponse = Depends(get_current_user)
):
    """
    자산 삭제
    """
    assets = get_assets_collection()

    try:
        result = await assets.delete_one(
            {"_id": ObjectId(asset_id), "user_id": current_user.id}
        )

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다")

        return {"message": "자산이 삭제되었습니다"}
    except Exception as e:
        print(f"Error in delete_asset: {e}")
        raise HTTPException(status_code=500, detail=str(e))
