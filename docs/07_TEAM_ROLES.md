# Team Roles (4 People, Everyone Builds AWS/Infra)

## 공통 원칙 (강제)

- 모든 사람은 **Cloud/AWS/Infra 업무를 반드시 수행**한다.
  - 각자 최소:
    - Terraform PR 1개 이상 (VPC/EKS/ALB/RDS/Redis/SQS 중 최소 1개)
    - Kubernetes/Ingress PR 1개 이상 (Ingress/Service/Deployment/Helm/Controller 중 최소 1개)
    - 운영(Observability/CI/CD/Security) PR 1개 이상
- “내 영역만” 금지:
  - 모든 Epic에 최소 2명이 동시에 들어가도록(페어/리뷰/교차 담당)
- PR Rule:
  - PR에는 반드시: Jira Key, What/Why, How to Test, Screenshot(해당 시) 포함
  - Secrets 금지 (env.example + GitHub Secrets/IRSA로만)

---

## Role A: Cloud Architecture & GitOps Lead (클라우드 아키텍처/배포 총괄)

### Primary Responsibilities

- To-Be v1/v2 토폴로지 설계 리드 (Hybrid → EKS 전환 로드맵 포함)
- Terraform 모듈 구조/상태관리(S3 backend, locking 전략) 확정
- Argo CD 기반 GitOps CD 설계/운영 정책(autosync/rollback)

### Must Own (본인 오너로 끝내야 하는 것)

- AWS VPC/서브넷/라우팅/NAT 최소비용 설계 문서 1개
- EKS + ALB Controller 설치 및 dev Ingress 검증
- Argo CD 설치 + Dev/Prod 환경 전략 초안

### Infra Contributions (필수 체크리스트)

- [ ] Terraform PR 1+
- [ ] EKS/Ingress PR 1+
- [ ] GitOps/Release PR 1+

---

## Role B: Reliability & Data Plane Engineer (정합성/데이터 경로/장애대응)

> “백엔드”가 아니라 **정합성과 장애대응(운영 안정성)** 중심의 역할로 정의한다.

### Primary Responsibilities

- 데이터 저장/정합성 정책: DB 스키마 초안, 트랜잭션 경계, 동기화 정책(guest→server)
- 장애/재시도/롤백 시나리오를 “운영 가능한 문서”로 정리
- API 설계는 “기능 구현”이 아니라 **정책/계약/안정성** 중심으로 리드

### Must Own

- RDS(Postgres) 구성 정책(backup/retention/maintenance) 문서화
- guest watchlist → login 후 sync 정책(merge rule, 정리 rule) 확정
- Runbook 1개(예: DB 장애/배포 롤백/로그로 원인 파악 흐름)

### Infra Contributions (필수 체크리스트)

- [ ] Terraform PR 1+ (RDS/SG/IAM 중 하나)
- [ ] EKS/Ingress PR 1+ (서비스 배포/네임스페이스/RBAC 중 하나)
- [ ] Observability/Security PR 1+ (알람/대시보드/권한 설계 중 하나)

---

## Role C: Real-time Platform & Observability Engineer (실시간/관측/성능)

> “실시간 데이터 파이프라인” + “가시성 부족 해결”을 함께 책임진다.

### Primary Responsibilities

- Binance WS → cache(redis) → ws broadcast 설계(속도 경로)
- 관측(메트릭/로그/알람/대시보드) 리드: “왜 느려졌는지”를 보여줄 수 있어야 함
- 성능/재연결/폭주 대비(간단한 정책/리밋/샘플링) 정리

### Must Own

- Redis key/pubsub channel 규약 + SSR cached snapshot 정책 고정
- Prometheus/Grafana 대시보드 항목 정의 + 데모 시나리오(부하→스케일/그래프)
- CloudWatch 로그/알람 초안(5xx/latency 등)

### Infra Contributions (필수 체크리스트)

- [ ] Terraform PR 1+ (Redis/CloudWatch/IAM 중 하나)
- [ ] EKS/Ingress PR 1+ (ALB Ingress/WS 경로 검증 등)
- [ ] Observability PR 1+ (대시보드/알람/메트릭 정의)

---

## Role D: Product Delivery & UI Systems Engineer (UI 시스템/개발경험/릴리즈 품질)

> “프론트엔드” 대신 **제품 전달(Delivery) + UI 시스템 + DX/릴리즈 품질**을 책임진다.  
> 단, 반드시 AWS/Infra도 같이 한다.

### Primary Responsibilities

- Figma 기반 Main Page UI 시스템(Quick bar/panel/검색/프로필) 구현 리드
- 비로그인 임시저장 UX(관심/Watchlist)를 제품 관점에서 완성
- CI 품질 게이트/릴리즈 태그 전략/PR 템플릿 등 “팀 생산성” 강화

### Must Own

- Main Page MVP 데모 완성(Quick bar + panels + keyword blocks + coin list + guest watchlist)
- GitHub Actions CI(체크 필수화) + PR 템플릿/스크린샷 룰 확정
- ECR/이미지 태그 규칙(sha/semver) 및 배포 연결 정책 문서화

### Infra Contributions (필수 체크리스트)

- [ ] Terraform PR 1+ (ECR/Route53/ACM 중 하나)
- [ ] EKS/Ingress PR 1+ (frontend 서비스/Ingress 규칙 검증 등)
- [ ] CI/CD PR 1+ (actions/required checks/release policy)

---

## Cross-Ownership Matrix (겹치게 설계: “다 같이 AWS 만지기”)

- VPC/네트워크: A(오너) + B(리뷰)
- RDS/데이터 정책: B(오너) + A(리뷰)
- Redis/WS/실시간: C(오너) + B(리뷰)
- Ingress/HTTPS/도메인: A(오너) + D(리뷰/검증)
- CI/릴리즈/태그: D(오너) + A(리뷰)
- Observability: C(오너) + A(리뷰)

---

## Pairing / Review Rule (강제)

- 모든 PR은 **오너 1 + 리뷰어 1** (최소 2인 참여)
- 리뷰어는 “같은 역할”이 아니라 **다른 역할**에서 지정 (교차 지식 공유 목적)
- UI 변경 PR: D 작성, C 또는 A 리뷰(성능/운영 관점 포함)
- Data/Policy PR: B 작성, D 리뷰(UX 플로우 검증)
- Infra PR: A 작성, B 또는 D 리뷰(보안/릴리즈 관점 검증)
- Observability PR: C 작성, A 리뷰(운영 시나리오 점검)

---

## 개인별 “필수 산출물” 체크 (스프린트 종료 조건)

- 각자 아래 3개를 만족하지 못하면 “완료”로 간주하지 않는다.

1. Infra PR 1개 이상 (Terraform)
2. K8s/Ingress PR 1개 이상
3. Ops PR 1개 이상 (CI/CD 또는 Observability 또는 Security)
