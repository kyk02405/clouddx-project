# 📝 Dev Logs 작성 가이드

## 목적
모든 팀원이 작업 내용을 체계적으로 문서화하여 협업 효율성을 높이고, UI 변경 사항을 시각적으로 추적합니다.

---

## 📋 작성 규칙

### 1. **작성 시점**
-   **Push 전 필수**: 모든 PR(Pull Request) 생성 전에 dev_log를 작성해야 합니다.
-   **일자별 작성**: `YYYY-MM-DD_작업내용.md` 형식으로 파일명을 지정합니다.
    -   예: `2026-02-03_portfolio_asset_fixes.md`

### 2. **파일 위치**
```
docs/dev_logs/
├── YYYY-MM-DD_작업내용.md
└── screenshots/
    └── YYYY-MM-DD/
        ├── 스크린샷1.png
        └── 스크린샷2.png
```

### 3. **필수 포함 항목**
모든 dev_log는 다음 섹션을 포함해야 합니다:

```markdown
# 📅 개발 작업 완료 보고서 (YYYY-MM-DD)

## 📌 작업 개요
**작성자**: `Git Username` (예: kyk02405, jhnet00 등)
**Jira Ticket**: `TICKET-ID` (있는 경우)
**Branch**: `feature/branch-name`
**작업 내용**: 한 줄 요약

## 1. 🔧 주요 변경 사항
-   변경된 파일 및 기능 설명
-   추가/수정/삭제된 로직

## 2. 🐛 버그 수정 (있는 경우)
-   문제 상황
-   원인 분석
-   해결 방법

## 3. 📸 UI 스크린샷 (UI 변경이 있는 경우 필수)
### 페이지/컴포넌트 이름
![설명](screenshots/YYYY-MM-DD/파일명.png)

## 4. 📝 커밋 내역
```
git log --oneline --since="YYYY-MM-DD" --until="YYYY-MM-DD 23:59:59"
```

---
**✅ 결론**: 작업 완료 후 핵심 성과 요약
```

---

## 📸 UI 스크린샷 가이드

### **UI 변경이 있는 경우 반드시 스크린샷을 포함해야 합니다.**

### 1. **스크린샷 캡처 방법**

#### 방법 A: 브라우저 개발자 도구 사용
1.  로컬 서버 실행 (`npm run dev`)
2.  변경된 페이지로 이동
3.  `F12` → 개발자 도구 → 스크린샷 캡처
4.  `docs/dev_logs/screenshots/YYYY-MM-DD/` 폴더에 저장

#### 방법 B: Antigravity 브라우징 기능 사용 (권장)
```
브라우징 기능을 사용해서 [페이지명] 캡처해줘
```
-   예: "브라우징 기능을 사용해서 로그인 페이지 캡처해줘"
-   AI가 자동으로 스크린샷을 캡처하고 적절한 위치에 저장합니다.

### 2. **스크린샷 파일명 규칙**
-   **영문 소문자 + 언더스코어** 사용
-   **의미 있는 이름** 사용
-   예시:
    -   `login_page.png`
    -   `portfolio_asset_modal.png`
    -   `market_section.png`

### 3. **스크린샷 포함 예시**
```markdown
## 3. 📸 UI 스크린샷

### 로그인 페이지 (Login Page)
![Login Page](screenshots/2026-02-02/login_page.png)

### 회원가입 페이지 (Registration Page)
![Registration Page](screenshots/2026-02-02/register_page.png)
```

---

## ✅ 체크리스트

Push 전에 다음 항목을 확인하세요:

-   [ ] `docs/dev_logs/YYYY-MM-DD_작업내용.md` 파일 생성
-   [ ] 작업 개요, 주요 변경 사항, 결론 작성
-   [ ] UI 변경이 있는 경우 스크린샷 캡처 및 포함
-   [ ] 스크린샷 파일이 `docs/dev_logs/screenshots/YYYY-MM-DD/` 폴더에 저장됨
-   [ ] 커밋 메시지가 명확하고 구체적임
-   [ ] PR 설명에 dev_log 파일 링크 포함

---

## 🚫 금지 사항

-   ❌ **스크린샷 없이 UI 변경 사항 Push 금지**
-   ❌ **"fix stuff", "update" 같은 모호한 커밋 메시지 금지**
-   ❌ **dev_log 없이 PR 생성 금지**
-   ❌ **스크린샷을 임의의 위치에 저장 금지** (반드시 `screenshots/YYYY-MM-DD/` 사용)

---

## 📚 참고 예시

-   [2026-01-27_ui_integration.md](2026-01-27_ui_integration.md)
-   [2026-02-02_auth_fixes.md](2026-02-02_auth_fixes.md)
-   [2026-02-03_screenshot_documentation.md](2026-02-03_screenshot_documentation.md)

---

**✅ 이 가이드를 따르면 팀 전체가 작업 내용을 명확하게 이해하고, UI 변경 사항을 시각적으로 추적할 수 있습니다.**
