# TUTUM 프로젝트 정리

- 작성 목적: 포트폴리오 / 발표 자료용 요약
- 기준 기간: `2026.01 ~ 2026.03`
- 팀 구성: `4명 (프론트엔드 2명, 백엔드 2명)`
- 저장소: `https://github.com/kyk02405/clouddx-project`
- 정리 기준: 팀 전체 프로젝트 설명 + `김경윤 / Kyungyoon Kim / kyungyoonkim` 명의 dev log 기반 개인 기여 요약

---

## 1. 프로젝트명

### TUTUM

AI 기반 통합 자산관리 플랫폼

- 국내 주식, 해외 주식, 코인 자산을 한곳에서 관리
- OCR 기반 자산 등록 자동화
- 실시간 시세, 뉴스, AI 인사이트 제공
- 운영자용 모니터링 대시보드까지 포함한 서비스형 프로젝트

---

## 2. 개요

기존 자산 관리 서비스는 자산 종류별로 앱과 거래소가 분리되어 있고, 사용자가 직접 종목명, 수량, 평단가를 입력해야 하는 불편이 있습니다.  
TUTUM은 이런 문제를 해결하기 위해 자산 통합 조회, OCR 기반 등록, 개인화 뉴스, AI 분석, 관리자 모니터링 기능을 하나의 서비스 흐름으로 묶은 프로젝트입니다.

핵심 목표는 아래와 같습니다.

- 흩어진 자산 데이터를 하나의 포트폴리오 관점에서 통합
- 사용자의 입력 부담을 OCR과 자동화로 최소화
- 실시간 시세와 뉴스 데이터를 바탕으로 AI 기반 해석 제공
- 실제 운영 가능한 수준의 배포, 모니터링, 장애 대응 체계 구축

---

## 3. 주요기능

### 3-1. 자산 통합 관리

- 국내 주식, 해외 주식, 코인을 하나의 포트폴리오로 통합 조회
- 자산별 평가금액, 수익률, 비중을 시각적으로 제공
- 포트폴리오 단위 요약과 상위 수익/손실 자산 확인 가능

### 3-2. OCR 기반 자산 등록

- 보유 자산 캡처 이미지 업로드 후 OCR로 종목/수량/평단가 추출
- 수기 입력 시간을 줄이고 초기 진입 장벽을 낮춤
- Google Vision 기반 OCR API로 구조화된 결과 제공

### 3-3. 실시간 시세 및 차트

- Upbit, KIS 등 외부 시세 소스를 통해 실시간 가격 반영
- Redis 캐시와 캔들 집계 파이프라인으로 빠른 조회 제공
- 종목/코인별 시세 변화와 차트 기반 흐름 확인 가능

### 3-4. AI 포트폴리오 인사이트

- 보유 자산 상태, 현금 비중, 수익/손실 구간을 AI가 요약
- 단순 숫자 나열이 아니라 현재 포트폴리오 상태를 해석해 설명
- 사용자 행동에 도움이 되는 코멘트형 인사이트 제공

### 3-5. AI 챗봇

- 사용자의 자연어 질문을 기반으로 포트폴리오, 시세, 뉴스 컨텍스트를 조합해 답변
- Bedrock Claude + Elasticsearch BM25/kNN + MongoDB fallback 기반 RAG 구조
- 단순 LLM 호출이 아니라 개인 자산과 최신 뉴스 흐름을 함께 반영

### 3-6. 개인화 뉴스 및 데이터 파이프라인

- 뉴스 수집기에서 Naver Finance, Coinness, Einfomax 데이터를 수집
- Kafka 기반으로 MongoDB 원문 저장과 Elasticsearch 색인을 분리
- 사용자 자산과 연관된 뉴스 중심으로 추천 및 AI 응답 근거 제공

### 3-7. 관리자용 모니터링 대시보드

