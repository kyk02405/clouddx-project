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

from fastapi import APIRouter, HTTPException, Depends, status, Response
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import uuid
import secrets
import hashlib
from jose import jwt, JWTError
import bcrypt  # passlib 대신 bcrypt 직접 사용 (Python 3.13 호환)
import httpx
from bson import ObjectId
import os
from fastapi import UploadFile, File

from app.config import get_settings
from app.database import get_users_collection
from app.cache import get_redis
from app.services.queue_service import get_queue_service
from app.services.email_service import get_email_service

# Redis 캐시는 선택 사항으로 처리 (운영 환경에서만 필수)
try:
    from app.cache import cache_set, cache_get, cache_delete

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    cache_set = cache_get = cache_delete = None

router = APIRouter()
settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


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


class ProfileUpdate(BaseModel):
    """프로필 업데이트 요청"""

    nickname: Optional[str] = None
    marketing_opt_in: Optional[bool] = None


class PasswordUpdate(BaseModel):
    """비밀번호 변경 요청"""

    old_password: str
    new_password: str


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
    profile_image: Optional[str] = None
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
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def hash_password(password: str) -> str:
    """비밀번호 해싱 (bcrypt 직접 사용)"""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def generate_verification_token() -> str:
    """
    Generate secure random verification token (URL-safe).

    Returns 32-byte URL-safe token string.
    """
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """
    Hash verification token using SHA-256.

    Tokens are stored hashed in database for security.
    """
    return hashlib.sha256(token.encode()).hexdigest()


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    """
    현재 로그인한 사용자 정보 조회 및 JWT 검증
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    # 블랙리스트 확인 (NEW)
    if cache_get:
        is_blacklisted = await cache_get(f"blacklist:{token}")
        if is_blacklisted:
            raise credentials_exception

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    users = get_users_collection()
    user_doc = await users.find_one({"_id": ObjectId(user_id)})

    if user_doc is None:
        raise credentials_exception

    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        nickname=user_doc["nickname"],
        marketing_opt_in=user_doc.get("marketing_opt_in", False),
        login_type=user_doc.get("login_type", "email"),
        profile_image=user_doc.get("profile_image"),
        created_at=user_doc["created_at"],
    )


# ============================================
# API 엔드포인트
# ============================================


@router.post("/register")
async def register(user: UserCreate):
    """
    이메일 회원가입 + 이메일 인증

    - 이메일 중복 확인
    - 비밀번호 해싱 후 MongoDB에 저장
    - 이메일 인증 토큰 생성 및 SQS enqueue
    - 사용자는 이메일 인증 전까지 is_verified=False
    """
    users = get_users_collection()

    # 이메일 중복 확인
    existing = await users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다")

    # 사용자 생성 (is_verified=False)
    now = datetime.utcnow()
    user_doc = {
        "email": user.email,
        "password": hash_password(user.password),
        "nickname": user.nickname,
        "marketing_opt_in": user.marketing_opt_in,
        "login_type": "email",
        "is_verified": False,  # 이메일 인증 전까지 False
        "created_at": now,
        "updated_at": now,
    }
    result = await users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # 이메일 인증 토큰 생성
    verification_token = generate_verification_token()
    token_hash = hash_token(verification_token)

    # MongoDB에 토큰 저장 (email_verification_tokens 컬렉션)
    from app.database import get_database

    db = get_database()
    tokens_collection = db["email_verification_tokens"]

    expires_at = datetime.utcnow() + timedelta(
        minutes=settings.VERIFICATION_TOKEN_EXPIRE_MINUTES
    )
    token_doc = {
        "user_id": user_id,
        "token_hash": token_hash,
        "expires_at": expires_at,
        "used_at": None,
        "created_at": now,
    }
    await tokens_collection.insert_one(token_doc)

    # SQS에 이메일 발송 작업 enqueue
    try:
        queue_service = get_queue_service()
        await queue_service.enqueue_verification_email(
            user_email=user.email,
            verification_token=verification_token,  # Plain token (not hashed)
        )
        print(f"✅ Verification email queued for {user.email}")
    except Exception as e:
        print(f"⚠️  Failed to enqueue verification email: {e}")
        # 사용자 생성은 성공했으므로 에러를 던지지 않고 로그만 남김

    return {
        "message": "회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.",
        "email": user.email,
        "verification_required": True,
    }


@router.post("/check-email")
async def check_email_availability(request: dict):
    """
    이메일 사용 가능 여부 확인 (회원가입 전 중복 체크)

    - 일반 이메일 회원가입 중복 확인
    - 소셜 로그인 계정 중복 확인

    Returns: {"available": bool, "message": str}
    """
    email = request.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="이메일을 입력해주세요")

    users = get_users_collection()

    # 이메일 중복 확인 (모든 login_type)
    existing_user = await users.find_one({"email": email})

    if existing_user:
        login_type = existing_user.get("login_type", "unknown")
        if login_type == "email":
            return {
                "available": False,
                "message": "이미 등록된 이메일입니다. 로그인해주세요.",
            }
        else:
            return {
                "available": False,
                "message": f"{login_type.upper()} 계정으로 이미 가입된 이메일입니다. {login_type.upper()} 로그인을 이용해주세요.",
            }

    return {"available": True, "message": "사용 가능한 이메일입니다."}


@router.get("/verification-status")
async def get_verification_status(email: str):
    """
    이메일 인증 상태 확인 (프론트엔드 polling용)

    - 회원가입 중 인증 완료 여부 확인

    Returns: {"is_verified": bool}
    """
    users = get_users_collection()
    user_doc = await users.find_one({"email": email})

    if not user_doc:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    return {"is_verified": user_doc.get("is_verified", False)}


@router.get("/verify")
async def verify_email(token: str):
    """
    이메일 인증 처리

    - 토큰 검증 (해시 비교, 만료 확인, 사용 여부 확인)
    - 사용자 is_verified = True 업데이트
    - 토큰 used_at 업데이트 (1회성)
    """
    from app.database import get_database

    db = get_database()
    tokens_collection = db["email_verification_tokens"]
    users = get_users_collection()

    # 토큰 해시
    token_hash = hash_token(token)

    # DB에서 토큰 조회
    token_doc = await tokens_collection.find_one({"token_hash": token_hash})

    if not token_doc:
        raise HTTPException(status_code=400, detail="유효하지 않은 인증 링크입니다")

    # 만료 확인
    if token_doc["expires_at"] < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="인증 링크가 만료되었습니다. 새로운 인증 이메일을 요청해주세요",
        )

    # 이미 사용된 토큰 확인 및 멱등성(Idempotency) 처리
    if token_doc["used_at"] is not None:
        # 이미 사용된 토큰일 경우, 해당 사용자가 이미 인증되었는지 확인
        user_id = token_doc["user_id"]
        user_doc = await users.find_one({"_id": ObjectId(user_id)})

        if user_doc and user_doc.get("is_verified"):
            # 이미 인증된 사용자라면 메시지 반환 (중복 호출 대응)
            return {"message": "이미 인증이 완료된 계정입니다.", "status": "success"}

        raise HTTPException(status_code=400, detail="이미 사용된 인증 링크입니다")

    # 사용자 is_verified 업데이트
    user_id = token_doc["user_id"]
    await users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_verified": True, "updated_at": datetime.utcnow()}},
    )

    # 토큰 used_at 업데이트
    await tokens_collection.update_one(
        {"_id": token_doc["_id"]}, {"$set": {"used_at": datetime.utcnow()}}
    )

    # API 호출이므로 메시지 반환 (프론트엔드에서 처리)
    return {"message": "이메일 인증이 완료되었습니다.", "status": "success"}


@router.post("/resend-verification")
async def resend_verification(email: EmailStr):
    """
    이메일 인증 재발송

    - 이미 인증된 사용자는 에러
    - 기존 토큰 무효화
    - 새 토큰 생성 및 SQS enqueue
    """
    from app.database import get_database

    db = get_database()
    tokens_collection = db["email_verification_tokens"]
    users = get_users_collection()

    # 사용자 조회
    user_doc = await users.find_one({"email": email})
    if not user_doc:
        raise HTTPException(status_code=404, detail="등록되지 않은 이메일입니다")

    # 이미 인증된 사용자
    if user_doc.get("is_verified", False):
        raise HTTPException(status_code=400, detail="이미 인증된 계정입니다")

    user_id = str(user_doc["_id"])

    # 기존 토큰 무효화 (used_at 설정)
    await tokens_collection.update_many(
        {"user_id": user_id, "used_at": None}, {"$set": {"used_at": datetime.utcnow()}}
    )

    # 새 토큰 생성
    verification_token = generate_verification_token()
    token_hash = hash_token(verification_token)

    expires_at = datetime.utcnow() + timedelta(
        minutes=settings.VERIFICATION_TOKEN_EXPIRE_MINUTES
    )
    token_doc = {
        "user_id": user_id,
        "token_hash": token_hash,
        "expires_at": expires_at,
        "used_at": None,
        "created_at": datetime.utcnow(),
    }
    await tokens_collection.insert_one(token_doc)

    # SQS에 이메일 발송 작업 enqueue
    try:
        queue_service = get_queue_service()
        await queue_service.enqueue_verification_email(
            user_email=email, verification_token=verification_token
        )
        print(f"✅ Verification email re-queued for {email}")
    except Exception as e:
        print(f"⚠️  Failed to enqueue verification email: {e}")
        raise HTTPException(status_code=500, detail="이메일 발송에 실패했습니다")

    return {
        "message": "인증 이메일이 재발송되었습니다. 이메일을 확인해주세요.",
        "email": email,
    }


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
        raise HTTPException(
            status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다"
        )

    # 비밀번호 검증
    if not verify_password(user.password, user_doc["password"]):
        raise HTTPException(
            status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다"
        )

    # 이메일 인증 확인 (NEW)
    if not user_doc.get("is_verified", False):
        raise HTTPException(
            status_code=403, detail="이메일 인증이 필요합니다. 이메일을 확인해주세요."
        )

    # 토큰 생성
    user_id = str(user_doc["_id"])
    token = create_access_token({"sub": user_id, "email": user.email})

    # Redis에 세션 저장 (선택 사항 - Redis가 없어도 로그인은 작동)
    if cache_set:
        try:
            await cache_set(
                f"session:{user_id}",
                token,
                expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            )
        except Exception as e:
            print(f"⚠️ Redis 세션 저장 실패 (무시됨): {e}")

    return Token(access_token=token, user_id=user_id, nickname=user_doc["nickname"])


# ============================================
# OAuth 2.0 (Google)
# ============================================


@router.get("/google/login")
async def google_login():
    """Google 로그인 페이지로 리다이렉트"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500, detail="Google Client ID가 설정되지 않았습니다."
        )

    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&scope=openid email profile"
        f"&access_type=offline"
        f"&prompt=select_account"
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
            headers={"Authorization": f"Bearer {access_token}"},
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
            "marketing_opt_in": False,  # 기본값
            "login_type": "google",
            "created_at": now,
            "updated_at": now,
        }
        result = await users.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        # 기존 회원인 경우 업데이트
        user_id = str(user_doc["_id"])
        # 로그인 타입이 다르면 업데이트 (이메일 연동 등은 추후 고려)
        if user_doc.get("login_type") != "google":
            await users.update_one(
                {"_id": user_doc["_id"]},
                {"$set": {"login_type": "google", "updated_at": now}},
            )
        else:
            await users.update_one(
                {"_id": user_doc["_id"]}, {"$set": {"updated_at": now}}
            )

    # 4. JWT 토큰 발급
    app_token = create_access_token({"sub": user_id, "email": email})
    if cache_set:
        await cache_set(
            f"session:{user_id}",
            app_token,
            expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    # 5. 프론트엔드로 리다이렉트 (토큰 포함 + 미들웨어용 쿠키 설정)
    response = RedirectResponse(
        url=f"{settings.FRONTEND_URL}/auth/callback?token={app_token}"
    )
    response.set_cookie(key="auth_token", value=app_token, path="/", samesite="lax")
    return response


@router.get("/kakao/login")
async def kakao_login():
    """Kakao 로그인 페이지로 리다이렉트"""
    if not settings.KAKAO_CLIENT_ID:
        raise HTTPException(
            status_code=500, detail="Kakao Client ID가 설정되지 않았습니다."
        )

    kakao_auth_url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?client_id={settings.KAKAO_CLIENT_ID}"
        f"&redirect_uri={settings.KAKAO_REDIRECT_URI}"
        f"&response_type=code"
        f"&prompt=select_account"
    )
    return RedirectResponse(kakao_auth_url)


