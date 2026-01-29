# Product Scope - Main Page MVP (CovaEX)

## Must Have (MVP)

1. Brand

- Logo text: "CovaEX" (NOT InfraForge)

2. Top Menu (minimal)

- 홈 / 코인 / 나의 자산
- Login 이전에는 최대한 단순하게 유지

3. Right Sticky Quick Bar

- 항상 우측에 고정된 Quick Bar
- 버튼: MY / 관심 / 챗봇(placeholder) / + (custom placeholder)
- 클릭 시, 왼쪽으로 slide-in panel (닫기 버튼 포함)
  - Size guideline: desktop 기준 400px~700px 수준 (20%~60% 폭)
  - "패널은 overlay처럼 뜨되, 사용자가 현재 페이지 context 유지"

4. User Profile Menu (Right top)

- 왼쪽에 "코인 검색" UI 반드시 포함 (Figma에서 빠졌던 부분 보완)
- 프로필 클릭 시 Kraken 스타일 메뉴처럼 여러 경로 제공
- 단, 로그인 이전에는:
  - 프로필 메뉴를 열어도 "Login required" CTA 중심
  - 숨겨진(로그인 전에는 보이지 않는) 메뉴 구조를 명확히 유지
  - 어떤 보호 페이지/보호 액션 클릭 시 무조건 /login으로 이동

5. Main Content - Page1 (center)

- Toss Invest 느낌의 코인 리스트/요약 카드
- 실시간 시세는 Binance WS 기반 파이프라인 사용
  - SSR: 서버가 캐시된 latest를 읽어 초기 렌더
  - CSR: 실시간 업데이트는 ws-gateway WS로 수신
- 코인 클릭 -> Coin Detail Page로 이동 (임시 구성 허용)
- 하트 클릭 -> 관심(Watchlist)에 추가

6. Main Content - Page2 (right side)

- #급상승 / #거래량 / #인기 / #신규 등 키워드형 섹션
- 각 섹션에 코인과 현재 가격 표시

## Nice to Have (Later)

- 챗봇 실제 기능 (현재는 placeholder)
- - custom menu 편집 기능 (현재는 뼈대만)
- 고급 필터/정렬/알림

## Non-Goals (이번 MVP에서 제외)

- 완전한 거래/체결 엔진, 결제, KYC
- 차트 고급 분석(TradingView급) 전체 구현
- 관리자 페이지/정산/랭킹의 완성형