- `/admin` 페이지에서 서비스 상태를 한 화면에서 확인
- Overview, Infra, Pipeline, Data, Backup, Logs, Traces, AI 진단 제공
- 운영자가 Grafana, kubectl, 로그를 오가며 보던 작업을 내부 도구로 통합

---

## 4. 기술스택 및 인프라

### Backend

- `Python`
- `FastAPI`
- `SQLAlchemy Async`, `aiomysql`
- `Motor (MongoDB Async Driver)`
- `Redis`
- `Apache Kafka`
- `Elasticsearch`
- `httpx`, `websockets`
- `OpenTelemetry`
- `Kubernetes Python Client`

### Frontend

- `Next.js 14`
- `TypeScript`
- `React`
- `Tailwind CSS`
- `Radix UI`
- `React Hook Form`
- `Recharts`
- `lightweight-charts`
- `SSE 기반 AI 채팅 UI`

### AI

- `Amazon Bedrock Claude Sonnet 4.6`
- `Amazon Titan Embed Text v2`
- `RAG (Elasticsearch BM25 + kNN)`
- `포트폴리오(MariaDB/MongoDB) + 시세(Upbit/KIS) + 뉴스(MongoDB/ES)` 컨텍스트 조합
- `Bedrock 기반 관리자 AI 진단`

### Data & Storage

- `RDS MariaDB`
  - 사용자, 포트폴리오 등 관계형 데이터
- `MongoDB ReplicaSet`
  - 뉴스 원문, 자산 보조 데이터, 캔들 등 문서형 데이터
- `Redis`
  - 실시간 가격 캐시, 세션, 레이트리밋, 진행 중 캔들
- `Kafka KRaft`
  - 뉴스/시세 비동기 이벤트 버스
- `Elasticsearch`
  - 뉴스 검색, RAG용 하이브리드 검색 인덱스
- `S3`
  - 이미지, 백업, 업로드 파일 저장소

### Infrastructure & Networking

- `AWS ap-northeast-2`
- `VPC`, `Public/Private Subnet`
- `NAT Gateway`
- `Application Load Balancer`
- `Route53`
- `ACM`
- `AWS WAF`
- `EKS`
- `Bottlerocket`
- `Istio`, `Kiali`
- `External Secrets`
- `KEDA`
- `Kyverno`
- `GuardDuty`

### CI/CD

- `GitHub` + `GitLab mirror`
- `GitLab CI/CD`
- `Docker`
- `Amazon ECR`
- `Kustomize`
- `ArgoCD (GitOps)`
- `GitLab Runner`

### Observability

- `Grafana Alloy`
- `Mimir`
- `Loki`
- `Tempo`
- `node-exporter`
- `kafka-exporter`
- `redis-exporter`
- `elasticsearch-exporter`
- `OpenTelemetry`
- `Next.js + FastAPI 기반 내부 Admin 모니터링 대시보드`

---

## 5. 담당역할 및 개발 내용

아래 내용은 팀 전체 기능이 아니라, `김경윤 / Kyungyoon Kim` 작성 dev log를 기준으로 정리한 개인 기여 중심 역할입니다.

### 5-1. AWS 마이그레이션 후 서비스 레벨 안정화

- AWS staging EKS 환경에서 backend/auth/ocr와 프론트 프록시 경로가 실제로 정상 동작하도록 서비스 레벨 경로를 정리
- MongoDB Atlas에서 EKS in-cluster ReplicaSet으로 애플리케이션 데이터 소스를 전환
- `frontend proxy`, `callback redirect`, `ALB target group`, `internal service route` 이슈를 복구
- staging `full down / full up` 운영 스크립트와 runbook을 정리하고 실제 왕복 검증까지 수행

### 5-2. Data Layer 연동 및 정합성 관리

