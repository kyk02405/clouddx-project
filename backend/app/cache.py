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


# ============================================
# Rate Limiting 헬퍼 함수
# ============================================


async def rate_limit_increment(key: str, window_seconds: int = 60) -> int | None:
    """
    Rate Limit 카운터 증가

    Args:
        key: Rate limit 키 (예: "ratelimit:login:192.168.1.1")
        window_seconds: 시간 윈도우 (초)

    Returns:
        현재 카운트 또는 None (Redis 미연결 시)
    """
    if redis_client is None:
        return None
    try:
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        results = await pipe.execute()
        return results[0]
    except Exception as e:
        print(f"⚠️ Redis INCR 실패: {e}")
        return None


async def rate_limit_get(key: str) -> int | None:
    """현재 Rate Limit 카운트 조회"""
    if redis_client is None:
        return None
    try:
        count = await redis_client.get(key)
        return int(count) if count else 0
    except Exception as e:
        print(f"⚠️ Redis GET 실패: {e}")
        return None


async def rate_limit_reset(key: str):
    """Rate Limit 카운터 초기화"""
    await cache_delete(key)


# ============================================
# 토큰 블랙리스트 헬퍼 함수
# ============================================


async def blacklist_token(token: str, expire_seconds: int = 1800):
    """
    토큰을 블랙리스트에 추가

    Args:
        token: JWT 토큰
        expire_seconds: 블랙리스트 유지 시간 (기본: 30분)
    """
    if redis_client is None:
        return
    try:
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()[:32]
        key = f"blacklist:{token_hash}"
        await redis_client.setex(key, expire_seconds, "1")
    except Exception as e:
        print(f"⚠️ Redis 블랙리스트 추가 실패: {e}")


async def is_token_blacklisted(token: str) -> bool:
    """
    토큰이 블랙리스트에 있는지 확인

    Returns:
        True: 블랙리스트에 있음 (사용 불가)
        False: 블랙리스트에 없음 또는 Redis 미연결
    """
    if redis_client is None:
        return False
    try:
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()[:32]
        key = f"blacklist:{token_hash}"
        result = await redis_client.get(key)
        return result is not None
    except Exception as e:
        print(f"⚠️ Redis 블랙리스트 조회 실패: {e}")
        return False


# ============================================
# 포트폴리오 캐시 헬퍼 함수
# ============================================

PORTFOLIO_CACHE_TTL = 60  # 1분


async def cache_portfolio(user_id: str, portfolio_data: dict):
    """
    사용자 포트폴리오 캐싱

    Args:
        user_id: 사용자 ID
        portfolio_data: 포트폴리오 데이터 (JSON serializable)
    """
    if redis_client is None:
        return
    try:
        import json
        key = f"portfolio:{user_id}"
        await redis_client.setex(key, PORTFOLIO_CACHE_TTL, json.dumps(portfolio_data, default=str))
    except Exception as e:
        print(f"⚠️ 포트폴리오 캐시 저장 실패: {e}")


async def get_cached_portfolio(user_id: str) -> dict | None:
    """
    캐시된 포트폴리오 조회

    Returns:
        포트폴리오 데이터 또는 None (캐시 미스)
    """
    if redis_client is None:
        return None
    try:
        import json
        key = f"portfolio:{user_id}"
        cached = await redis_client.get(key)
        if cached:
            return json.loads(cached)
    except Exception as e:
        print(f"⚠️ 포트폴리오 캐시 조회 실패: {e}")
    return None


async def invalidate_portfolio_cache(user_id: str):
    """
    포트폴리오 캐시 무효화

    자산 변경 시 호출하여 캐시를 삭제합니다.
    """
    await cache_delete(f"portfolio:{user_id}")
