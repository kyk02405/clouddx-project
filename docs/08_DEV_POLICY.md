# Development Policy - CovaEX

## 병렬 개발 원칙 (Parallel Development)

> [!IMPORTANT] > **EPIC 순서와 무관하게 개발 진행**
>
> - EPIC은 논리적 그룹핑일 뿐, 순차 실행 강제 아님
> - 사용자 요구사항에 따라 즉시 개발 시작
> - Frontend와 Infrastructure는 **병렬로 동시 진행**

### 병렬 작업 예시

**동시 진행 가능**:

- EPIC 7 (Frontend Main Page) + EPIC 8 (Realtime Data) 일부
- EPIC 2 (Infra Baseline) + EPIC 7 (UI Development)
- 기본 인프라 구축 + Frontend 초기 개발

**핵심**: 명령받은 작업은 EPIC 번호와 상관없이 즉시 처리

---

## 기술 스택 정책

### 차트 및 그래프 라이브러리

**선택**: TradingView Lightweight Charts

```bash
npm install lightweight-charts
```

**사용 범위**:

- 코인 리스트 미니 차트 (Sparkline)
- 코인 상세 페이지 메인 차트
- 모든 가격 시각화

**이유**:

- TradingView 표준
- 성능 우수
- 암호화폐 거래소 표준 UI

---

## 데이터 소스 전략

### Phase 1: CoinGecko API (현재)

**목적**: 빠른 프로토타입 및 검증

**사용 API**:

```
GET /api/v3/simple/price
GET /api/v3/coins/{id}/market_chart
```

**업데이트 주기**:

- 초기: 수동 또는 polling (5-10초)
- 제한: Free tier rate limit 고려

**장점**:

- 구현 간단
- 실제 데이터 사용 가능
- 히스토리 데이터 제공

**단점**:

- Rate limit
- WebSocket 미지원 (polling 필요)

---

### Phase 2: Binance WebSocket (추후)

**목적**: 실시간 운영 환경

**아키텍처**:

```
Binance WS -> market-data service -> Redis -> ws-gateway -> Browser
```

**전환 시점**:

- CoinGecko로 기본 기능 검증 완료 후
- 실시간성 요구사항 발생 시
- EPIC 8 본격 진행 시

**호환성 유지**:

- Frontend는 데이터 소스 무관하게 동작
- API 계층 추상화로 교체 용이

---

## 차트 데이터 정책

### 스파크라인 (Coin List)

**기간**: 7일 (최근 1주일)

**데이터 포인트**: 24-48개 (시간당 또는 30분당)

**표시**: TradingView Lightweight Charts - Area/Line chart

---

### 메인 차트 (Coin Detail Page)

**기간 옵션**: 1일 / 1주 / 1개월 / 3개월 / 1년

**차트 타입**: Candlestick (기본) + Line/Area 옵션

**라이브러리**: TradingView Lightweight Charts

---

## API 구조 정책

### Next.js API Routes

**목적**: CORS 우회 + Rate Limit 관리

**구조**:

```
app/api/
├── coins/
│   ├── route.ts              # GET /api/coins - 전체 코인 목록
│   └── [id]/
│       ├── route.ts          # GET /api/coins/{id} - 단일 코인 정보
│       └── chart/
│           └── route.ts      # GET /api/coins/{id}/chart - 차트 데이터
```

**캐싱**:

- Next.js 기본 캐싱 활용
- `revalidate` 옵션으로 주기 설정

---

## 우선순위 정책

1. **사용자 요구사항 최우선**
2. EPIC 순서는 참고용
3. 병렬 개발 적극 활용
4. 빠른 검증 후 점진적 개선

---

**작성일**: 2026-01-15
**최종 업데이트**: 2026-01-15
