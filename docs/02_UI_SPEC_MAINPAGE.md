# UI Spec - Main Page (Based on Figma)

## Layout Overview

- Header: Left logo "CovaEX", top menu (홈/코인/나의 자산), right: coin search + user profile
- Body:
  - Center main content (coin list/cards + news/articles placeholders)
  - Right side content column (keyword blocks: 급상승/거래량/인기/신규)
- Right sticky Quick Bar (always visible)
- Slide-in panel system (from right quick bar button) opens a floating panel from the left side of quick bar

## Header

### Logo (Left Top)

- Text/branding: "CovaEX"

### Top Menu

- 홈 / 코인 / 나의 자산
- Pre-login: 메뉴는 보여도 protected 이동이면 /login redirect
- Post-login: top menu는 그대로 간단하게 유지(중요!), 대신 profile dropdown에 기능을 숨긴다

### Coin Search (Important)

- Header right area left side: coin search input + dropdown results
- Not logged-in: 검색은 가능(정보는 public) / 하지만 watchlist 추가 등은 login 필요 정책 가능

### User Profile Dropdown

- Kraken 스타일 메뉴 그룹화:
  - Account/Portfolio/Settings/Security/Docs 등
- Pre-login: 로그인 버튼/CTA 중심
- 핵심 의도: "Top menu를 간략히 유지하기 위해 로그인 후 메뉴는 profile에 숨김"

## Right Sticky Quick Bar

### Buttons

1. MY

- Slide-in panel: 내 자산 요약/분석 (MVP는 placeholder + 기본 구조)

2. 관심

- Slide-in panel: watchlist 리스트 + 가격

3. 챗봇

- Slide-in panel: placeholder (Coming soon)

4. -

- Slide-in panel: "custom menu 추가" placeholder + 예시 목록

### Panel Behavior

- open/close (X)
- overlay 형태로 띄우되, 페이지 이동 없이 닫고 열 수 있음
- width guideline: ~400px~700px (responsive)
- keyboard ESC 닫기 (가능하면)

## Main Content (Center)

- Toss Invest 느낌의 coin list section
- Real-time price updates visible
- Coin item:
  - symbol/name/price/change %
  - heart icon -> add/remove watchlist
  - click row/card -> coin detail page 이동

## Right Content (Keyword Blocks)

- 급상승 / 거래량 많은 / 인기 / 새로 나온
- Each block shows top N coins + price + mini change

## Not Logged-in Policy (Global)

- 보호 메뉴/보호 액션:
  - My Assets page / Portfolio page / watchlist 수정(정책 선택) 등
  - 클릭 시 /login redirect
- Main page view는 허용(정보성)
