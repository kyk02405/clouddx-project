"""
============================================
CloudDX Asset Management API - FastAPI 메인
============================================

AI 기반 자산관리 플랫폼 백엔드 진입점입니다.

운영 환경 Node1 배치:
- Nginx → FastAPI Gateway (이 서버)
- Auth Service, General Service로 분리 예정

현재 개발 환경에서는 통합 서버로 운영합니다.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import connect_to_mongodb, close_mongodb_connection
from .mariadb import connect_to_mariadb, close_mariadb_connection
from .cache import connect_to_redis, close_redis_connection

from .search import connect_to_elasticsearch, close_elasticsearch_connection, ensure_indices
from .routers import assets, market, auth, news, notifications, chat, transactions, portfolio
from .services.alert_service import MarketMonitor
import asyncio

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 수명 주기 관리"""
    # 시작 시 연결
    print("SERVER STARTING...")
    await connect_to_mongodb()
    await connect_to_mariadb()
    await connect_to_redis()
    await connect_to_elasticsearch()
    await ensure_indices()
    print("SUCCESS: Registered all services")

    # Start Market Monitor
    monitor = MarketMonitor()
    monitor_task = asyncio.create_task(monitor.start_monitoring())
    app.state.market_monitor = monitor

    yield

    # 종료 시 정리
    print("SERVER SHUTTING DOWN...")
    monitor_task.cancel()
    await close_mongodb_connection()
    await close_mariadb_connection()
    await close_redis_connection()
    await close_elasticsearch_connection()
    print("SUCCESS: Normal shutdown")


# FastAPI 앱 인스턴스
app = FastAPI(
    title=settings.APP_NAME,
    description="AI 기반 자산관리 플랫폼 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS 설정 (프론트엔드 접근 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# 헬스 체크 엔드포인트
# ============================================


@app.get("/health")
async def health_check():
    """Service Health Check"""
    try:
        from .database import client as mongo_client
        from .mariadb import engine as mariadb_engine
        from .cache import redis_client
        from .search import es_client

        status = {
            "status": "healthy",
            "services": {
                "mongodb": "connected" if mongo_client else "disconnected",
                "mariadb": "connected" if mariadb_engine else "disconnected",
                "redis": "connected" if redis_client else "disconnected",
                "elasticsearch": "connected" if es_client else "disconnected",
            },
        }
        return status
    except Exception as e:
        import traceback

        return {
            "status": "error",
            "detail": str(e),
            "traceback": traceback.format_exc(),
        }


@app.get("/")
async def root():
    """API 루트"""
    return {
        "message": "CloudDX Asset Management API",
        "docs": "/docs",
        "health": "/health",
    }


# ============================================
# 라우터 등록
# ============================================

app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["인증"])
app.include_router(
    assets.router, prefix=f"{settings.API_V1_PREFIX}/assets", tags=["자산"]
)
app.include_router(
    transactions.router,
    prefix=f"{settings.API_V1_PREFIX}/transactions",
    tags=["거래이력"],
)
app.include_router(
    portfolio.router,
    prefix=f"{settings.API_V1_PREFIX}/portfolio",
    tags=["포트폴리오(MariaDB)"],
)
app.include_router(
    market.router, prefix=f"{settings.API_V1_PREFIX}/market", tags=["시세"]
)
app.include_router(news.router, prefix=f"{settings.API_V1_PREFIX}/news", tags=["뉴스"])
app.include_router(
    notifications.router,
    prefix=f"{settings.API_V1_PREFIX}/notifications",
    tags=["알림"],
)
app.include_router(
    chat.router, prefix=f"{settings.API_V1_PREFIX}/chat", tags=["AI 채팅"]
)
