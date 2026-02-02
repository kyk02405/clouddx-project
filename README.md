# CloudDX Project

> 포트폴리오 관리 시스템 (FastAPI + Next.js + MongoDB Atlas)

---

## 🚀 빠른 시작

### 1️⃣ 프로젝트 클론

```bash
git clone <repository-url> clouddx-project
cd clouddx-project
```

### 2️⃣ 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example backend/.env

# MongoDB Atlas 연결 문자열 이미 설정되어 있음
# 필요 시 팀 리더에게 문의
```

### 3️⃣ 백엔드 실행

**Terminal 1:**
```bash
cd backend

# 가상환경 생성 (처음 한 번만)
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate  # Linux/Mac/WSL
# Windows: .\venv\Scripts\Activate.ps1

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --reload
```

**확인**: http://localhost:8000/docs

### 4️⃣ 프론트엔드 실행

**Terminal 2:**
```bash
cd frontend

# 의존성 설치
npm install

# 서버 실행
npm run dev
```

**확인**: http://localhost:3000

---

## 📁 프로젝트 구조

```
clouddx-project/
├── backend/              # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py      # 메인 애플리케이션
│   │   ├── models/      # Pydantic 모델
│   │   ├── routers/     # API 라우터
│   │   └── services/    # 비즈니스 로직
│   ├── .env             # 환경 변수 (Git 제외)
│   └── requirements.txt # Python 의존성
│
├── frontend/            # Next.js 프론트엔드
│   ├── app/            # App Router
│   ├── components/     # React 컴포넌트
│   ├── lib/            # 유틸리티
│   └── package.json    # npm 의존성
│
└── .env.example        # 환경 변수 템플릿
```

---

## ✨ 주요 기능

### 📊 CSV 대량 업로드
- CSV 파일로 여러 자산을 한 번에 등록
- 자동 자산 타입 감지 (주식/암호화폐/ETF)
- 인라인 데이터 편집 및 검증
- **접속**: http://localhost:3000/bulk-insert/upload

### 💼 포트폴리오 관리
- 보유 자산 조회
- 자산별 수익률 계산
- 실시간 시세 연동 (예정)

---

## 🗄️ 데이터베이스

### MongoDB Atlas (클라우드)
- **클러스터**: tutum
- **데이터베이스**: clouddx
- **연결**: 자동 (`.env` 파일 설정됨)

### 데이터 확인
- **Atlas UI**: https://cloud.mongodb.com
- **MongoDB Compass**: 연결 문자열 입력
- **mongosh**: `mongosh "mongodb+srv://..."`

---

## 🛠️ 개발 도구

### API 문서
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 로그 확인
```bash
# 백엔드
cd backend && uvicorn app.main:app --reload --log-level debug

# 프론트엔드
cd frontend && npm run dev
```

---

## 🧪 테스트

### CSV 업로드 테스트 데이터

```csv
symbol,name,quantity,average_price,currency
BTC,비트코인,0.5,50000000,KRW
ETH,이더리움,2.0,3000000,KRW
AAPL,애플,10,150,USD
TSLA,테슬라,5,200,USD
005930,삼성전자,50,70000,KRW
```

---

## 🤝 팀 협업

### 새 팀원 온보딩
1. 프로젝트 클론
2. `cp .env.example backend/.env`
3. 백엔드/프론트엔드 의존성 설치
4. 서버 실행

### Git 워크플로우
```bash
# 작업 전
git checkout -b feature/my-feature
git pull origin main

# 작업 후
git add .
git commit -m "feat: 새 기능 추가"
git push origin feature/my-feature
```

---

## 🐛 문제 해결

### MongoDB 연결 실패
```bash
# 연결 테스트
curl localhost:8000/health

# .env 파일 확인
cat backend/.env
```

### 프론트엔드 빌드 오류
```bash
# 캐시 삭제
rm -rf .next node_modules
npm install
npm run dev
```

### Python 의존성 오류
```bash
# 가상환경 재생성
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 📞 도움말

- **Atlas 설정**: `MONGODB_ATLAS_SETUP.md`
- **빠른 시작**: `QUICKSTART.md`
- **이슈 등록**: GitHub Issues

---

**Happy Coding! 🎉**