@router.get("/kakao/callback")
async def kakao_callback(code: str):
    """Kakao 로그인 콜백 처리"""
    # 1. Access Token 요청
    token_url = "https://kauth.kakao.com/oauth/token"
    data = {
        "grant_type": "authorization_code",
        "client_id": settings.KAKAO_CLIENT_ID,
        "client_secret": settings.KAKAO_CLIENT_SECRET,
        "redirect_uri": settings.KAKAO_REDIRECT_URI,
        "code": code,
    }

    async with httpx.AsyncClient() as client:
        token_res = await client.post(token_url, data=data)
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Kakao 로그인 실패 (Token)")
        token_json = token_res.json()
        access_token = token_json.get("access_token")

        # 2. 사용자 정보 요청
        user_info_res = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Kakao 로그인 실패 (UserInfo)")
        user_info = user_info_res.json()

    # 3. 회원가입 또는 로그인 처리
    kakao_account = user_info.get("kakao_account", {})
    email = kakao_account.get("email")
    properties = user_info.get("properties", {})
    nickname = properties.get("nickname", "Kakao User")

    if not email:
        # 카카오 비즈니스 설정에 따라 이메일이 없을 수 있음 (임시 처리)
        email = f"kakao_{user_info.get('id')}@kakao.com"

    users = get_users_collection()
    user_doc = await users.find_one({"email": email})

    now = datetime.utcnow()

    if not user_doc:
        # 신규 가입
        user_doc = {
            "email": email,
            "password": "",  # 소셜 로그인은 비밀번호 없음
            "nickname": nickname,
            "marketing_opt_in": False,
            "login_type": "kakao",
            "created_at": now,
            "updated_at": now,
        }
        result = await users.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        # 기존 회원인 경우 업데이트
        user_id = str(user_doc["_id"])
        if user_doc.get("login_type") != "kakao":
            await users.update_one(
                {"_id": user_doc["_id"]},
                {"$set": {"login_type": "kakao", "updated_at": now}},
            )
        else:
            await users.update_one(
                {"_id": user_doc["_id"]}, {"$set": {"updated_at": now}}
            )

    # 4. JWT 토큰 발급
    app_token = create_access_token({"sub": user_id, "email": email})
    if cache_set:
        await cache_set(
            f"session:{user_id}",
            app_token,
            expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    # 5. 프론트엔드로 리다이렉트 (토큰 포함 + 미들웨어용 쿠키 설정)
    response = RedirectResponse(
        url=f"{settings.FRONTEND_URL}/auth/callback?token={app_token}"
    )
    response.set_cookie(key="auth_token", value=app_token, path="/", samesite="lax")
    return response


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """현재 로그인한 사용자 정보 반환"""
    return current_user


@router.put("/update-profile")
async def update_profile(
    profile: ProfileUpdate, current_user: UserResponse = Depends(get_current_user)
):
    """사용자 프로필 업데이트 (닉네임, 마케팅 동의)"""
    users = get_users_collection()
    update_data = {}
    if profile.nickname is not None:
        update_data["nickname"] = profile.nickname
    if profile.marketing_opt_in is not None:
        update_data["marketing_opt_in"] = profile.marketing_opt_in

    if not update_data:
        return {"message": "변경할 내용이 없습니다."}

    await users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {**update_data, "updated_at": datetime.utcnow()}},
    )
    return {"message": "프로필이 업데이트되었습니다."}


