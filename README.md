# Tutum - 안전한 AI 기반 자산 관리 플랫폼

코인과 주식을 하나의 플랫폼에서 안전하게 관리하는 AI 기반 자산 분석 서비스 **Tutum(투툼)**입니다.

## 🎯 프로젝트 개요

Tutum은 라틴어로 '안전함/보호'를 의미하며, 사용자의 자산을 스마트하게 관리하고 AI를 통해 투자 위험을 분석해주는 통합 플랫폼입니다.
CSV/OCR 업로드부터 실시간 시세, 뉴스, AI 인사이트까지 한곳에서 제공합니다.

**핵심 기능:**
- 📈 **통합 자산 관리**: 암호화폐(BTC, ETH)와 주식(AAPL, 삼성전자)을 한눈에 파악
- 🤖 **AI 인사이트**: 포트폴리오 리스크 분석 및 매수/매도 시그널 감지
- ⚡ **실시간 모니터링**: 10초 단위 시세 업데이트 및 뉴스 속보
- 📱 **반응형 UI**: PC, 태블릿, 모바일 완벽 지원

## 🛠 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Pure White Theme)
- **UI Components**: Shadcn/ui 호환, Radix UI
- **Charts**: Lightweight Charts (TradingView)
- **Font**: Pretendard (Korean Standard)

## 📦 설치 및 실행

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📁 프로젝트 구조

```
.
├── app/
│   ├── api/public/          # API Routes (Mock Data)
│   │   ├── market/          # 시장 데이터
│   │   ├── watchlist/       # 관심 종목 + 차트 데이터
│   │   ├── news/            # 뉴스
│   │   └── insights/        # AI 인사이트
│   ├── layout.tsx           # 루트 레이아웃 (Pretendard 폰트)
│   └── page.tsx             # 홈 (랜딩 페이지)
│
├── components/              # UI 컴포넌트
│   ├── ui/                 # 공통 UI (Button, Card, Badge 등)
│   ├── Sparkline.tsx       # 미니 차트 컴포넌트
│   ├── TopNav.tsx          # 상단 네비게이션
│   ├── MarketSnapshot.tsx  # 시장 동향 + AI Watch
│   ├── WatchlistPreview.tsx # 관심 자산 리스트
│   ├── NewsSection.tsx     # 뉴스 섹션
│   └── ...
│
└── public/
    └── data/                # 정적 Mock 데이터 (JSON)
```

## 🎨 UI/UX 리뉴얼 (2026.01)

- **브랜드 변경**: AssetAI → **Tutum**
- **Pure White 테마**: 깔끔하고 신뢰감 있는 화이트 톤 디자인 적용
- **Pretendard 폰트**: 가독성 높은 한국어 표준 폰트 적용
- **UX 개선**:
  - 부드러운 스크롤 (Smooth Scrolling)
  - 탭/버튼 크기 확대 및 명암비 개선
  - Sparkline 차트로 주간 흐름 시각화

## 🔌 API 엔드포인트

### GET /api/public/market
시장 주요 동향 및 AI 포착 종목 데이터

### GET /api/public/watchlist
관심 종목 리스트 및 7일치 주가 데이터 (Sparkline용)

### GET /api/public/news
자산 관련 실시간 뉴스

## 🤝 Git 브랜치 전략

- `develop` - 메인 개발 브랜치
- `feature/*` - 기능 개발용 브랜치
- 커밋 메시지 컨벤션: `feat`, `fix`, `style`, `refactor`, `docs`

## 📞 문의

프로젝트 관련 문의사항은 팀 채널로 남겨주세요.
