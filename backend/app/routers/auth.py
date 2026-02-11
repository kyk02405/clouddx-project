"""
============================================
인증 API 라우터
============================================

사용자 인증(로그인/회원가입/토큰 관리) 및 OAuth 2.0 소셜 로그인 API입니다.

운영 환경에서는 Auth Service로 분리 배포됩니다.
- Node1에서 독립 컨테이너로 실행
- Redis Master(Node2)에 세션 저장
- MariaDB(Node2)에 사용자 정보 저장
"""

from fastapi import APIRouter, HTTPException, Depends, status, Response
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt  # passlib 대신 bcrypt 직접 사용 (Python 3.13 호환)
import httpx

from ..config import get_settings
from ..mariadb import (
    get_user_by_email,
    get_user_by_id,
    create_user as mariadb_create_user,
    update_user,
)

# Redis 캐시는 선택 사항으로 처리 (운영 환경에서만 필수)
try:
    from ..cache import cache_set, cache_get, cache_delete

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
    login_type: str  # email, google, kakao, naver
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


def _user_to_response(user) -> UserResponse:
    """MariaDB User ORM 객체를 UserResponse로 변환"""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        nickname=user.nickname,
        marketing_opt_in=user.marketing_opt_in,
        login_type=user.login_type,
        created_at=user.created_at,
    )


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    """
    현재 로그인한 사용자 정보 조회 및 JWT 검증
    - MariaDB에서 사용자 조회
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # MariaDB에서 사용자 조회 (user_id는 정수)
    try:
        user = await get_user_by_id(int(user_id_str))
    except (ValueError, TypeError):
        # 기존 MongoDB ObjectId 형식 토큰 → 재로그인 유도
        raise credentials_exception

    if user is None:
        raise credentials_exception

    return _user_to_response(user)


# ============================================
# API 엔드포인트
# ============================================


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    """
    이메일 회원가입

    - 이메일 중복 확인
    - 비밀번호 해싱 후 MariaDB에 저장
    """
    # 이메일 중복 확인
    existing = await get_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다")

    # MariaDB에 사용자 생성
    new_user = await mariadb_create_user(
        email=user.email,
        password=hash_password(user.password),
        nickname=user.nickname,
        marketing_opt_in=user.marketing_opt_in,
        login_type="email",
    )

    return _user_to_response(new_user)


@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    """
    이메일 로그인

    - 이메일/비밀번호 검증
    - JWT 토큰 발급
    - Redis에 세션 캐싱 (단말기 중복 로그인 제어 등 확장성 고려)
    """
    # MariaDB에서 사용자 조회
    user_doc = await get_user_by_email(user.email, login_type="email")
    if not user_doc:
        raise HTTPException(
            status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다"
        )

    # 비밀번호 검증
    if not user_doc.password or not verify_password(user.password, user_doc.password):
        raise HTTPException(
            status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다"
        )

    # 토큰 생성
    user_id = str(user_doc.id)
    token = create_access_token({"sub": user_id, "email": user_doc.email})

    # Redis에 세션 저장 (선택 사항 - Redis가 없어도 로그인은 작동)
    if cache_set:
        try:
            await cache_set(
                f"session:{user_id}",
                token,
                expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            )
        except Exception as e:
            print(f"WARNING: Redis session save failed: {e}")

    return Token(access_token=token, user_id=user_id, nickname=user_doc.nickname)


# ============================================
# OAuth 2.0 공통 헬퍼
# ============================================


async def _oauth_find_or_create(email: str, nickname: str, login_type: str) -> str:
    """OAuth 로그인 공통: MariaDB에서 사용자 찾거나 생성, user_id 문자열 반환"""
    user = await get_user_by_email(email)

    if not user:
        # 신규 가입
        user = await mariadb_create_user(
            email=email,
            password=None,
            nickname=nickname,
            marketing_opt_in=False,
            login_type=login_type,
        )
    else:
        # 기존 회원 - login_type 업데이트 및 updated_at 갱신
        await update_user(user.id, login_type=login_type, updated_at=datetime.utcnow())

    return str(user.id)


async def _oauth_issue_token_and_redirect(user_id: str, email: str) -> RedirectResponse:
    """OAuth 공통: JWT 발급 + 프론트엔드 리다이렉트"""
    app_token = create_access_token({"sub": user_id, "email": email})

    if cache_set:
        try:
            await cache_set(
                f"session:{user_id}",
                app_token,
                expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            )
        except Exception:
            pass

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    response = RedirectResponse(
        url=f"{frontend_url}/auth/callback?token={app_token}"
    )
    response.set_cookie(key="auth_token", value=app_token, path="/", samesite="lax")
    return response


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
    """Google 로그인 콜백 처리"""
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

    # 3. MariaDB에서 회원 찾거나 생성
    email = user_info.get("email")
    nickname = user_info.get("name", "Google User")
    user_id = await _oauth_find_or_create(email, nickname, "google")

    # 4. JWT 발급 + 리다이렉트
    return await _oauth_issue_token_and_redirect(user_id, email)


# ============================================
# OAuth 2.0 (Kakao)
# ============================================


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

    # 3. MariaDB에서 회원 찾거나 생성
    kakao_account = user_info.get("kakao_account", {})
    email = kakao_account.get("email")
    properties = user_info.get("properties", {})
    nickname = properties.get("nickname", "Kakao User")

    if not email:
        email = f"kakao_{user_info.get('id')}@kakao.com"

    user_id = await _oauth_find_or_create(email, nickname, "kakao")

    # 4. JWT 발급 + 리다이렉트
    return await _oauth_issue_token_and_redirect(user_id, email)


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

    # 3. MariaDB에서 회원 찾거나 생성
    naver_response = user_info.get("response", {})
    email = naver_response.get("email")
    nickname = naver_response.get("nickname", "Naver User")

    if not email:
        raise HTTPException(
            status_code=400, detail="Naver에서 이메일 정보를 가져올 수 없습니다."
        )

    user_id = await _oauth_find_or_create(email, nickname, "naver")

    # 4. JWT 발급 + 리다이렉트
    return await _oauth_issue_token_and_redirect(user_id, email)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """현재 로그인한 사용자 정보 반환"""
    return current_user


@router.post("/logout")
async def logout(response: Response):
    """로그아웃 처리 (쿠키 삭제)"""
    response.delete_cookie(key="auth_token", path="/", samesite="lax")
    return {"message": "Successfully logged out"}
