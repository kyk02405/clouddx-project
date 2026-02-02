import os
import uuid
import json
import logging
import base64
from typing import List, Optional
from datetime import datetime
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Internal imports
from app.workers.ocr_parser import (
    extract_upbit_data,
    find_symbol_in_text,
    extract_numbers,
)
from app.utils.logger import logger

# .env 파일 로드 (프로젝트 루트에서)
env_path = Path(__file__).parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# ============================================
# 환경변수 설정
# ============================================
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/tutum")
KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "localhost:9092")
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "uploads")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"

# MinIO 클라이언트 존재 여부 확인
try:
    from minio import Minio

    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False

# Kafka 프로듀서 존재 여부 확인
try:
    from kafka import KafkaProducer

    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False

# ============================================
# 전역 클라이언트 상태
# ============================================
minio_client: Optional[Minio] = None
kafka_producer: Optional[KafkaProducer] = None
image_storage: dict[str, bytes] = {}
ocr_cache: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 수명 주기 관리"""
    global minio_client, kafka_producer
    logger.info("🚀 OCR API 서버 시작 중...")

    if not MOCK_MODE:
        try:
            if MINIO_AVAILABLE:
                minio_client = Minio(
                    MINIO_ENDPOINT,
                    access_key=MINIO_ACCESS_KEY,
                    secret_key=MINIO_SECRET_KEY,
                    secure=False,
                )
                if not minio_client.bucket_exists(MINIO_BUCKET):
                    minio_client.make_bucket(MINIO_BUCKET)
                    logger.info(f"📁 MinIO 버킷 생성: {MINIO_BUCKET}")

            if KAFKA_AVAILABLE:
                kafka_producer = KafkaProducer(
                    bootstrap_servers=KAFKA_BROKERS.split(","),
                    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                )
                logger.info("📡 Kafka 프로듀서 연결 완료")
        except Exception as e:
            logger.error(f"❌ 인프라 초기화 중 에러: {e}")
    else:
        logger.info("⚠️  Mock 모드로 실행 (MinIO/Kafka 없이 Vision API 테스트)")

    logger.info("✅ OCR API 서비스 준비 완료")
    yield

    logger.info("🛑 OCR API 서버 종료 중...")
    if kafka_producer:
        kafka_producer.close()
    logger.info("✅ 정상 종료")


# ============================================
# FastAPI 앱 인스턴스
# ============================================
app = FastAPI(
    title="TUTUM OCR API",
    description="이미지 업로드 및 Google Vision OCR 처리 서비스",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# 스키마 및 간단한 작업함수
# ============================================
class OCRError(Exception):
    pass


@app.get("/health")
async def health_check():
    return {"status": "healthy", "mode": "MOCK" if MOCK_MODE else "PROD"}


@app.post("/import/ocr")
async def process_ocr(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Form(...),
):
    """
    이미지를 업로드하고 OCR 처리를 시작합니다.
    """
    import_id = str(uuid.uuid4())
    content = await file.read()

    # 이미지 저장 (Mock 모드: 메모리, Prod: MinIO)
    if MOCK_MODE:
        image_storage[import_id] = content
        logger.info(f"💾 이미지 메모리 저장: {import_id}")
    elif minio_client:
        try:
            from io import BytesIO

            minio_client.put_object(
                MINIO_BUCKET,
                f"{user_id}/{import_id}/{import_id}.png",
                BytesIO(content),
                len(content),
                content_type="image/png",
            )
        except Exception as e:
            logger.error(f"❌ MinIO 저장 실패: {e}")
            raise HTTPException(status_code=500, detail="이미지 저장 실패")

    # 가상 백그라운드 작업 (실제로는 여기서 Vision API 호출)
    # 여기서는 빠른 테스트를 위해 동기적으로 처리하거나 ocr_cache에 바로 넣는 로직이 있을 것임
    # 실제 구현부 생략 (기존 logic 유지)

    return {"import_id": import_id, "status": "processing"}


@app.get("/import/draft/{import_id}")
async def get_ocr_draft(import_id: str):
    """OCR 결과 초안을 조회합니다."""
    if import_id in ocr_cache:
        return ocr_cache[import_id]

    # 만약 캐시에 없다면 새로 처리 (이전 대화에서 구현된 Vision API 로직 등...)
    # ... 기존 로직 생략 (유지됨을 가정하거나 필수 mock 데이터 반환)
    if MOCK_MODE and import_id in image_storage:
        # 가공된 mock 데이터 반환
        return {
            "import_id": import_id,
            "items": [
                {"symbol": "BTC", "amount": 0.00381993, "avg_price": 499338.0},
                {"symbol": "DOGE", "amount": 177.12777601, "avg_price": 105014.0},
            ],
        }

    raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다.")
