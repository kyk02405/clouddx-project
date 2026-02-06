# Tutum (투툼) - AI 기반 안전한 자산 관리 플랫폼

> 코인과 주식을 하나의 플랫폼에서 안전하게 관리하는 AI 기반 자산 분석 서비스

![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-black)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-green)

---

## 🎯 프로젝트 개요

**Tutum**(투툼)은 라틴어로 '안전함/보호'를 의미하며, 사용자의 자산을 스마트하게 관리하고 AI를 통해 투자 위험을 분석해주는 통합 플랫폼입니다.

### 주요 특징
- 📊 **통합 자산 관리**: 주식, 암호화폐, 현금성 자산을 한 곳에서 관리
- 🤖 **AI 기반 인사이트**: 투자 위험 분석 및 맞춤형 추천
- 📈 **실시간 시세**: 한국투자증권(KIS), Upbit API 연동
- 🔐 **안전한 인증**: JWT + OAuth 2.0 (Google, Naver, Kakao)

---

## 🚀 빠른 시작

### 1️⃣ 프로젝트 클론
```bash
git clone https://github.com/kyk02405/clouddx-project.git
cd clouddx-project
```

### 2️⃣ 백엔드 실행 (Terminal 1)
```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate   # Linux/Mac

# 의존성 설치 및 실행
pip install -r requirements.txt
uvicorn app.main:app --reload
```
**확인**: http://localhost:8000/docs

### 3️⃣ 프론트엔드 실행 (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
**확인**: http://localhost:3000

---

## 📁 프로젝트 구조

```
clouddx-project/
├── backend/              # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py       # 애플리케이션 진입점
│   │   ├── routers/      # API 라우터 (auth, assets, market, news)
│   │   ├── services/     # 비즈니스 로직 (KIS, Upbit 연동)
│   │   └── database.py   # MongoDB 연결
│   └── requirements.txt
│
├── frontend/             # Next.js 14 프론트엔드
│   ├── app/              # App Router (페이지)
│   ├── components/       # React 컴포넌트
│   ├── context/          # 상태 관리 (Auth, Asset)
│   └── lib/              # 유틸리티 및 훅
│
├── docs/                 # 문서
│   ├── dev_logs/         # 개발 작업 로그
│   └── clouddx-roadmap.md
│
└── infra/                # 인프라 설정 (예정)
```

---

## ✨ 구현 완료 기능

### 🔐 인증 시스템
- [x] JWT 기반 로그인/회원가입
- [x] OAuth 2.0 소셜 로그인 (Google, Naver, Kakao)
- [x] 쿠키/헤더 동시 지원 (Next.js Middleware 호환)

### 📊 시장 데이터
- [x] 한국투자증권(KIS) API 연동
- [x] Upbit 암호화폐 시세 API
- [x] 실시간 가격 Widget (주요 지수)

### 💼 포트폴리오 관리
- [x] CSV 대량 업로드
- [x] 직접 자산 등록
- [x] 자산 현황 조회

### 📰 뉴스 & AI 인사이트
- [x] 뉴스 크롤링 및 표시
- [x] AI 투자 인사이트 (Preview)

---

## 🛠 기술 스택

| 영역 | 기술 |
| :--- | :--- |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui |
| **Backend** | FastAPI, Python 3.11+, Motor (MongoDB 비동기) |
| **Database** | MongoDB Atlas |
| **Cache** | Redis (예정) |
| **Charts** | Lightweight Charts (TradingView) |
| **Auth** | JWT, OAuth 2.0 |
| **API** | 한국투자증권(KIS), Upbit |

---

## 👫 팀 협업 가이드

### Git 브랜치 전략
- `main`: 안정화된 배포 버전
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발 브랜치

### 작업 흐름
```bash
# 1. develop 최신화
git checkout develop
git pull origin develop

# 2. 기능 브랜치 생성
git checkout -b feature/my-feature

# 3. 작업 후 커밋
git add .
git commit -m "feat: 새 기능 추가"

# 4. Push 및 PR 생성
git push origin feature/my-feature
```

### 📝 Dev Logs 필수 작성
모든 PR 전에 `docs/dev_logs/YYYY-MM-DD_작업내용.md` 파일을 작성해야 합니다.
UI 변경 시 스크린샷 첨부 필수! → 상세 가이드: `docs/dev_logs/DEV_LOGS_GUIDE.md`

---

## 📞 문의

- **문서 허브**: `docs/README.md`
- **로드맵**: `docs/clouddx-roadmap.md`
- **이슈 등록**: GitHub Issues

---

**Happy Coding! 🎉**
