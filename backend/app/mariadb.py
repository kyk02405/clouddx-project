"""
============================================
MariaDB 데이터베이스 연결
============================================

SQLAlchemy 비동기 드라이버를 사용한 MariaDB 연결 관리입니다.
회원 정보만 MariaDB에서 관리합니다.

학원 제공 서버: 211.46.52.153:15432
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, Float, Integer, ForeignKey, select, func
from datetime import datetime
from typing import List

from urllib.parse import quote_plus
from .config import get_settings

settings = get_settings()

# SQLAlchemy 비동기 엔진 (시작 시 초기화)
engine = None
async_session_factory = None


# ============================================
# ORM 모델
# ============================================


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    nickname: Mapped[str] = mapped_column(String(100), nullable=False)
    marketing_opt_in: Mapped[bool] = mapped_column(Boolean, default=False)
    login_type: Mapped[str] = mapped_column(
        SAEnum("email", "google", "kakao", "naver", name="login_type_enum"),
        default="email",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now()
    )
    portfolios: Mapped[List["Portfolio"]] = relationship(back_populates="user")


class Portfolio(Base):
    """사용자 포트폴리오 (보유 종목)"""
    __tablename__ = "portfolios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    asset_code: Mapped[str] = mapped_column(String(20), nullable=False)       # 종목코드/티커 (005930, NVDA, BTC)
    asset_name: Mapped[str] = mapped_column(String(100), nullable=False)      # 종목명 (삼성전자, NVIDIA)
    asset_type: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)            # 보유 수량
    avg_buy_price: Mapped[float] = mapped_column(Float, nullable=False)       # 평균 매입가
    currency: Mapped[str] = mapped_column(String(10), default="KRW")          # 통화 (KRW, USD)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now()
    )
    user: Mapped["User"] = relationship(back_populates="portfolios")


# ============================================
# 연결 관리
# ============================================


async def connect_to_mariadb():
    """MariaDB 연결 초기화 및 테이블 생성"""
    global engine, async_session_factory

    try:
        encoded_password = quote_plus(settings.MARIADB_PASSWORD)
        database_url = (
            f"mysql+aiomysql://{settings.MARIADB_USER}:{encoded_password}"
            f"@{settings.MARIADB_HOST}:{settings.MARIADB_PORT}/{settings.MARIADB_DATABASE}"
            f"?charset=utf8mb4"
        )

        engine = create_async_engine(database_url, echo=False, pool_size=5, max_overflow=10)
        async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        # 테이블 자동 생성
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        print(f"SUCCESS: Connected to MariaDB: {settings.MARIADB_USER}@{settings.MARIADB_HOST}:{settings.MARIADB_PORT}")
    except Exception as e:
        print(f"WARNING: MariaDB connection failed: {e}")
        engine = None
        async_session_factory = None


async def close_mariadb_connection():
    """MariaDB 연결 종료"""
    global engine

    if engine:
        await engine.dispose()
        print("MariaDB 연결 종료")


def get_session() -> async_sessionmaker[AsyncSession]:
    """세션 팩토리 반환"""
    return async_session_factory


# ============================================
# CRUD 함수
# ============================================


async def get_user_by_email(email: str, login_type: str | None = None) -> User | None:
    """이메일로 사용자 조회"""
    async with async_session_factory() as session:
        stmt = select(User).where(User.email == email)
        if login_type:
            stmt = stmt.where(User.login_type == login_type)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


async def get_user_by_id(user_id: int) -> User | None:
    """ID로 사용자 조회"""
    async with async_session_factory() as session:
        return await session.get(User, user_id)


async def create_user(
    email: str,
    password: str | None,
    nickname: str,
    marketing_opt_in: bool = False,
    login_type: str = "email",
) -> User:
    """사용자 생성"""
    async with async_session_factory() as session:
        user = User(
            email=email,
            password=password,
            nickname=nickname,
            marketing_opt_in=marketing_opt_in,
            login_type=login_type,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


async def update_user(user_id: int, **kwargs) -> User | None:
    """사용자 정보 업데이트"""
    async with async_session_factory() as session:
        user = await session.get(User, user_id)
        if not user:
            return None
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        await session.commit()
        await session.refresh(user)
        return user


# ============================================
# 포트폴리오 CRUD
# ============================================


async def get_user_portfolios(user_id: int) -> list[Portfolio]:
    """사용자 보유 종목 전체 조회"""
    async with async_session_factory() as session:
        stmt = select(Portfolio).where(Portfolio.user_id == user_id)
        result = await session.execute(stmt)
        return list(result.scalars().all())


async def add_portfolio_item(
    user_id: int,
    asset_code: str,
    asset_name: str,
    asset_type: str,
    quantity: float,
    avg_buy_price: float,
    currency: str = "KRW",
) -> Portfolio:
    """포트폴리오에 종목 추가"""
    async with async_session_factory() as session:
        item = Portfolio(
            user_id=user_id,
            asset_code=asset_code,
            asset_name=asset_name,
            asset_type=asset_type,
            quantity=quantity,
            avg_buy_price=avg_buy_price,
            currency=currency,
        )
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return item


async def update_portfolio_item(item_id: int, user_id: int, **kwargs) -> Portfolio | None:
    """포트폴리오 종목 수정"""
    async with async_session_factory() as session:
        stmt = select(Portfolio).where(Portfolio.id == item_id, Portfolio.user_id == user_id)
        result = await session.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            return None
        for key, value in kwargs.items():
            if hasattr(item, key):
                setattr(item, key, value)
        await session.commit()
        await session.refresh(item)
        return item


async def delete_portfolio_item(item_id: int, user_id: int) -> bool:
    """포트폴리오 종목 삭제"""
    async with async_session_factory() as session:
        stmt = select(Portfolio).where(Portfolio.id == item_id, Portfolio.user_id == user_id)
        result = await session.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            return False
        await session.delete(item)
        await session.commit()
        return True
