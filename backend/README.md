# CloudDX Backend Service

FastAPI 기반의 고성능 비동기 자산 관리 및 시세 데이터 처리 백엔드 서비스입니다.

## 🛠 기술 스택 (Tech Stack)

- **Framework**: FastAPI (Python 3.11+)
- **Database**: MongoDB (Motor 비동기 드라이버)
- **Cache**: Redis (예정)
- **API**: 한국투자증권(KIS) 오픈 API, Upbit API
- **Deployment**: Docker, Uvicorn

## 📂 디렉토리 구조 (Directory Structure)

```
backend/
├── app/
│   ├── api/             # API 라우터 (auth, assets, market, news)
│   │   └── v1/          # API 버전 1
│   ├── services/        # 비즈니스 로직 (KIS Client, Market Data 등)
│   ├── database.py      # MongoDB 연결 관리
│   ├── config.py        # 환경 변수 및 설정 관리
│   └── main.py          # 앱 진입점 (Lifespan, Middleware)
├── workers/             # 백그라운드 작업 (Celery/Redis Queue) - 예정
├── requirements.txt     # Python 의존성 패키지 목록
├── Dockerfile           # 컨테이너 빌드 정의
└── .env                 # 환경 변수 (Git 제외, 보안 주의)
```

## 🚀 주요 기능 (Key Features)

### 1. 인증 시스템 (Authentication)
- **JWT 기반 인증**: Access Token을 이용한 무상태(Stateless) 인증.
- **OAuth 2.0**: Google, Naver 소셜 로그인 지원.
- **쿠키/헤더 동시 지원**: Next.js Middleware와의 호환성을 위해 `auth_token` 쿠키 처리.

### 2. 마켓 데이터 (Market Data)
- **실시간 시세**: 한국투자증권(KIS) API와 연동하여 국내/해외 주식 시세 제공.
- **토큰 관리**: KIS API 접근 토큰의 자동 발급 및 재사용(Caching) 로직 내장.
- **뉴스 애그리게이션**: 크롤링된 뉴스 데이터 조회 API 제공.

### 3. 자산 관리 (Asset Management)
- **포트폴리오**: 사용자별 자산 현황 CRUD.
- **대량 등록**: CSV 파일 업로드를 통한 자산 일괄 등록 지원.

## 📦 설치 및 실행 (Setup)

### 로컬 개발 환경
```bash
# 1. 가상환경 생성 및 활성화
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 환경 변수 설정
# .env 파일을 생성하고 필수 값을 채워주세요. (KIS_APP_KEY 등)

# 4. 서버 실행
python -m uvicorn app.main:app --reload
```

### 테스트
```bash
# 단위 테스트 실행
pytest
```
