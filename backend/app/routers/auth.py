"""
============================================
인증 API 라우터
============================================

사용자 인증(로그인/회원가입/토큰 관리) API입니다.

운영 환경에서는 Auth Service로 분리 배포됩니다.
- Node1에서 독립 컨테이너로 실행
- Redis Master(Node2)에 세션 저장
- MongoDB Primary(Node2)에 사용자 정보 저장
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

from ..config import get_settings
from ..database import get_users_collection
from ..cache import cache_set, cache_get

router = APIRouter()
settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================
# 요청/응답 모델
# ============================================

class UserCreate(BaseModel):
    """회원가입 요청"""
    email: EmailStr
    password: str
    nickname: str
    marketing_opt_in: bool = False


class UserLogin(BaseModel):
    """로그인 요청"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """토큰 응답"""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """사용자 정보 응답"""
    id: str
    email: str
    nickname: str
    created_at: datetime


# ============================================
# 헬퍼 함수
# ============================================

def create_access_token(data: dict) -> str:
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """비밀번호 해싱"""
    return pwd_context.hash(password)


# ============================================
# API 엔드포인트
# ============================================

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    """
    회원가입
    
    - 이메일 중복 확인
    - 비밀번호 해싱 후 MongoDB에 저장
    """
    users = get_users_collection()
    
    # 이메일 중복 확인
    existing = await users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다")
    
    # 사용자 생성
    user_doc = {
        "email": user.email,
        "password": hash_password(user.password),
        "nickname": user.nickname,
        "marketing_opt_in": user.marketing_opt_in,
        "created_at": datetime.utcnow()
    }
    result = await users.insert_one(user_doc)
    
    return UserResponse(
        id=str(result.inserted_id),
        email=user.email,
        nickname=user.nickname,
        created_at=user_doc["created_at"]
    )


@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    """
    로그인
    
    - 이메일/비밀번호 검증
    - JWT 토큰 발급
    - Redis에 세션 캐싱
    """
    users = get_users_collection()
    
    # 사용자 조회
    user_doc = await users.find_one({"email": user.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")
    
    # 비밀번호 검증
    if not verify_password(user.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")
    
    # 토큰 생성
    token = create_access_token({"sub": str(user_doc["_id"]), "email": user.email})
    
    # Redis에 세션 저장 (30분)
    await cache_set(f"session:{user_doc['_id']}", token, expire_seconds=1800)
    
    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_current_user():
    """
    현재 로그인한 사용자 정보 조회
    
    TODO: JWT 토큰 검증 미들웨어 추가
    """
    # 임시: 하드코딩된 응답
    return UserResponse(
        id="temp",
        email="test@example.com",
        nickname="테스트",
        created_at=datetime.utcnow()
    )
