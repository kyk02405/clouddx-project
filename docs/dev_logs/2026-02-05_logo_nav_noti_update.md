# 2026-02-05 Logo, Nav, and Notification Updates

## 1. 작업 개요
- **목표**: 사용자 UX 개선 및 알림 기능 초안 구현
- **브랜치**: `kyk/0205-logo`
- **관련 워크플랜**: `docs/work-plans/2026-02-05_logo_nav_noti_update.md`

## 2. 주요 변경 사항

### 2.1 로고 리다이렉트 수정
- **파일**: `frontend/components/PortfolioHeader.tsx`
- **내용**: 좌측 상단 `tutum` 로고 클릭 시 랜딩 페이지(`/`)가 아닌 포트폴리오 메인(`/portfolio/asset`)으로 이동하도록 수정.
- **목적**: 로그인 사용자가 실수로 로그아웃되지 않도록 사용자 경험 개선.

### 2.2 네비게이션 텍스트 변경 (랜딩 페이지)
- **파일**: `frontend/components/TopNav.tsx`
- **내용**: 상단 메뉴바의 "시장" 텍스트를 "**증시**"로 변경.
- **목적**: 금융 서비스로서의 정체성을 명확히 하기 위함.

### 2.3 알림 기능 (Mockup) 구현
- **파일**: `frontend/components/PortfolioHeader.tsx`, `frontend/components/ui/popover.tsx` (신규)
- **내용**: 
    - shadcn/ui 기반 `Popover` 컴포넌트 추가.
    - 헤더의 종(Bell) 아이콘 클릭 시 알림 팝오버 표시.
    - 가짜 데이터(`SAMPLE_NOTIFICATIONS`)를 활용한 급등/급락 알림 예시 구현.
    - 읽지 않은 알림이 있을 경우 빨간 점(Badge) 표시 로직 추가.

## 3. 검증 결과
- **로컬 테스트**:
    - 로고 클릭 시 URL 변경 확인 (`/` -> `/portfolio/asset`).
    - 랜딩 페이지 네비게이션 "증시" 텍스트 확인.
    - 알림 아이콘 클릭 시 팝오버 정상 작동 및 데이터 렌더링 확인.

## 4. 향후 계획
- 알림 데이터 DB 스키마 설계 및 백엔드 API 연동 (추후).
- WebSocket을 통한 실시간 알림 전송 구현.
