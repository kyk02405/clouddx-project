"""
============================================
Redis 캐시/세션 연결
============================================

Redis 비동기 클라이언트 관리입니다.
세션 저장, API 응답 캐싱, Rate Limiting에 사용됩니다.

운영 환경:
- Master: Node2
- Replica: Node3
- Sentinel: Node1, Node2, Node3에 분산 배치
"""

import redis.asyncio as redis
from .config import get_settings

settings = get_settings()

# Redis 클라이언트 (앱 시작 시 초기화)
redis_client: redis.Redis = None


async def connect_to_redis():
    """Redis 연결 초기화"""
    global redis_client
    
    redis_client = redis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True
    )
    
    # 연결 테스트
    try:
        await redis_client.ping()
        print(f"✅ Redis 연결 성공: {settings.REDIS_URL}")
    except Exception as e:
        print(f"❌ Redis 연결 실패: {e}")
        raise


async def close_redis_connection():
    """Redis 연결 종료"""
    global redis_client
    
    if redis_client:
        await redis_client.close()
        print("Redis 연결 종료")


def get_redis() -> redis.Redis:
    """Redis 클라이언트 반환 (FastAPI 의존성 주입용)"""
    return redis_client


# ============================================
# 캐시 헬퍼 함수
# ============================================

async def cache_get(key: str) -> str | None:
    """캐시에서 값 조회"""
    return await redis_client.get(key)


async def cache_set(key: str, value: str, expire_seconds: int = 300):
    """캐시에 값 저장 (기본 5분 TTL)"""
    await redis_client.setex(key, expire_seconds, value)


async def cache_delete(key: str):
    """캐시에서 값 삭제"""
    await redis_client.delete(key)
