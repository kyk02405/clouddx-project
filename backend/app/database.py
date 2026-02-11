"""
============================================
MongoDB ?곗씠?곕쿋?댁뒪 ?곌껐
============================================

Motor 鍮꾨룞湲??쒕씪?대쾭瑜??ъ슜??MongoDB ?곌껐 愿由ъ엯?덈떎.

?댁쁺 ?섍꼍:
- Primary (Write): Node2
- Secondary (Read): Node3
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import get_settings

settings = get_settings()

# MongoDB ?대씪?댁뼵??(???쒖옉 ??珥덇린??
client: AsyncIOMotorClient = None
database: AsyncIOMotorDatabase = None


async def connect_to_mongodb():
    """MongoDB 연결 초기화"""
    global client, database

    try:
        # DB가 없더라도 서버 부팅은 가능하게 짧은 timeout 적용
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
        await client.admin.command("ping")
        database = client[settings.MONGODB_DB_NAME]
        print(f"SUCCESS: Connected to MongoDB: {settings.MONGODB_URL}")
    except Exception as e:
        print(f"WARNING: MongoDB connection failed: {e}")
        database = None


async def close_mongodb_connection():
    """MongoDB ?곌껐 醫낅즺"""
    global client

    if client:
        client.close()
        print("MongoDB ?곌껐 醫낅즺")


def get_database() -> AsyncIOMotorDatabase:
    """?곗씠?곕쿋?댁뒪 ?몄뒪?댁뒪 諛섑솚 (FastAPI ?섏〈??二쇱엯??"""
    return database


# ============================================
# 而щ젆???묎렐 ?ы띁
# ============================================


def get_assets_collection():
    """assets 而щ젆??諛섑솚"""
    return database["assets"]


def get_portfolios_collection():
    """portfolios 而щ젆??諛섑솚"""
    return database["portfolios"]


def get_news_collection():
    """news 而щ젆??諛섑솚"""
    return database["news"]


def get_users_collection():
    """users 컬렉션 반환 (DEPRECATED: auth.py MariaDB 전환 후 제거 예정)"""
    return database["users"]


def get_db():
    """database 인스턴스 반환 (get_database 별칭)"""
    return database

