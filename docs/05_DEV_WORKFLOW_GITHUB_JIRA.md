# 05_DEV_WORKFLOW.md

Dev Workflow (GitHub + Jira) — CovaEX / InfraForge

목표:

- Jira(KAN-xx) 기반으로 작업을 쪼개고 PR 단위로 안전하게 통합
- Infra(AWS/Terraform/EKS) + App(UI/Realtime/Auth)를 병렬로 진행
- main 브랜치는 “최종본만” 유지하고, 중간 통합은 develop에서 수행

- 순서: 브랜치 생성 → 작업 → 커밋 → push → PR

---

## Team Repository

- https://github.com/kyk02405/clouddx-project
- my account: jhnet00@naver.com

---

## Security Rules (MUST)

- 토큰/비밀번호/키/쿠키 등 **비밀정보를 문서/코드/스크린샷에 절대 저장 금지**
- `.env` 실파일 커밋 금지 (`.env.example`만 허용)
- AWS Access Key 하드코딩 금지 (가능하면 Role/IRSA/Secrets 사용)
- PR에 “How to test”와 검증 로그/스크린샷 포함

---

## Repo Strategy

### Option A (Recommended): 2 repos (추후 분리 가능)

1. covaex-app

- Next.js UI + FastAPI 등 서비스 코드
- local docker compose / dev tooling

2. covaex-infra

- Terraform + Helm/K8s manifests + Argo CD apps
- GitOps 관점에서 인프라 변경 이력 분리/감사 용이

현재는 단일 repo로 시작해도 되고, 안정되면 2-repo로 분리한다.

---

## Branch Strategy (Develop-based branching)

브랜치 구조는 반드시 **develop에서 feature가 뻗어나오도록** 운영한다.

### Branch Roles

- `main`

  - production-ready / 최종 데모/릴리즈 브랜치
  - Direct push 금지 (필요 시 보호 규칙 설정)
  - 오직 `develop → main` PR로만 반영

- `develop`

  - integration(dev) 브랜치
  - 모든 feature 작업이 PR로 여기 합쳐진다

- `feature/KAN-<id>-short-desc`

  - Jira 이슈 단위 작업 브랜치
  - 반드시 최신 develop에서 분기

- `hotfix/KAN-<id>-short-desc`
  - main 긴급 수정(필요할 때만)

### Examples

- feature/KAN-92-main-layout
- feature/KAN-83-alb-controller
- feature/KAN-97-guest-watchlist-local
- hotfix/KAN-120-ingress-redirect-fix

---

## Jira Issue Key Rules (KAN 기준)

- 브랜치명에 Jira Key 포함
- 커밋 메시지에 Jira Key 포함
- PR 제목에 Jira Key 포함

Commit message example:

- `KAN-92: main layout skeleton`

PR title example:

- `KAN-92 Main page layout skeleton`

---

## Recommended Commands

### Create a feature branch from develop (MANDATORY)

```bash
git fetch origin
git checkout develop
git pull origin develop

git checkout -b feature/KAN-92-main-layout

git add .
git commit -m "KAN-92: main layout skeleton"

git push -u origin feature/KAN-92-main-layout
```

### Push to existed feature branch

```bash
git add .
git commit -m "KAN-92: main layout skeleton"
git push
```