- `MariaDB`를 사용자/포트폴리오 관계형 데이터의 기준 저장소로 운영
- `MongoDB Atlas -> EKS ReplicaSet` cutover를 수행해 문서형 데이터 source of truth를 클러스터 내부로 수렴
- `MariaDB -> MongoDB fallback` 포트폴리오 조회 경로를 정리해 서비스 복원력을 높임
- `Redis`에 실시간 가격 캐시와 `last_good` 백업 구조를 적용해 외부 API 실패 시 0원/빈 응답을 방지
- `MongoDB` 원문 저장소와 `Elasticsearch` 검색 인덱스 역할을 분리하고, backfill과 정합성 점검을 수행

### 5-3. 관리자 모니터링 대시보드 구축

- `/admin` 페이지의 전체 구조 설계 및 백엔드 API 연동
- `Overview / Infra / Pipeline / Data / Backup / Logs / Traces / AI 분석` 흐름 구현
- Mimir, Loki, Tempo, Kubernetes API, Bedrock 진단을 하나의 운영 화면으로 통합
- KPI 카드, 파이프라인 상태, 실시간 로그, 트레이스, 백업 상태 등 운영 지표 가시화
- 운영자가 Grafana, kubectl, 로그 창을 따로 보지 않아도 되도록 내부 도구화

### 5-4. AI 응답 경로 및 뉴스·검색 운영 정합화

- 기존 뉴스 파이프라인의 Kubernetes 이관, worker 설정 정렬, `news-producer` 상시 실행 복구를 수행
- `elastic-consumer` 상시 운영과 Bedrock 임베딩 플래그 정렬로 뉴스 인덱싱 경로를 안정화
- Elasticsearch backfill, consumer warm 유지, MongoDB/Elasticsearch 정합성 점검을 수행
- Bedrock 모델 업그레이드와 런타임 스위치를 반영하고, AI 챗봇의 질문 의도 분석·최신 뉴스 우선 검색·ETF 컨텍스트 보강 로직을 개선
- AI 창 닫힘 후 대화 이력 유지 등 사용자 경험 개선

### 5-5. Backend 보안 및 운영 보호 로직 강화

- Admin API에 CIDR 기반 IP allowlist를 적용해 운영 경로 접근 제어 강화
- 회원가입/로그인/이메일 확인/AI 엔드포인트 rate limit 정책 강화
- Redis 미연결 시 보안·과금 민감 엔드포인트는 fail-open이 아닌 fail-closed로 차단
- trace-aware logging, severity 분류, 운영 경로 보호 로직을 추가해 모니터링 보안성과 운영 대응력을 높임

### 5-6. 비용 최적화 및 운영 자동화

- AWS 비용 급증 원인을 실제 리소스 기준으로 분석
- 미사용 prod EKS/VPC/NAT 제거
- staging only 전략과 `full down / full up` 운영 스크립트 도입
- runbook 작성과 실제 왕복 테스트를 통해 운영 절차 검증

---

## 6. Troubleshooting

### 6-1. Admin KPI가 `N/A`로 표시되던 문제

- 문제
  - `/admin`의 RPS, P95, Error Rate, Kafka Lag 카드가 계속 비어 있었음
- 원인
  - Mimir API 경로 차이
  - exporter scrape annotation 누락
  - metric label 정합성 불일치
- 해결
  - `admin.py`에 Mimir query fallback 추가
  - `kafka-exporter`, `redis-exporter`에 Prometheus annotation 추가
  - Alloy rollout과 쿼리 경로 재검증
- 결과
  - 운영 KPI가 복구되었고, Admin 대시보드가 실시간 운영 지표를 정상적으로 표시

### 6-2. MongoDB Atlas -> EKS ReplicaSet 전환 과정의 데이터 분리 문제

- 문제
  - Atlas와 local Mongo에 데이터가 나뉘어 있어 앱 기준 source of truth가 불명확했음
- 원인
  - 뉴스 일부만 로컬 Mongo에 존재했고, `users/assets/email_verification_tokens` 등 핵심 컬렉션은 Atlas 기준으로 남아 있었음
  - Secrets Manager JSON 형식 이슈로 ExternalSecret 동기화 실패 발생
