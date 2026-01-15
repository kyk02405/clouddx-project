# CovaEX (InfraForge-style Cloud Native Trading UI MVP)

## Goal

Build the first production-grade "Main Page" MVP of CovaEX:

- Clean top menu (Home / Coin / My Assets)
- Right sticky Quick Bar with slide-in panels (MY / Watchlist / Chatbot placeholder / + custom)
- User profile dropdown (login-only menus hidden from topbar)
- Not logged-in behavior: any protected action routes to Login
- Real-time market data uses Binance WS pipeline (server-side ingestion + redis cache) + WebSocket broadcast to clients

## Repos

- covaex-app: Next.js + FastAPI services
- covaex-infra: Terraform + Helm/K8s + Argo CD GitOps

### UI/UX Baseline (External Link)

- https://www.tossinvest.com/
- https://www.kraken.com/
- https://kr.tradingview.com/
- https://www.coingecko.com/
- https://upbit.com/exchange?code=CRIX.UPBIT.KRW-BTC

## Where to Start

Follow docs/00_WORK_ORDER.md exactly.

## References

- Toss Invest UI/UX baseline
- Kraken profile menu pattern
- TradingView chart style reference (detail page)
