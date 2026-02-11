"""
MariaDB Portfolio API Router

JWT 인증 사용자 기준으로 MariaDB portfolios 테이블을 CRUD 합니다.
"""

from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..mariadb import (
    add_portfolio_item,
    delete_portfolio_item,
    get_user_portfolios,
    update_portfolio_item,
)
from .auth import UserResponse, get_current_user

router = APIRouter()

AssetType = Literal["stock_kr", "stock_us", "crypto", "etf"]


class PortfolioCreate(BaseModel):
    asset_code: str = Field(..., min_length=1, max_length=20)
    asset_name: str = Field(..., min_length=1, max_length=100)
    asset_type: AssetType
    quantity: float = Field(..., gt=0)
    avg_buy_price: float = Field(..., gt=0)
    currency: str = Field(default="KRW", min_length=3, max_length=10)


class PortfolioUpdate(BaseModel):
    asset_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    asset_type: Optional[AssetType] = None
    quantity: Optional[float] = Field(default=None, gt=0)
    avg_buy_price: Optional[float] = Field(default=None, gt=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=10)


class PortfolioResponse(BaseModel):
    id: int
    user_id: int
    asset_code: str
    asset_name: str
    asset_type: str
    quantity: float
    avg_buy_price: float
    currency: str
    created_at: datetime
    updated_at: datetime


def _to_response(item) -> PortfolioResponse:
    return PortfolioResponse(
        id=item.id,
        user_id=item.user_id,
        asset_code=item.asset_code,
        asset_name=item.asset_name,
        asset_type=item.asset_type,
        quantity=item.quantity,
        avg_buy_price=item.avg_buy_price,
        currency=item.currency,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get("/", response_model=list[PortfolioResponse])
async def list_portfolio_items(
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        items = await get_user_portfolios(int(current_user.id))
        return [_to_response(item) for item in items]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MariaDB 조회 실패: {e}",
        )


@router.post("/", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio_item(
    payload: PortfolioCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        created = await add_portfolio_item(
            user_id=int(current_user.id),
            asset_code=payload.asset_code.upper(),
            asset_name=payload.asset_name,
            asset_type=payload.asset_type,
            quantity=payload.quantity,
            avg_buy_price=payload.avg_buy_price,
            currency=payload.currency.upper(),
        )
        return _to_response(created)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MariaDB 저장 실패: {e}",
        )


@router.patch("/{item_id}", response_model=PortfolioResponse)
async def patch_portfolio_item(
    item_id: int,
    payload: PortfolioUpdate,
    current_user: UserResponse = Depends(get_current_user),
):
    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="수정할 필드가 없습니다.")

    if "currency" in updates:
        updates["currency"] = str(updates["currency"]).upper()

    try:
        updated = await update_portfolio_item(
            item_id=item_id,
            user_id=int(current_user.id),
            **updates,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MariaDB 수정 실패: {e}",
        )

    if not updated:
        raise HTTPException(status_code=404, detail="포트폴리오 항목을 찾을 수 없습니다.")

    return _to_response(updated)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_portfolio_item(
    item_id: int,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        deleted = await delete_portfolio_item(item_id=item_id, user_id=int(current_user.id))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MariaDB 삭제 실패: {e}",
        )

    if not deleted:
        raise HTTPException(status_code=404, detail="포트폴리오 항목을 찾을 수 없습니다.")