- 해결
  - Atlas 데이터를 EKS ReplicaSet으로 merge/upsert
  - `backend`, `auth`, `ocr`, worker의 Mongo URI를 in-cluster ReplicaSet으로 통일
  - Secrets Manager 및 rollout 상태까지 재검증
- 결과
  - 채팅, 시세, 인증 경로가 모두 local Mongo 기준으로 수렴

### 6-3. Admin 접근 제어와 인증 엔드포인트 남용 가능성

- 문제
  - 관리자 API는 로그인 검증만으로는 충분하지 않았고, 인증 엔드포인트는 공격 표면이 넓었음
- 원인
  - 이메일 allowlist 방식만으로는 운영 경로 보호가 부족
  - 로그인/회원가입/이메일 확인 API의 rate limit 정책이 약했음
- 해결
  - `X-Real-IP`, `X-Forwarded-For`, client host 기반 IP 추출
  - CIDR 기반 `ADMIN_IP_ALLOWLIST` 적용
  - `login`, `register`, `check-email`, `admin_ai` rate limit 강화
  - Redis 미연결 시 민감 엔드포인트 차단
- 결과
  - 운영 경로 보안이 강화되고 인증 API 남용 리스크를 줄임

### 6-4. AI 답변이 질문 의도와 다르게 흘러가던 문제

- 문제
  - 특정 종목 질문에서도 사용자의 포트폴리오나 BTC 비중이 과하게 반영되어 엉뚱한 방향으로 답변이 새는 현상 발생
  - AI 창을 닫으면 대화 이력이 초기화되는 UX 문제 존재
- 원인
  - 질문 의도 분리 없이 포트폴리오 키워드를 강하게 주입
  - 최근 뉴스 우선순위가 약하고, AI UI 상태가 언마운트 시 사라졌음
- 해결
  - 명시적 종목/ETF 질문 시 포트폴리오 주입 제한
  - `TQQQ`, `QQQ`, `SPY`, `SOXL`, `SOXX` 등 ETF 현재가 컨텍스트 보강
  - 최근 14일 뉴스 우선 검색
  - `sessionStorage` 기반 대화 이력 복원 및 FAB 언마운트 구조 수정
- 결과
  - 답변 관련성이 높아졌고 사용성이 개선됨

### 6-5. AWS 비용 급증과 미사용 리소스 문제

- 문제
  - `2026-03-11` 기준 누적 약 `USD 300`, `2026-03-13` 기준 `USD 446.03`으로 비용이 급증
- 원인
  - `staging EKS + prod EKS + monitoring EC2`가 동시에 비용 발생
  - 공개 서비스는 staging만 사용 중인데도 prod 리소스가 남아 있었음
- 해결
  - 실제 EC2, NAT, VPC, EBS, ALB, Route53 기준 비용 원인 분석
  - prod EKS/VPC/NAT 제거
  - staging 전용 `full down / full up` 운영 스크립트 도입
- 결과
  - 정리 전 `USD 75~80/day` 수준에서 현재 `USD 33.26/day`, full down 운영 시 `USD 7~9/day` 수준까지 절감 가능한 구조 확보

---

## 7. 획득역량

### 7-1. 백엔드 아키텍처 설계 역량

- FastAPI 기반 API, worker, auth, OCR 구조를 서비스 단위로 분리해 설계하고 운영
- 관계형 DB, 문서형 DB, 캐시, 메시징 시스템을 역할에 따라 구분해서 사용
- 단순 CRUD가 아니라 운영성, 복구성, 확장성을 고려한 백엔드 구조 설계 경험 확보

### 7-2. 클라우드 / 쿠버네티스 운영 역량

- EKS, ALB, WAF, Route53, ACM, NAT, VPC Endpoint 등 AWS 네트워크와 배포 구조 이해
- ArgoCD, Kustomize, External Secrets, KEDA를 조합한 GitOps 운영 경험
- Stateful workload(MongoDB/Redis/Kafka/Elasticsearch)와 stateless workload를 분리해 운영하는 감각 확보