@router.put("/change-password")
async def change_password(
    data: PasswordUpdate, current_user: UserResponse = Depends(get_current_user)
):
    """비밀번호 변경"""
    if current_user.login_type != "email":
        raise HTTPException(
            status_code=400, detail="소셜 로그인 계정은 비밀번호를 변경할 수 없습니다."
        )

    users = get_users_collection()
    user_doc = await users.find_one({"_id": ObjectId(current_user.id)})

    if not verify_password(data.old_password, user_doc["password"]):
        raise HTTPException(
            status_code=401, detail="현재 비밀번호가 일회하지 않습니다."
        )

    await users.update_one(
        {"_id": ObjectId(current_user.id)},
        {
            "$set": {
                "password": hash_password(data.new_password),
                "updated_at": datetime.utcnow(),
            }
        },
    )
    return {"message": "비밀번호가 변경되었습니다."}


@router.post("/upload-profile-image")
async def upload_profile_image(
    file: UploadFile = File(...), current_user: UserResponse = Depends(get_current_user)
):
    """프로필 이미지 업로드 (MinIO)"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")

    from app.services.storage import get_storage_service

    storage = get_storage_service()

    filename = f"profile_{current_user.id}_{uuid.uuid4().hex[:8]}{os.path.splitext(file.filename)[1]}"

    try:
        result = await storage.upload_file(
            file=file.file,
            filename=filename,
            bucket=storage.profile_bucket,
            content_type=file.content_type,
        )

        # 이전 이미지 삭제 로직 (기존 이미지가 있을 경우)
        users = get_users_collection()
        user_doc = await users.find_one({"_id": ObjectId(current_user.id)})
        old_image = user_doc.get("profile_image")
        if old_image and "profile-images" in old_image:
            try:
                # URL에서 파일명 추출 (단순화)
                old_filename = old_image.split("/")[-1].split("?")[0]
                await storage.delete_file(storage.profile_bucket, old_filename)
            except Exception:
                pass

        # DB 업데이트
        await users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"profile_image": result["url"], "updated_at": datetime.utcnow()}},
        )

        return {
            "message": "프로필 이미지가 상공적으로 업로드되었습니다.",
            "url": result["url"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 업로드 실패: {str(e)}")


@router.delete("/profile-image")
async def delete_profile_image(current_user: UserResponse = Depends(get_current_user)):
    """프로필 이미지 삭제"""
    users = get_users_collection()
    user_doc = await users.find_one({"_id": ObjectId(current_user.id)})

    old_image = user_doc.get("profile_image")
    if not old_image:
        return {"message": "삭제할 이미지가 없습니다."}

    if "profile-images" in old_image:
        from app.services.storage import get_storage_service

        storage = get_storage_service()
        try:
            old_filename = old_image.split("/")[-1].split("?")[0]
            await storage.delete_file(storage.profile_bucket, old_filename)
        except Exception:
            pass

    await users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"profile_image": None, "updated_at": datetime.utcnow()}},
    )
    return {"message": "프로필 이미지가 삭제되었습니다."}


# ============================================
# OAuth 2.0 (Naver)
# ============================================


@router.get("/naver/login")
async def naver_login():
    """Naver 로그인 페이지로 리다이렉트"""
    if not settings.NAVER_CLIENT_ID:
        raise HTTPException(
            status_code=500, detail="Naver Client ID가 설정되지 않았습니다."
        )

    import secrets

    state = secrets.token_hex(16)

    naver_auth_url = (
        f"https://nid.naver.com/oauth2.0/authorize"
        f"?response_type=code"
        f"&client_id={settings.NAVER_CLIENT_ID}"
        f"&redirect_uri={settings.NAVER_REDIRECT_URI}"
        f"&state={state}"
        f"&auth_type=reauthenticate"
    )
    return RedirectResponse(naver_auth_url)


@router.get("/naver/callback")
async def naver_callback(code: str, state: str):
    """Naver 로그인 콜백 처리"""
    # 1. Access Token 요청
    token_url = "https://nid.naver.com/oauth2.0/token"
    params = {
        "grant_type": "authorization_code",
        "client_id": settings.NAVER_CLIENT_ID,
        "client_secret": settings.NAVER_CLIENT_SECRET,
        "code": code,
        "state": state,
    }

    async with httpx.AsyncClient() as client:
        token_res = await client.get(token_url, params=params)
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Naver 로그인 실패 (Token)")
        token_json = token_res.json()
        access_token = token_json.get("access_token")

        # 2. 사용자 정보 요청
        user_info_res = await client.get(
            "https://openapi.naver.com/v1/nid/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Naver 로그인 실패 (UserInfo)")
        user_info = user_info_res.json()

    # 3. 회원가입 또는 로그인 처리
    response = user_info.get("response", {})
    email = response.get("email")
    nickname = response.get("nickname", "Naver User")

    if not email:
        raise HTTPException(
            status_code=400, detail="Naver에서 이메일 정보를 가져올 수 없습니다."
        )

    users = get_users_collection()
    user_doc = await users.find_one({"email": email})

    now = datetime.utcnow()

    if not user_doc:
        # 신규 가입
        user_doc = {
            "email": email,
            "password": "",
            "nickname": nickname,
            "marketing_opt_in": False,
            "login_type": "naver",
            "created_at": now,
            "updated_at": now,
        }
        result = await users.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        # 기존 회원인 경우 업데이트
        user_id = str(user_doc["_id"])
        if user_doc.get("login_type") != "naver":
            await users.update_one(
                {"_id": user_doc["_id"]},
                {"$set": {"login_type": "naver", "updated_at": now}},
            )
        else:
            await users.update_one(
                {"_id": user_doc["_id"]}, {"$set": {"updated_at": now}}
            )

    # 4. JWT 토큰 발급
    app_token = create_access_token({"sub": user_id, "email": email})
    if cache_set:
        await cache_set(
            f"session:{user_id}",
            app_token,
            expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    # 5. 프론트엔드로 리다이렉트 (토큰 포함 + 미들웨어용 쿠키 설정)
    response = RedirectResponse(
        url=f"{settings.FRONTEND_URL}/auth/callback?token={app_token}"
    )
    response.set_cookie(key="auth_token", value=app_token, path="/", samesite="lax")
    return response


@router.post("/logout")
async def logout(response: Response, token: str = Depends(oauth2_scheme)):
    """
    로그아웃 처리
    - Redis 토큰 블랙리스트 등록
    - 쿠키 삭제
    """
    # 1. Redis 블랙리스트 등록
    if cache_set:
        try:
            await cache_set(
                f"blacklist:{token}",
                "1",
                expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            )
            print(f"✅ Token blacklisted on logout: {token[:10]}...")
        except Exception as e:
            print(f"⚠️ Redis 블랙리스트 등록 실패: {e}")

    # 2. 쿠키 삭제
    response.delete_cookie(key="auth_token", path="/", samesite="lax")

    return {"message": "로그아웃 되었습니다."}


@router.delete("/me")
async def withdraw_account(current_user: UserResponse = Depends(get_current_user)):
    """
    회원 탈퇴 처리
    - 사용자 정보 삭제 (MongoDB)
    - 관련 인증 토큰 삭제
    - Redis 세션 삭제
    """
    users = get_users_collection()
    from app.database import get_database

    db = get_database()
    tokens_collection = db["email_verification_tokens"]

    # 1. 인증 토큰 삭제
    await tokens_collection.delete_many({"user_id": current_user.id})

    # 2. Redis 세션 삭제
    if cache_delete:
        try:
            await cache_delete(f"session:{current_user.id}")
        except Exception as e:
            print(f"⚠️ Redis 세션 삭제 실패 (무시됨): {e}")

    # 3. 사용자 정보 삭제
    result = await users.delete_one({"_id": ObjectId(current_user.id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    return {"message": "회원 탈퇴가 완료되었습니다."}
