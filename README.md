# AssetAI - AI 기반 자산 관리 플랫폼

코인과 주식을 하나의 플랫폼에서 관리하는 AI 기반 자산 분석 서비스입니다.

## 🎯 프로젝트 개요

CSV/OCR 업로드부터 실시간 시세, 뉴스, AI 인사이트까지 제공하는 통합 자산 관리 플랫폼입니다.

**지원 자산:**
- 암호화폐 (BTC, ETH, SOL 등)
- 미국 주식 (AAPL, TSLA, NVDA, GOOGL, MSFT)
- 한국 주식 (삼성전자, SK하이닉스, NAVER)

## 🛠 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Hooks (useState, useEffect)

## 📦 설치 및 실행

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 빌드
```bash
npm run build
npm start
```

## 📁 프로젝트 구조

```
.
├── app/
│   ├── api/public/          # API Routes (더미 데이터)
│   │   ├── market/          # 시장 데이터 (코인/주식)
│   │   ├── news/            # 뉴스
│   │   ├── insights/        # AI 인사이트
│   │   └── status/          # 시스템 상태
│   ├── layout.tsx           # 루트 레이아웃
│   └── page.tsx             # 홈페이지
│
├── components/              # 재사용 컴포넌트
│   ├── TopNav.tsx          # 상단 네비게이션
│   ├── Hero.tsx            # 히어로 섹션
│   ├── QuickStatsBar.tsx   # 빠른 통계 바
│   ├── MarketSnapshot.tsx  # 시장 스냅샷 (탭)
│   ├── WatchlistPreview.tsx # 관심 자산 (탭)
│   ├── NewsSection.tsx     # 뉴스 섹션
│   ├── InsightPreview.tsx  # AI 인사이트
│   ├── AlertPresets.tsx    # 알림 프리셋
│   ├── FeaturesSection.tsx # 기능 설명
│   ├── Footer.tsx          # 푸터
│   └── LoadingSkeleton.tsx # 로딩 스켈레톤
│
└── docs/                    # 프로젝트 문서
```

## 🎨 현재 구현된 홈페이지 섹션

1. **TopNav** - 로고, 메뉴 (Features, Market, News), Login/Get Started 버튼
2. **Hero** - 메인 헤드라인, CTA 버튼
3. **QuickStatsBar** - 가격/뉴스/AI 업데이트 시간
4. **MarketSnapshot** - 코인/주식 탭으로 Top Movers, Volatility, Trend Keywords 표시
5. **WatchlistPreview** - 코인/주식 탭으로 관심 자산 리스트
6. **NewsSection** - 전체 뉴스 / 내 자산 뉴스 탭
7. **InsightPreview** - AI 포트폴리오 분석 3가지 (요약, 리스크, 추천)
8. **AlertPresets** - 알림 프리셋 버튼 3개
9. **FeaturesSection** - 3단계 사용 방법 설명
10. **Footer** - CTA, 링크

## 🔌 API 엔드포인트 (더미 데이터)

### GET /api/public/market
시장 데이터 (코인 + 주식)
```json
{
  "crypto": {
    "topMovers": [...],
    "volatility": [...]
  },
  "stocks": {
    "topMovers": [...],
    "volatility": [...]
  },
  "trendKeywords": [...]
}
```

### GET /api/public/news
뉴스 데이터
```json
{
  "all": [...],      // 전체 뉴스 (코인 + 주식)
  "myAssets": [...]  // 내 자산 뉴스
}
```

### GET /api/public/insights/sample
AI 인사이트
```json
{
  "insights": [
    { "type": "summary", ... },
    { "type": "risk", ... },
    { "type": "action", ... }
  ]
}
```

### GET /api/public/status
시스템 상태
```json
{
  "priceUpdate": "2026-01-26T10:00:00Z",
  "newsUpdate": "2026-01-26T09:55:00Z",
  "aiUpdate": "2026-01-26T09:45:00Z",
  "status": "operational"
}
```

## 👨‍💻 개발 가이드 (팀원용)

### 새 페이지 추가하기

1. `app/` 디렉토리에 새 폴더 생성
```bash
app/portfolio/page.tsx
```

2. 페이지 컴포넌트 작성
```tsx
export default function Portfolio() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* 내용 */}
    </div>
  );
}
```

3. 네비게이션에 링크 추가 (`components/TopNav.tsx`)

### 새 컴포넌트 추가하기

1. `components/` 디렉토리에 파일 생성
```bash
components/MyComponent.tsx
```

2. "use client" 지시어 추가 (상태/이벤트 사용 시)
```tsx
"use client";

export default function MyComponent() {
  const [data, setData] = useState(null);
  // ...
}
```

### 새 API Route 추가하기

1. `app/api/` 디렉토리에 폴더 생성
```bash
app/api/my-endpoint/route.ts
```

2. GET/POST 핸들러 작성
```typescript
import { NextResponse } from "next/server";

export async function GET() {
  const data = { ... };
  return NextResponse.json(data);
}
```

### 스타일링 규칙

- **다크 테마 기준**: `bg-gray-950`, `bg-gray-900`, `text-white`
- **강조색**: `bg-blue-600`, `text-blue-400`
- **반응형**: `sm:`, `md:`, `lg:` 브레이크포인트 사용
- **카드**: `rounded-lg border border-gray-800 bg-gray-900 p-6`

## 🎯 다음 개발 항목 (팀원 작업)

### 우선순위 높음
- [ ] 포트폴리오 페이지 (`/portfolio`)
- [ ] 자산 상세 페이지 (`/asset/[symbol]`)
- [ ] 로그인/회원가입 페이지
- [ ] 10초 체험하기 모달

### 우선순위 중간
- [ ] 실제 API 연동 (백엔드 연결)
- [ ] 차트 컴포넌트 (lightweight-charts 활용)
- [ ] 알림 설정 페이지
- [ ] 사용자 설정 페이지

### 우선순위 낮음
- [ ] 다국어 지원
- [ ] 다크/라이트 모드 토글
- [ ] 애니메이션 강화

## 🤝 Git 브랜치 전략

- `develop` - 메인 개발 브랜치 (현재 뼈대 구조)
- `feature/기능명` - 기능 개발용 브랜치
- 작업 완료 후 `develop`으로 PR

## 📝 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
chore: 빌드/설정 변경
docs: 문서 수정
style: 코드 포맷팅
refactor: 리팩토링
```

## 📞 문의

프로젝트 관련 문의사항은 팀 채널로 남겨주세요.
