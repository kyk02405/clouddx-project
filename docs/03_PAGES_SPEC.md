# Pages Spec (MVP)

## 1) Login Page (/login)

- Simple login form (ID/PW or OAuth later)
- After login: redirect to previous page or / (main)
- Provide "Demo login" option (if needed for presentation)

## 2) Coin Detail Page (/coin/[symbol])

- Reference: TradingView/Kraken UI inspiration
- MVP layout:
  - header: symbol + price
  - chart area: placeholder or simple chart
  - order widget: placeholder (buy/sell UI skeleton)
  - watchlist toggle (heart)
- Data strategy:
  - Page shell can be SSR
  - Chart data can be CSR fetched from backend (FastAPI)

## 3) Portfolio Page (/portfolio)

- Post-login only
- MVP:
  - summary cards: total balance / pnl
  - list: positions
- If not logged in: redirect /login
