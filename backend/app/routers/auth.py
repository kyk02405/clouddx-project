"""
============================================
??? API ?????
============================================

????????(??????????????? ???? ??OAuth 2.0 ??? ?????API?????

??? ????????Auth Service????? ????????
- Node1??? ??? ???????????
- Redis Master(Node2)????? ????
- MariaDB(??? ???)?????????? ????
"""

from fastapi import APIRouter, HTTPException, Depends, status, Response, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt  # passlib ????bcrypt ??? ??? (Python 3.13 ???)
import httpx
import time
import hashlib

from ..config import get_settings
from ..mariadb import get_user_by_email as db_get_user_by_email, create_user as db_create_user, update_user as db_update_user, get_user_by_id as db_get_user_by_id
from ..middleware.rate_limit import check_rate_limit

# Redis ???????? ?????? ??? (??? ???????????)
try:
    from ..cache import cache_set, cache_get, cache_delete, blacklist_token, is_token_blacklisted

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    cache_set = cache_get = cache_delete = blacklist_token = is_token_blacklisted = None

router = APIRouter()
settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")
FRONTEND_AUTH_CALLBACK_URL = f"{settings.FRONTEND_URL.rstrip('/')}/auth/callback"

# Redis ??? ????? ???? ?? ??? ???? ?? ???? ?? ?????
# key: sha256(token)[:32], value: epoch seconds(exp)
LOCAL_TOKEN_BLACKLIST: dict[str, int] = {}


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()[:32]


def _blacklist_local_token(token: str, expire_seconds: int) -> None:
    LOCAL_TOKEN_BLACKLIST[_token_hash(token)] = int(time.time()) + max(0, expire_seconds)


def _is_local_token_blacklisted(token: str) -> bool:
    now = int(time.time())
    token_key = _token_hash(token)
    expired_keys = [k for k, exp in LOCAL_TOKEN_BLACKLIST.items() if exp <= now]
    for key in expired_keys:
        LOCAL_TOKEN_BLACKLIST.pop(key, None)
    exp = LOCAL_TOKEN_BLACKLIST.get(token_key)
    return exp is not None and exp > now



# ============================================
# ???/??? ???
# ============================================


class UserCreate(BaseModel):
    """??????????"""

    email: EmailStr
    password: str
    nickname: str
    marketing_opt_in: bool = False


class UserLogin(BaseModel):
    """????????"""

    email: EmailStr
    password: str


class Token(BaseModel):
    """??? ???"""

    access_token: str
    token_type: str = "bearer"
    user_id: str
    nickname: str


class UserResponse(BaseModel):
    """???????? ???"""

    id: str
    email: str
    nickname: str
    marketing_opt_in: bool
    login_type: str  # email, google, kakao
    created_at: datetime


# ============================================
# ??? ???
# ============================================


def create_access_token(data: dict) -> str:
    """JWT ???????? ???"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """?????? ????(bcrypt ??? ???)"""
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def hash_password(password: str) -> str:
    """?????? ??? (bcrypt ??? ???)"""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    """
    ??? ?????? ???????? ??? ??JWT ????
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="??? ????? ?????? ??????",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # ??????????? (??????????? ???)
    try:
        # 1) Redis ?????(?? ?)
        if is_token_blacklisted and await is_token_blacklisted(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="??? ???????. ?? ???????.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # 2) ?? ?????(fallback)
        if _is_local_token_blacklisted(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="??? ???????. ?? ???????.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[WARNING] ????? ?? ??: {e}")


    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await db_get_user_by_id(int(user_id))

    if user is None:
        raise credentials_exception

    return UserResponse(
        id=str(user.id),
        email=user.email,
        nickname=user.nickname,
        marketing_opt_in=user.marketing_opt_in,
        login_type=user.login_type,
        created_at=user.created_at,
    )


# ============================================
# API ????????
# ============================================


@router.post("/register", response_model=UserResponse)
async def register(request: Request, user: UserCreate):
    """
    ????????????

    - ???????? ???
    - ?????? ??? ??MariaDB??????
    """
    # Rate Limiting (3?????)
    await check_rate_limit(request, "register")

    # ???????? ???
    existing = await db_get_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="??? ??????????????")

    # ????????
    new_user = await db_create_user(
        email=user.email,
        password=hash_password(user.password),
        nickname=user.nickname,
        marketing_opt_in=user.marketing_opt_in,
        login_type="email",
    )

    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        nickname=new_user.nickname,
        marketing_opt_in=new_user.marketing_opt_in,
        login_type=new_user.login_type,
        created_at=new_user.created_at,
    )


