# CloudDX (Tutum) - AI 기반 자산 관리 플랫폼

주식과 암호자산을 한곳에서 관리하고, 시세·뉴스·알림·AI 인사이트를 통해 포트폴리오를 더 빠르게 이해하는 통합 플랫폼입니다.

---

**핵심 가치**
- 단일 대시보드에서 자산 현황과 시세 흐름을 즉시 파악
- 실시간 시세/뉴스 연동과 자동 알림
- OCR 기반 자산 입력 및 AI 분석 기반 인사이트 확장

---

**아키텍처 개요**
- Frontend: Next.js 14 App Router, TypeScript, Tailwind
- Backend: FastAPI, MongoDB, Redis(옵션), 외부 시세/뉴스 API 연동
- Worker: 시세/뉴스 수집 및 알림 동기화 작업
- OCR API: Google Vision 기반 자산 인식 서브서비스

---

**프로젝트 구조**
```text
clouddx-project/
  backend/                FastAPI 백엔드
    app/                  API 본체, 라우터, 서비스, 모델
    app/ocr-api/           OCR API 서브서비스
    workers/              시세/뉴스 수집 워커
  frontend/               Next.js 프론트엔드
    app/                  App Router 페이지
    components/           UI 컴포넌트
    public/               정적 리소스 및 샘플 데이터
    scripts/              데이터 수집 스크립트
  docs/                   문서 및 개발 로그
  infra/                  인프라 구성(하버, 키바나 등)
  .env.example            환경 변수 예시
  QUICKSTART.md           빠른 시작 가이드
  MONGODB_ATLAS_SETUP.md  MongoDB Atlas 설정 가이드
```

---

**빠른 시작**
1. 저장소 클론
```bash
git clone https://github.com/kyk02405/clouddx-project.git
cd clouddx-project
```

2. 백엔드 실행
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
로컬 확인: `http://localhost:8000/docs`

3. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```
로컬 확인: `http://localhost:3000`

---

**환경 변수**
- 기본 템플릿: `.env.example`
- 백엔드에서 사용: `backend/.env`
- OCR/외부 API 키는 별도 보관 후 로컬 환경에만 주입 권장

---

**주요 기능**
- 인증: JWT, OAuth (Google/Naver/Kakao)
- 자산 관리: CSV 업로드, 직접 입력, 포트폴리오 조회
- 시세/뉴스: KIS, Upbit 연동 및 시장 스냅샷 제공
- 알림: 가격 변화 기반 알림 동기화
- OCR: 이미지 기반 자산 자동 인식 서브서비스
- AI: 투자 인사이트 및 요약 프리뷰

---

**관련 문서**
- 전체 문서: `docs/README.md`
- 로드맵: `docs/clouddx-roadmap.md`
- 작업 규칙: `docs/00_COLLABORATION_RULES.md`
- OCR 가이드: `docs/OCR_QUICKSTART.md`

---

**개발 메모**
- 프론트: `frontend/package.json`의 `dev`, `build`, `lint` 스크립트 사용
- 백엔드 테스트: `backend` 및 루트의 `test_*.py` 참고
- 인프라 샘플: `infra/harbor`, `infra/kibana`

