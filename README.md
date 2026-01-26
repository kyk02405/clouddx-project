# Tutum - 안전한 AI 기반 자산 관리 플랫폼

코인과 주식을 하나의 플랫폼에서 안전하게 관리하는 AI 기반 자산 분석 서비스 **Tutum(투툼)**입니다.
현재 **Phase 1 (로그인 전 랜딩 페이지)** 구축이 완료되었으며, `develop` 브랜치에 통합되었습니다.

## 🎯 프로젝트 개요

Tutum은 라틴어로 '안전함/보호'를 의미하며, 사용자의 자산을 스마트하게 관리하고 AI를 통해 투자 위험을 분석해주는 통합 플랫폼입니다.
**비로그인 사용자**에게는 서비스의 매력과 기능을 보여주고, **로그인 사용자**에게는 심층 자산 관리를 제공하는 것을 목표로 합니다.

### 2026.01 업데이트 (랜딩 페이지 리뉴얼 완료)
- **Role**: 로그인 전 메인 홈페이지 UI/UX 및 공통 기능 구현
- **Status**: ✅ 완료 (Develop Merged)

## ✨ 주요 구현 기능 (Phase 1)

### 1. 하이브리드 테마 시스템 (Unique)
- **상단 헤더 (Nav, Hero, Stats)**: 다크 모드 설정과 무관하게 **Clean White 테마** 고정.
- **하단 콘텐츠**: 사용자가 다크/라이트 모드를 자유롭게 전환 가능 (`ThemeToggle`).
- **가시성 최적화**: 텍스트 대비(Contrast)와 버튼 스타일(`Black & White`)을 조정하여 가독성 극대화.

### 2. 동적 데이터 시각화
- **Watchlist Sparkline**: `lightweight-charts`를 활용하여 주요 자산(BTC, AAPL 등)의 7일 주가 흐름을 미니 차트로 시각화.
- **Market Snapshot**: 실시간 시장 동향과 AI가 포착한 급등락 종목 스냅샷 제공.
- **Quick Stats Bar**: 가격/뉴스/AI 업데이트 현황을 상단 중앙에 직관적으로 표시.

### 3. 프리미엄 UX 장치
- **AI 인사이트 잠금 (Lock Overlay)**: AI 분석 리포트 섹션에 **블러(Blur)** 효과와 **잠금 아이콘**을 적용하여 "로그인 후 볼 수 있는 고급 정보"임을 시각적으로 강조.
- **실제 뉴스 연동**: 뉴스 카드 클릭 시 **Mock 데이터 기반의 실제 뉴스 페이지** (네이버 증권, Bloomberg 등) 및 구글 검색 결과로 연결하여 사용자 경험 강화.

### 4. UI/UX 디테일
- **Pretendard 폰트**: 한국어와 숫자에 최적화된 표준 폰트 적용.
- **중앙 정렬 레이아웃**: 와이드 모니터에서도 정보가 흩어지지 않도록 `max-w-7xl mx-auto` 기반 설계.
- **CTA 버튼 최적화**: '로그인' 및 '시작하기' 버튼의 위계 질서 정리 (Black Primary Button).

---

## 🛠 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui (Radix UI)
- **Charts**: Lightweight Charts (TradingView Library)
- **Font**: Pretendard CDN
- **State**: React Hooks (Client Components)

---

## 📦 설치 및 실행

팀원들은 이 저장소를 클론 받은 후 다음 명령어로 실행하여 작업물(Dashboard 등)을 이어갈 수 있습니다.

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 📁 프로젝트 구조

```
.
├── app/
│   ├── api/public/          # [Mock] 비로그인용 공개 API (News, Market, Status)
│   ├── layout.tsx           # Global Layout (Pretendard, ThemeProvider)
│   └── page.tsx             # 홈 (랜딩 페이지) - Phase 1 완료
│
├── components/              # UI 컴포넌트
│   ├── Hero.tsx            # 메인 배너 (White Theme Fixed)
│   ├── QuickStatsBar.tsx   # 상단 통계 바 (White Theme Fixed)
│   ├── InsightPreview.tsx  # AI 인사이트 (Lock Overlay 적용)
│   ├── NewsSection.tsx     # 뉴스 리스트 (External Link)
│   ├── WatchlistPreview.tsx # 관심 종목 + Sparkline Chart
│   └── ...
│
└── public/
    └── data/                # 정적 Mock 데이터 (JSON)
```

## 🗓 향후 작업 계획 (Team)

- [ ] **Phase 2 (팀원 담당)**: 로그인/회원가입 페이지 및 인증 로직 구현
- [ ] **Phase 3 (팀원 담당)**: 사용자 대시보드 (내 자산 연동, 포트폴리오 차트)
- [ ] **Integration**: 백엔드 실제 API 연동

---

## 👫 팀 협업 가이드 (Git 명령어)

Git이 처음인 팀원을 위한 간단한 작업 가이드입니다.

### 1. 프로젝트 가져오기 (최초 1회)
```bash
git clone https://github.com/kyk02405/clouddx-project.git
cd clouddx-project
```

### 2. 최신 코드 받아오기 (작업 시작 전 필수!)
항상 작업을 시작하기 전에 `develop` 브랜치의 최신 코드를 받아와야 충돌을 방지할 수 있습니다.
```bash
git checkout develop      # develop 브랜치로 이동
git pull origin develop   # 최신 코드 받아오기
```

### 3. 내 작업 브랜치 만들기
`develop`에서 직접 작업하지 말고, 새로운 브랜치를 따서 작업하세요.
```bash
# 브랜치 이름 규칙: feature/기능명 (예: feature/login-page)
git checkout -b feature/login-page
```

### 4. 작업 내용 저장하기
```bash
git add .
git commit -m "feat: 로그인 페이지 UI 구현"  # 작업 내용 요약
```

### 5. 서버에 올리기 (PR 생성)
```bash
git push origin feature/login-page
```
이후 GitHub 웹사이트에서 `Pull Request` (PR) 버튼을 눌러 `develop` 브랜치로 병합 요청을 보냅니다.

---

## 📞 문의 및 피드백

메인 홈페이지 관련 수정 사항이나 UI 버그가 발견되면 Jira 티켓으로 등록해주세요.
