"""
============================================
MongoDB 데이터베이스 연결
============================================

Motor 비동기 드라이버를 사용한 MongoDB 연결 관리입니다.

운영 환경:
- Primary (Write): Node2
- Secondary (Read): Node3
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import get_settings

settings = get_settings()

# MongoDB 클라이언트 (앱 시작 시 초기화)
client: AsyncIOMotorClient = None
database: AsyncIOMotorDatabase = None


async def connect_to_mongodb():
    """MongoDB 연결 초기화"""
    global client, database
    
    # timeout을 짧게 설정하여 DB가 없어도 서버가 빨리 뜨도록 함
    client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
    database = client[settings.MONGODB_DB_NAME]
    
    # 연결 테스트
    try:
        # ping timeout도 짧게 설정
        await client.admin.command('ping')
        print(f"✅ MongoDB 연결 성공: {settings.MONGODB_URL}")
    except Exception as e:
        print(f"⚠️ MongoDB 연결 실패 (무시하고 시작): {e}")
        # raise  # Bypassing for API key verification


async def close_mongodb_connection():
    """MongoDB 연결 종료"""
    global client
    
    if client:
        client.close()
        print("MongoDB 연결 종료")


def get_database() -> AsyncIOMotorDatabase:
    """데이터베이스 인스턴스 반환 (FastAPI 의존성 주입용)"""
    return database


# ============================================
# 컬렉션 접근 헬퍼
# ============================================

def get_users_collection():
    """users 컬렉션 반환"""
    return database["users"]


def get_assets_collection():
    """assets 컬렉션 반환"""
    return database["assets"]


def get_portfolios_collection():
    """portfolios 컬렉션 반환"""
    return database["portfolios"]


def get_news_collection():
    """news 컬렉션 반환"""
    return database["news"]