### 7-3. Observability / SRE 역량

- Alloy, Mimir, Loki, Tempo, exporter 기반 LGTM 스택 운영 경험
- 메트릭, 로그, 트레이스를 개별 도구가 아니라 서비스 운영 흐름으로 연결해서 이해
- 장애 상황에서 원인 분석, 로그 추적, 지표 복구, 런북 작성까지 수행

### 7-4. 데이터 파이프라인 / RAG 역량

- Kafka 기반 producer-consumer 구조 설계 및 운영
- MongoDB 원문 저장 + Elasticsearch 하이브리드 검색 인덱스 분리 구조 이해
- Titan 임베딩과 Bedrock Claude를 활용한 실제 RAG 서비스 구현 경험 확보

### 7-5. 보안 / 운영 안정화 역량

- IP allowlist, 인증 rate limit, 시크릿 동기화, callback 경로 복구 등 보안성 개선 경험
- 프론트 프록시, 소셜 로그인, ALB 라우팅 이슈를 서비스 관점에서 점검하고 복구하는 경험 축적

### 7-6. 비용 최적화 / 운영 자동화 역량

- 실제 AWS 리소스 비용을 구조 단위로 분석하는 FinOps 관점 습득
- 불필요 리소스 제거, 환경 통합, 스크립트 기반 down/up 운영 자동화 경험
- 비용 절감도 단순 절전이 아니라 아키텍처와 운영 전략의 문제로 바라보는 관점 확보

---

## 8. 정리 근거 dev log (김경윤 / Kyungyoon Kim 작성 기준)

아래 로그들을 중심으로 개인 기여 항목을 정리했습니다.

- `docs/dev_logs/2월_넷째주/2026-02-24_node3_news_pipeline_k8s_manifest_migration.md`
- `docs/dev_logs/2월_넷째주/2026-02-25_cicd_pipeline_and_argocd_fix.md`
- `docs/dev_logs/2월_넷째주/2026-02-25_gitlab_push_trigger_pipeline_fix_and_validation.md`
- `docs/dev_logs/2월_넷째주/2026-02-27_news_embedding_always_on_enablement.md`
- `docs/dev_logs/2월_넷째주/2026-02-27_news_pipeline_chat_endpoint_alignment.md`
- `docs/dev_logs/3월_첫째주/2026-03-03_admin_metrics_pipeline_recovery.md`
- `docs/dev_logs/3월_첫째주/2026-03-05_admin_access_guard_and_auth_ratelimit.md`
- `docs/dev_logs/3월_첫째주/2026-03-06_backup_fix_monitoring_bedrock_upgrade.md`
- `docs/dev_logs/3월_둘째주/2026-03-10_istio_hub_rds_migration_terraform_plan.md`
- `docs/dev_logs/3월_둘째주/2026-03-11_auth_service_eks_deploy.md`
- `docs/dev_logs/3월_둘째주/2026-03-12_bedrock_sonnet_46_runtime_switch.md`
- `docs/dev_logs/3월_둘째주/2026-03-12_mongodb_atlas_to_eks_replicaset_cutover.md`
- `docs/dev_logs/3월_둘째주/2026-03-13_finops_cost_reduction_staging_only_strategy.md`
- `docs/dev_logs/3월_둘째주/2026-03-13_prod_decommission_and_staging_full_down_runbook.md`
- `docs/dev_logs/3월_둘째주/2026-03-14_ai_chat_rag_relevance_and_session_persistence.md`

---

## 9. 포트폴리오용 한 줄 정리

TUTUM 프로젝트에서 백엔드/인프라 담당으로서 `AWS EKS 기반 서비스 전환`, `관리자 모니터링 대시보드 구축`, `Kafka + RAG + Bedrock 기반 AI 파이프라인 고도화`, `인증/보안/운영 안정화`, `비용 최적화 자동화`를 주도적으로 수행했다.
