# Jira Backlog (Infra-focused + Parallel Delivery)

Project: CovaEX / Scenario: InfraForge가 온프레미스(Private 성격 유지)를 저비용으로 점진 개선

> 원칙

- Epic > Task > Sub-task만 사용
- Infra/Cloud/AWS가 메인 서사
- App(UI/Realtime/Auth)는 병렬 트랙으로 진행하되 “데모 가치” 중심으로 최소 단위 유지
- Not logged-in: watchlist 임시저장 허용(local) + login 시 sync

---

## EPIC 1: As-Is Investigation & Topology Baseline

목표: 현재 증상/리스크/As-Is 토폴로지를 발표 가능한 형태로 확정

### Task: Problem statements 1pager

- Sub-task: Extract key symptoms
- Sub-task: Define risk list

### Task: As-Is topology narrative

- Sub-task: As-Is diagram text spec
- Sub-task: As-Is SPOF explanation

### Task: Improvement priorities

- Sub-task: Priority matrix
- Sub-task: Success metrics

---

## EPIC 2: To-Be v1 Hybrid Cloud Foundation (Low-cost)

목표: 완전 전환이 아니라 Private 성격 유지 + 저비용 클라우드 도입 기반(2AZ VPC + ALB/ASG + RDS Multi-AZ)

### Task: VPC 2AZ subnet plan

- Sub-task: CIDR planning
- Sub-task: Route tables

### Task: ALB + ASG baseline

- Sub-task: ALB listeners
- Sub-task: ASG scaling policy

### Task: RDS MultiAZ baseline

- Sub-task: RDS backup policy
- Sub-task: DB access SG

### Task: SG tiers + IAM least privilege

- Sub-task: SG matrix
- Sub-task: IAM roles draft

### Task: Terraform repo skeleton

- Sub-task: Repo layout
- Sub-task: State backend

---

## EPIC 3: Platform v2 EKS + GitOps Enablement

목표: To-Be v1 위에 컨테이너 운영(EKS)과 표준 배포 기반 추가 (점진 개선 스토리 강화)

### Task: EKS cluster baseline

- Sub-task: EKS nodegroup sizing
- Sub-task: IRSA basics

### Task: EKS ALB controller baseline

- Sub-task: Install controller
- Sub-task: Ingress test

### Task: ECR and tag strategy (optional but recommended)

- Sub-task: Tag convention
- Sub-task: No secrets rule

---

## EPIC 4: Observability & Ops Readiness

목표: “왜 터졌는지 설명 가능”하게 로그/메트릭/알람/대시보드 + Runbook 준비

### Task: CloudWatch logs baseline

- Sub-task: Log retention
- Sub-task: Alarm baseline

### Task: Prometheus Grafana baseline

- Sub-task: Install stack
- Sub-task: Demo dashboard items

### Task: Runbook draft

- Sub-task: Rollback via git revert
- Sub-task: Incident narrative

---

## EPIC 5: CI Pipeline & Release Flow

목표: PR 품질 게이트 + 빌드/태그/릴리즈 흐름 준비 (GitOps로 이어지게)

### Task: App CI quality gate

- Sub-task: Frontend CI checks
- Sub-task: Backend CI checks

### Task: Docker build tag policy

- Sub-task: Tag convention (if not done in EPIC3)
- Sub-task: No secrets rule (if not done in EPIC3)

---

## EPIC 6: CD ArgoCD & Environment Strategy

목표: infra-repo 기반 배포 자동화, dev/prod 전략, 롤백 가능

### Task: ArgoCD install and access

- Sub-task: Argo install
- Sub-task: RBAC baseline

### Task: Dev Prod environment strategy

- Sub-task: Namespaces
- Sub-task: Sync policy

### Task: GitOps image update flow

- Sub-task: Image update approach
- Sub-task: Rollback rule

---

## EPIC 7: App UI MVP Main Page (CovaEX Figma)

목표: Toss 스타일 메인 화면 + Quick bar 패널 + 검색/프로필 흐름
정책: 비로그인 상태에서도 watchlist 임시저장 허용

### Task: Main page layout skeleton

- Sub-task: Header skeleton
- Sub-task: Not logged in gating

### Task: Quick bar and panels

- Sub-task: Panel component
- Sub-task: Panel placeholders

### Task: Coin list and keyword blocks

- Sub-task: Coin list items
- Sub-task: Keyword blocks

---

## EPIC 8: Realtime Market Data Path

목표: Binance WS -> Cache -> WS -> Browser
원칙: SSR은 반드시 cached snapshot만 사용 (요청당 WS 금지)

### Task: Redis cache contract

- Sub-task: Redis key rules
- Sub-task: SSR cached snapshot

### Task: WS gateway contract

- Sub-task: WS subscribe contract
- Sub-task: Ingress WS routing notes

---

## EPIC 9: Auth & Guest Policy

목표: 로그인/가드 + 비로그인 임시저장 + 로그인 후 sync 정책 확정

### Task: Guest watchlist local policy

- Sub-task: Local schema
- Sub-task: Local persistence

### Task: Login sync policy

- Sub-task: Sync merge rule
- Sub-task: Cleanup after sync
