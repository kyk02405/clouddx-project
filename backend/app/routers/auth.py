"""
============================================
인증 API 라우터
============================================

사용자 인증(로그인/회원가입/토큰 관리) 및 OAuth 2.0 소셜 로그인 API입니다.

운영 환경에서는 Auth Service로 분리 배포됩니다.
- Node1에서 독립 컨테이너로 실행
- Redis Master(Node2)에 세션 저장
- MongoDB Primary(Node2)에 사용자 정보 저장
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt  # passlib 대신 bcrypt 직접 사용 (Python 3.13 호환)
from typing import Optional
import httpx

from ..config import get_settings
from ..database import get_users_collection

# Redis 캐시는 선택 사항으로 처리 (운영 환경에서만 필수)
try:
    from ..cache import cache_set, cache_get, cache_delete
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    cache_set = cache_get = cache_delete = None

router = APIRouter()
settings = get_settings()


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
    user_id: str
    nickname: str


class UserResponse(BaseModel):
    """사용자 정보 응답"""
    id: str
    email: str
    nickname: str
    marketing_opt_in: bool
    login_type: str  # email, google, kakao
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
    """비밀번호 검증 (bcrypt 직접 사용)"""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def hash_password(password: str) -> str:
    """비밀번호 해싱 (bcrypt 직접 사용)"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


# ============================================
# API 엔드포인트
# ============================================

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    """
    이메일 회원가입
    
    - 이메일 중복 확인
    - 비밀번호 해싱 후 MongoDB에 저장
    """
    users = get_users_collection()
    
    # 이메일 중복 확인
    existing = await users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다")
    
    # 사용자 생성
    now = datetime.utcnow()
    user_doc = {
        "email": user.email,
        "password": hash_password(user.password),
        "nickname": user.nickname,
        "marketing_opt_in": user.marketing_opt_in,
        "login_type": "email",
        "created_at": now,
        "updated_at": now
    }
    result = await users.insert_one(user_doc)
    
    return UserResponse(
        id=str(result.inserted_id),
        email=user.email,
        nickname=user.nickname,
        marketing_opt_in=user.marketing_opt_in,
        login_type="email",
        created_at=now
    )


@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    """
    이메일 로그인
    
    - 이메일/비밀번호 검증
    - JWT 토큰 발급
    - Redis에 세션 캐싱 (단말기 중복 로그인 제어 등 확장성 고려)
    """
    users = get_users_collection()
    
    # 사용자 조회
    user_doc = await users.find_one({"email": user.email, "login_type": "email"})
    if not user_doc:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")
    
    # 비밀번호 검증
    if not verify_password(user.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")
    
    # 토큰 생성
    user_id = str(user_doc["_id"])
    token = create_access_token({"sub": user_id, "email": user.email})
    
    # Redis에 세션 저장 (선택 사항 - Redis가 없어도 로그인은 작동)
    if cache_set:
        try:
            await cache_set(f"session:{user_id}", token, expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
        except Exception as e:
            print(f"⚠️ Redis 세션 저장 실패 (무시됨): {e}")
    
    return Token(
        access_token=token,
        user_id=user_id,
        nickname=user_doc["nickname"]
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = Depends(lambda x: x)): 
    # TODO: 실제 구현 시에는 Bearer Token Header에서 추출하는 의존성 주입 사용 필요
    # 현재는 간소화를 위해 토큰 파싱 로직만 포함
    """
    현재 로그인한 사용자 정보 조회 (WIP)
    """
    # 임시: 더미 응답
    return UserResponse(
        id="temp_id",
        email="user@example.com",
        nickname="User",
        marketing_opt_in=True,
        login_type="email",
        created_at=datetime.utcnow()
    )


# ============================================
# OAuth 2.0 (Google)
# ============================================

@router.get("/google/login")
async def google_login():
    """Google 로그인 페이지로 리다이렉트"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Client ID가 설정되지 않았습니다.")
        
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&scope=openid email profile"
        f"&access_type=offline"
    )
    return RedirectResponse(google_auth_url)


@router.get("/google/callback")
async def google_callback(code: str):
    """Google 로그인 콜백 처리과정"""
    # 1. Access Token 요청
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
    }
    
    async with httpx.AsyncClient() as client:
        token_res = await client.post(token_url, data=data)
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Google 로그인 실패 (Token)")
        token_json = token_res.json()
        access_token = token_json.get("access_token")

        # 2. 사용자 정보 요청
        user_info_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Google 로그인 실패 (UserInfo)")
        user_info = user_info_res.json()

    # 3. 회원가입 또는 로그인 처리
    email = user_info.get("email")
    nickname = user_info.get("name", "Google User")
    
    users = get_users_collection()
    user_doc = await users.find_one({"email": email})
    
    now = datetime.utcnow()
    
    if not user_doc:
        # 신규 가입
        user_doc = {
            "email": email,
            "password": "",  # 소셜 로그인은 비밀번호 없음
            "nickname": nickname,
            "marketing_opt_in": False, # 기본값
            "login_type": "google",
            "created_at": now,
            "updated_at": now
        }
        result = await users.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        # 기존 회원인 경우 업데이트
        user_id = str(user_doc["_id"])
        # 로그인 타입이 다르면 업데이트 (이메일 연동 등은 추후 고려)
        if user_doc.get("login_type") != "google":
             await users.update_one({"_id": user_doc["_id"]}, {"$set": {"login_type": "google", "updated_at": now}})

    # 4. JWT 토큰 발급
    app_token = create_access_token({"sub": user_id, "email": email})
    await cache_set(f"session:{user_id}", app_token, expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    
    # 5. 프론트엔드로 리다이렉트 (토큰 포함)
    # 실제 운영 시에는 토큰을 URL에 노출하지 않고 쿠키나 임시 코드를 사용하는 것이 안전함
    return RedirectResponse(url=f"http://localhost:3000/auth/callback?token={app_token}")


@router.get("/kakao/login")
async def kakao_login():
    """Kakao 로그인 페이지로 리다이렉트 (Placeholder)"""
    # TODO: Kakao 구현
    return {"message": "Kakao login logic implementation required"}

