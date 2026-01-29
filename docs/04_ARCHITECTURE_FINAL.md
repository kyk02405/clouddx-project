# Architecture (Final - Realistic)

## Development Approach

> [!IMPORTANT] > **병렬 개발 (Parallel Development)**
>
> - EPIC 순서와 무관하게 기능 개발 진행
> - Frontend + Infrastructure 동시 작업
> - 사용자 요구사항 즉시 반영

## Two Data Paths

### A) Real-time Market Data (Speed-first)

**Phase 1 (Current)**: CoinGecko API

```
Browser -> Next.js API Routes -> CoinGecko API
```

- Polling 방식 (5-10초)
- Next.js API Routes에서 CORS 우회 + 캐싱

**Phase 2 (Future)**: Binance WebSocket

```
Binance WS -> market-data service -> Redis (cache + pubsub) -> ws-gateway -> Browser
```

- Key rule: SSR request must NOT open Binance WS per user request
- Instead:
  - market-data keeps WS connection
  - Next.js SSR reads cached "latest snapshot" from Redis or query-api
  - Browser receives incremental updates from ws-gateway via WebSocket

### B) Portfolio / Orders (Consistency-first, later stage)

Browser -> trade-api -> SQS FIFO -> worker -> Postgres
Browser reads via query-api, and optionally receives updates via ws-gateway.

## Services (App Repo)

- frontend (Next.js): main UI + SSR shell + **CoinGecko API integration (Phase 1)**
- market-data: Binance WS ingestion, publish to redis (Phase 2)
- ws-gateway: WebSocket broadcast to clients (Phase 2)
- query-api: read-only endpoints for coins snapshot/watchlist/portfolio
- trade-api: order endpoints (can be stubbed in UI MVP phase)
- worker: background consumer (later phase)

## Frontend Tech Stack

- **Charts**: TradingView Lightweight Charts
- **Styling**: TailwindCSS
- **State**: React hooks + localStorage (guest mode)

## Auth Strategy

- JWT HttpOnly cookie
- REST checks cookie
- WS handshake checks cookie/token

## Infra (Infra Repo)

- EKS, RDS(Postgres), ElastiCache Redis, SQS FIFO(+DLQ), ALB Ingress, Route53/ACM
- CI: GitHub Actions build/push to ECR
- CD: Argo CD sync from infra repo