@router.post("/login", response_model=Token)
async def login(request: Request, user: UserLogin):
    """
    ??????????

    - ??????????? ????
    - JWT ??? ???
    - Redis????? ??? (???????? ???????? ??????????)
    """
    # Rate Limiting (5??5??
    await check_rate_limit(request, "login")

    # ????????
    user_doc = await db_get_user_by_email(user.email, login_type="email")
    if not user_doc:
        raise HTTPException(
            status_code=401, detail="???????? ???????? ?????? ??????"
        )

    # ?????? ????
    if not user_doc.password or not verify_password(user.password, user_doc.password):
        raise HTTPException(
            status_code=401, detail="???????? ???????? ?????? ??????"
        )

    # ??? ???
    user_id = str(user_doc.id)
    token = create_access_token({"sub": user_id, "email": user.email})

    # Redis????? ????(??? ??? - Redis?? ??????????? ???)
    if cache_set:
        try:
            await cache_set(
                f"session:{user_id}",
                token,
                expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            )
        except Exception as e:
            print(f"[WARNING] Redis ??? ??????? (?????: {e}")

    return Token(access_token=token, user_id=user_id, nickname=user_doc.nickname)


# ============================================
# OAuth 2.0 (Google)
# ============================================


@router.get("/google/login")
async def google_login():
    """Google ????????????????????"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500, detail="Google Client ID?? ?????? ????????"
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
    """Google ???????? ??????"""
    # 1. Access Token ???
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
            raise HTTPException(status_code=400, detail="Google ???????? (Token)")
        token_json = token_res.json()
        access_token = token_json.get("access_token")

        # 2. ???????? ???
        user_info_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Google ???????? (UserInfo)")
        user_info = user_info_res.json()

    # 3. ?????????? ????????
    email = user_info.get("email")
    nickname = user_info.get("name", "Google User")

    user_doc = await db_get_user_by_email(email)

    if not user_doc:
        # ??? ????
        new_user = await db_create_user(
            email=email, password=None, nickname=nickname, login_type="google"
        )
        user_id = str(new_user.id)
    else:
        # ??? ???????? ??????
        user_id = str(user_doc.id)
        if user_doc.login_type != "google":
            await db_update_user(user_doc.id, login_type="google")

    # 4. JWT ??? ???
    app_token = create_access_token({"sub": user_id, "email": email})
    if cache_set:
        await cache_set(
            f"session:{user_id}",
            app_token,
            expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    # 5. ????????? ????????(??? ??? + ??????????? ???)
    response = RedirectResponse(url=f"{FRONTEND_AUTH_CALLBACK_URL}?token={app_token}")
    response.set_cookie(
        key="auth_token", value=app_token, path="/", max_age=86400, samesite="lax"
    )
    return response


@router.get("/kakao/login")
async def kakao_login():
    """Kakao ????????????????????"""
    if not settings.KAKAO_CLIENT_ID:
        raise HTTPException(
            status_code=500, detail="Kakao Client ID?? ?????? ????????"
        )

    kakao_auth_url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?client_id={settings.KAKAO_CLIENT_ID}"
        f"&redirect_uri={settings.KAKAO_REDIRECT_URI}"
        f"&response_type=code"
    )
    return RedirectResponse(kakao_auth_url)


@router.get("/kakao/callback")
async def kakao_callback(code: str):
    """Kakao ???????? ???"""
    # 1. Access Token ???
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
            raise HTTPException(status_code=400, detail="Kakao ???????? (Token)")
        token_json = token_res.json()
        access_token = token_json.get("access_token")

        # 2. ???????? ???
        user_info_res = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Kakao ???????? (UserInfo)")
        user_info = user_info_res.json()

    # 3. ?????????? ????????
    kakao_account = user_info.get("kakao_account", {})
    email = kakao_account.get("email")
    properties = user_info.get("properties", {})
    nickname = properties.get("nickname", "Kakao User")

    if not email:
        # ??????????? ???????? ?????? ??? ????? (??? ???)
        email = f"kakao_{user_info.get('id')}@kakao.com"

    user_doc = await db_get_user_by_email(email)

    if not user_doc:
        # ??? ????
        new_user = await db_create_user(
            email=email, password=None, nickname=nickname, login_type="kakao"
        )
        user_id = str(new_user.id)
    else:
        # ??? ???????? ??????
        user_id = str(user_doc.id)
        if user_doc.login_type != "kakao":
            await db_update_user(user_doc.id, login_type="kakao")

    # 4. JWT ??? ???
    app_token = create_access_token({"sub": user_id, "email": email})
    if cache_set:
        await cache_set(
            f"session:{user_id}",
            app_token,
            expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    # 5. ????????? ????????(??? ??? + ??????????? ???)
    response = RedirectResponse(url=f"{FRONTEND_AUTH_CALLBACK_URL}?token={app_token}")
    response.set_cookie(
        key="auth_token", value=app_token, path="/", max_age=86400, samesite="lax"
    )
    return response


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """??? ?????? ???????? ???"""
    return current_user


# ============================================
# OAuth 2.0 (Naver)
# ============================================


@router.get("/naver/login")
async def naver_login():
    """Naver ????????????????????"""
    if not settings.NAVER_CLIENT_ID:
        raise HTTPException(
            status_code=500, detail="Naver Client ID?? ?????? ????????"
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
    """Naver ???????? ???"""
    # 1. Access Token ???
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
            raise HTTPException(status_code=400, detail="Naver ???????? (Token)")
        token_json = token_res.json()
        access_token = token_json.get("access_token")

        # 2. ???????? ???
        user_info_res = await client.get(
            "https://openapi.naver.com/v1/nid/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Naver ???????? (UserInfo)")
        user_info = user_info_res.json()

    # 3. ?????????? ????????
    naver_response = user_info.get("response", {})
    email = naver_response.get("email")
    nickname = naver_response.get("nickname", "Naver User")

    if not email:
        raise HTTPException(
            status_code=400, detail="Naver??? ??????????????? ????????."
        )

    user_doc = await db_get_user_by_email(email)

    if not user_doc:
        # ??? ????
        new_user = await db_create_user(
            email=email, password=None, nickname=nickname, login_type="naver"
        )
        user_id = str(new_user.id)
    else:
        # ??? ???????? ??????
        user_id = str(user_doc.id)
        if user_doc.login_type != "naver":
            await db_update_user(user_doc.id, login_type="naver")

    # 4. JWT ??? ???
    app_token = create_access_token({"sub": user_id, "email": email})
    if cache_set:
        await cache_set(
            f"session:{user_id}",
            app_token,
            expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    # 5. ????????? ????????(??? ??? + ??????????? ???)
    response = RedirectResponse(url=f"{FRONTEND_AUTH_CALLBACK_URL}?token={app_token}")
    response.set_cookie(
        key="auth_token", value=app_token, path="/", max_age=86400, samesite="lax"
    )
    return response


@router.post("/logout")
async def logout(response: Response, token: str = Depends(oauth2_scheme)):
    """
    ?????? ???
    - ??? ???????????
    - Redis ??? ???
    - ??? ???
    """
    # ?????? user_id?? ?????? ??? (???????)
    user_id = None
    exp = None
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM],
            options={"verify_exp": False}  # ?????????????
        )
        user_id = payload.get("sub")
        exp = payload.get("exp")
    except JWTError:
        pass

    # 1. ??? ???????????
    try:
        # ?? ???? ?? ?? ?? ?? 30?
        if exp:
            remaining = max(0, int(exp - time.time()))
        else:
            remaining = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        # Redis ?????(?? ?)
        if blacklist_token:
            await blacklist_token(token, expire_seconds=remaining)
        # Redis? ???? ?? fallback?? ??
        _blacklist_local_token(token, remaining)
    except Exception as e:
        print(f"[WARNING] ?? ????? ?? ??: {e}")

    # 2. Redis ??? ???
    if cache_delete and user_id:
        try:
            await cache_delete(f"session:{user_id}")
        except Exception as e:
            print(f"[WARNING] Redis ??? ??? ???: {e}")

    # 3. ??? ???
    response.delete_cookie(key="auth_token", path="/", samesite="lax")

    return {"message": "Successfully logged out"}


