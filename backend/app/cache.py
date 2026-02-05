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
        settings.REDIS_URL, encoding="utf-8", decode_responses=True
    )

    # 연결 테스트
    try:
        await redis_client.ping()
        print(f"[OK] Redis 연결 성공: {settings.REDIS_URL}")
    except Exception as e:
        print(f"[WARNING] Redis 연결 실패 (기능 제한): {e}")
        # raise를 제거하여 Redis 없이도 앱이 가동되도록 함
        # redis_client는 None이 아니지만 ping에 실패한 상태이므로
        # cache_get 등의 함수에서 예외 처리가 필요함 (이미 되어 있음)


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
    if redis_client is None:
        return None
    try:
        return await redis_client.get(key)
    except Exception as e:
        print(f"⚠️ Redis GET 실패: {e}")
        return None


async def cache_set(key: str, value: str, expire_seconds: int = 300):
    """캐시에 값 저장 (기본 5분 TTL)"""
    if redis_client is None:
        return  # Redis 없이도 작동 지속
    try:
        await redis_client.setex(key, expire_seconds, value)
    except Exception as e:
        print(f"⚠️ Redis SET 실패: {e}")


async def cache_delete(key: str):
    """캐시에서 값 삭제"""
    if redis_client is None:
        return
    try:
        await redis_client.delete(key)
    except Exception as e:
        print(f"⚠️ Redis DELETE 실패: {e}")
