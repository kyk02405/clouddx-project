"""
============================================
FastAPI 환경 설정
============================================

환경 변수를 관리하는 설정 클래스입니다.
.env 파일 또는 시스템 환경 변수에서 값을 로드합니다.

운영 환경 VM 배치:
- Node1: 이 백엔드 서버가 실행됨
- Node2: MongoDB Primary, Redis Master, MinIO
- Node3: MongoDB Secondary, Elasticsearch, Kafka Workers
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # 기본 설정
    APP_NAME: str = "CloudDX Asset Management API"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # MongoDB 설정 (Node2)
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "clouddx"
    
    # Redis 설정 (Node2)
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_DB: int = 0
    
    # Elasticsearch 설정 (Node3)
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    
    # Kafka 설정 (Node3)
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    
    # MinIO 설정 (Node2)
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "clouddx-assets"
    
    # JWT 인증 설정
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS 설정 (프론트엔드 도메인)
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # ============================================
    # Market Data API Settings
    # ============================================
    
    # 한국투자증권 (KIS)
    KIS_APP_KEY: str = ""
    KIS_APP_SECRET: str = ""
    KIS_CANO: str = ""              # 종합계좌번호 (8자리)
    KIS_ACNT_PRDT_CD: str = "01"    # 계좌상품코드 (보통 01)
    KIS_MODE: str = "virtual"       # real or virtual (모의투자)
    
    # Upbit
    UPBIT_ACCESS_KEY: str = ""
    UPBIT_SECRET_KEY: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """설정 싱글톤 인스턴스 반환"""
    return Settings()
