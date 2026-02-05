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

from fastapi import APIRouter, HTTPException, Depends, status, Request, File, UploadFile
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt  # passlib 대신 bcrypt 직접 사용 (Python 3.13 호환)
from typing import Optional
import httpx
import base64
from bson import ObjectId

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
    login_type: str  # email, google, kakao
    profile_image: Optional[str] = None
    created_at: datetime


class UserUpdate(BaseModel):
    """프로필 수정 요청"""
    nickname: Optional[str] = None
    marketing_opt_in: Optional[bool] = None
    profile_image: Optional[str] = None


class PasswordUpdate(BaseModel):
    """비밀번호 변경 요청"""
    old_password: str
    new_password: str


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


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    """
    현재 로그인한 사용자 정보 조회 및 JWT 검증
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
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
        created_at=user_doc["created_at"]
    )


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
        else:
             await users.update_one({"_id": user_doc["_id"]}, {"$set": {"updated_at": now}})

    # 4. JWT 토큰 발급
    app_token = create_access_token({"sub": user_id, "email": email})
    if cache_set:
        await cache_set(f"session:{user_id}", app_token, expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    
    # 5. 프론트엔드로 리다이렉트 (토큰 포함 + 미들웨어용 쿠키 설정)
    response = RedirectResponse(url=f"http://localhost:3000/auth/callback?token={app_token}")
    response.set_cookie(key="auth_token", value=app_token, path="/", max_age=86400, samesite="lax")
    return response


@router.get("/kakao/login")
async def kakao_login():
    """Kakao 로그인 페이지로 리다이렉트"""
    if not settings.KAKAO_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Kakao Client ID가 설정되지 않았습니다.")
        
    kakao_auth_url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?client_id={settings.KAKAO_CLIENT_ID}"
        f"&redirect_uri={settings.KAKAO_REDIRECT_URI}"
        f"&response_type=code"
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
            headers={"Authorization": f"Bearer {access_token}"}
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
            "updated_at": now
        }
        result = await users.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        # 기존 회원인 경우 업데이트
        user_id = str(user_doc["_id"])
        if user_doc.get("login_type") != "kakao":
             await users.update_one({"_id": user_doc["_id"]}, {"$set": {"login_type": "kakao", "updated_at": now}})
        else:
             await users.update_one({"_id": user_doc["_id"]}, {"$set": {"updated_at": now}})

    # 4. JWT 토큰 발급
    app_token = create_access_token({"sub": user_id, "email": email})
    if cache_set:
        await cache_set(f"session:{user_id}", app_token, expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    
    # 5. 프론트엔드로 리다이렉트 (토큰 포함 + 미들웨어용 쿠키 설정)
    response = RedirectResponse(url=f"http://localhost:3000/auth/callback?token={app_token}")
    response.set_cookie(key="auth_token", value=app_token, path="/", max_age=86400, samesite="lax")
    return response


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """현재 로그인한 사용자 정보 반환"""
    return current_user


# ============================================
# OAuth 2.0 (Naver)
# ============================================

@router.get("/naver/login")
async def naver_login():
    """Naver 로그인 페이지로 리다이렉트"""
    if not settings.NAVER_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Naver Client ID가 설정되지 않았습니다.")
        
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
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Naver 로그인 실패 (UserInfo)")
        user_info = user_info_res.json()

    # 3. 회원가입 또는 로그인 처리
    response = user_info.get("response", {})
    email = response.get("email")
    nickname = response.get("nickname", "Naver User")
    
    if not email:
        raise HTTPException(status_code=400, detail="Naver에서 이메일 정보를 가져올 수 없습니다.")
    
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
            "updated_at": now
        }
        result = await users.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        # 기존 회원인 경우 업데이트
        user_id = str(user_doc["_id"])
        if user_doc.get("login_type") != "naver":
             await users.update_one({"_id": user_doc["_id"]}, {"$set": {"login_type": "naver", "updated_at": now}})
        else:
             await users.update_one({"_id": user_doc["_id"]}, {"$set": {"updated_at": now}})

    # 4. JWT 토큰 발급
    app_token = create_access_token({"sub": user_id, "email": email})
    if cache_set:
        await cache_set(f"session:{user_id}", app_token, expire_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    
    # 5. 프론트엔드로 리다이렉트 (토큰 포함 + 미들웨어용 쿠키 설정)
    response = RedirectResponse(url=f"http://localhost:3000/auth/callback?token={app_token}")
    response.set_cookie(key="auth_token", value=app_token, path="/", max_age=86400, samesite="lax")
    return response


# ============================================
# 사용자 정보 수정 및 관리
# ============================================

@router.put("/update-profile", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    사용자 프로필 정보 수정 (닉네임, 마케팅 동의 등)
    """
    users = get_users_collection()
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if not update_dict:
        return current_user
        
    update_dict["updated_at"] = datetime.utcnow()
    
    result = await users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        # 변경 사항이 없어도 현재 정보를 반환 (이미 같은 값인 경우 등)
        pass

    # 업데이트된 정보 조회
    user_doc = await users.find_one({"_id": ObjectId(current_user.id)})
    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        nickname=user_doc["nickname"],
        marketing_opt_in=user_doc.get("marketing_opt_in", False),
        login_type=user_doc.get("login_type", "email"),
        profile_image=user_doc.get("profile_image"),
        created_at=user_doc["created_at"]
    )


@router.put("/change-password")
async def change_password(
    password_data: PasswordUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    비밀번호 변경
    - 이메일 로그인 사용자만 가능
    - 기존 비밀번호 확인 절차 포함
    """
    if current_user.login_type != "email":
        raise HTTPException(
            status_code=400, 
            detail="소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다."
        )
        
    users = get_users_collection()
    user_doc = await users.find_one({"_id": ObjectId(current_user.id)})
    
    # 기존 비밀번호 확인
    if not verify_password(password_data.old_password, user_doc["password"]):
        raise HTTPException(
            status_code=401, 
            detail="기존 비밀번호가 올바르지 않습니다."
        )
        
    # 새 비밀번호 해싱 및 저장
    new_hashed_password = hash_password(password_data.new_password)
    await users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {
            "password": new_hashed_password,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "비밀번호가 성공적으로 변경되었습니다."}


@router.delete("/me")
async def delete_account(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    회원 탈퇴
    - 사용자 정보 및 관련 데이터 삭제 (실제 서비스에서는 Soft Delete 권장하나 여기서는 Hard Delete 처리)
    """
    users = get_users_collection()
    
    # 1. Redis 세션 삭제 (있는 경우)
    if cache_delete:
        try:
            await cache_delete(f"session:{current_user.id}")
        except Exception as e:
            print(f"⚠️ Redis 세션 삭제 실패 (무시됨): {e}")

    # 2. MongoDB에서 사용자 삭제
    result = await users.delete_one({"_id": ObjectId(current_user.id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
    # TODO: 사용자의 자산 데이터(Assets) 등 연관 데이터 삭제 로직 추가 필요
    
    return {"message": "회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다."}


@router.post("/upload-profile-image", response_model=UserResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    프로필 이미지 업로드
    - 운영 환경에서는 S3에 저장하고 URL을 DB에 저장해야 함
    - 여기서는 데모를 위해 Base64로 MongoDB에 저장함
    """
    # 파일 확장자 검증
    allowed_extensions = ["jpg", "jpeg", "png", "webp"]
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="허용되지 않는 파일 형식입니다. (jpg, jpeg, png, webp만 가능)")

    # 파일 크기 제한 (예: 5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기가 너무 큽니다. (최대 5MB)")

    # Base64 인코딩
    base64_image = base64.b64encode(content).decode("utf-8")
    profile_image_url = f"data:image/{file_ext};base64,{base64_image}"

    # DB 업데이트
    users = get_users_collection()
    await users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {
            "profile_image": profile_image_url,
            "updated_at": datetime.utcnow()
        }}
    )

    # 업데이트된 정보 조회
    user_doc = await users.find_one({"_id": ObjectId(current_user.id)})
    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        nickname=user_doc["nickname"],
        marketing_opt_in=user_doc.get("marketing_opt_in", False),
        login_type=user_doc.get("login_type", "email"),
        profile_image=user_doc.get("profile_image"),
        created_at=user_doc["created_at"]
    )


@router.delete("/profile-image", response_model=UserResponse)
async def remove_profile_image(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    프로필 이미지 삭제
    """
    users = get_users_collection()
    
    # DB 업데이트 (profile_image를 null로 설정)
    await users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {
            "profile_image": None,
            "updated_at": datetime.utcnow()
        }}
    )

    # 업데이트된 정보 조회
    user_doc = await users.find_one({"_id": ObjectId(current_user.id)})
    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        nickname=user_doc["nickname"],
        marketing_opt_in=user_doc.get("marketing_opt_in", False),
        login_type=user_doc.get("login_type", "email"),
        profile_image=user_doc.get("profile_image"),
        created_at=user_doc["created_at"]
    )
