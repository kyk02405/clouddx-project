# TUTUM 문서 인덱스

프로젝트의 아키텍처, 가이드, 설계 문서를 목적별로 정리했습니다.

## 디렉토리 구조

```
docs/
├── guides/          # 구현·운영 가이드 (AI, K8s, Kafka, OCR, DB)
├── plans/
│   ├── backend/     # 백엔드 아키텍처 설계 문서
│   └── infra/       # 인프라 / 마이그레이션 계획 문서
├── project/         # 프로젝트 로드맵
├── assets/          # 문서용 이미지 및 다이어그램
└── archive/         # 내부 작업 기록 (dev_logs, work-plans 등)
```

---

## AI & 데이터 파이프라인

| 문서 | 설명 |
|------|------|
| [AI 파이프라인 가이드](guides/AI_PIPELINE_GUIDE.md) | 뉴스 수집 → Kafka → MongoDB + ES 임베딩 → RAG 응답 전 구간 |
| [챗봇 RAG 파이프라인 아키텍처](plans/backend/CHATBOT_RAG_PIPELINE_ARCHITECTURE_2026-03-17.md) | 사용자 질문 ~ Bedrock Claude 스트리밍 응답 설계 |
| [Kafka 파이프라인 아키텍처](plans/backend/KAFKA_PIPELINE_ARCHITECTURE_2026-03-17.md) | 뉴스/시세 레인, KEDA 오토스케일링 연동 |
| [포트폴리오 AI 흐름](plans/backend/PORTFOLIO_ANALYSIS_AI_FLOW_2026-03-19.md) | 포트폴리오 분석 AI 플로우 설계 |
| [AI 가이드](guides/AI_GUIDE.md) | Bedrock Claude / Titan Embed 연동 가이드 |

---

## 인프라 & K8s

| 문서 | 설명 |
|------|------|
| [AWS 스테이징 토폴로지](plans/infra/AWS_STAGING_TOPOLOGY_ARCHITECTURE_2026-03-16.md) | AWS 리소스 전체 인벤토리 및 구성 |
| [온프레미스 VM 토폴로지](plans/infra/ONPREM_VM_TOPOLOGY_ARCHITECTURE_2026-03-17.md) | 마이그레이션 전 3-Node VM 구성 |
| [K8s 클러스터 구조 가이드](plans/infra/K8S_CLUSTER_STRUCTURE_GUIDE.md) | 네임스페이스 / 노드 / 워크로드 구성 |
| [K8s 기술 스택](plans/infra/K8S_TECH_STACK.md) | AS-IS → TO-BE 전환 스택 전체 |
| [K8s 가용성 가이드](guides/K8S_AVAILABILITY_GUIDE.md) | PDB, HPA, 헬스체크, 리소스 설정 |
| [K8s 마이그레이션 계획](plans/infra/K8S_MIGRATION_PLAN.md) | 온프레미스 → EKS 마이그레이션 계획 |
| [K8s 마이그레이션 상태](plans/infra/K8S_MIGRATION_STATUS.md) | 마이그레이션 단계별 완료 현황 |
| [K8s CI/CD + LGTM 구성](plans/infra/K8S_CICD_LGTM_SETUP_PLAN.md) | GitLab CI + ArgoCD + LGTM 구성 계획 |
| [Node → K8s 마이그레이션 런북](plans/infra/NODE123_TO_K8S_MIGRATION_RUNBOOK.md) | 실제 마이그레이션 실행 기록 |
| [AWS 마이그레이션 계획](plans/infra/AWS_MIGRATION_PLAN_2026-03-03.md) | AWS 이전 단계별 계획 |
| [AWS 마이그레이션 상세 가이드](plans/infra/AWS_MIGRATION_DETAIL_GUIDE.md) | Phase별 실행 가이드 |
| [Terraform IaC 구현 가이드](plans/infra/D8_TERRAFORM_IAC_IMPLEMENTATION_GUIDE_2026-03-12.md) | EKS / VPC / RDS Terraform 설계 |
| [Kafka 도입 계획](plans/infra/KAFKA_ADOPTION_PLAN.md) | Kafka 도입 배경 및 설계 결정 |
| [DB HA 전략](plans/infra/DB_HA_STRATEGY.md) | MongoDB ReplicaSet / RDS 고가용성 설계 |
| [아키텍처 토폴로지 블루프린트](plans/infra/TOPOLOGY_BLUEPRINT_2026-03-03.md) | 전체 서비스 토폴로지 설계 |
| [아키텍처 스타일 가이드](plans/infra/TOPOLOGY_BLUEPRINT_ARCHSTYLE_2026-03-03.md) | 아키텍처 패턴 및 설계 원칙 |

---

## 운영 가이드

| 문서 | 설명 |
|------|------|
| [관리자 모니터링 가이드](guides/ADMIN_MONITORING_GUIDE.md) | LGTM 대시보드 및 알림 운영 |
| [OCR 빠른 시작](guides/OCR_QUICKSTART.md) | Google Cloud Vision 연동 |
| [OCR 스테이징 복구 가이드](guides/OCR_STAGING_RECOVERY.md) | OCR 서비스 장애 대응 |
| [Kafka 마이그레이션 가이드](guides/KAFKA_MIGRATION_GUIDE.md) | KRaft 전환 가이드 |
| [MongoDB 설정 가이드](guides/MONGODB_SETUP_GUIDE.md) | ReplicaSet 구성 및 Atlas 연동 |
| [캔들 엔진 V2/V3 가이드](guides/CANDLE_ENGINE_V2_V3_GUIDE.md) | 시세 캔들 데이터 처리 엔진 |
| [API 아키텍처 현황](guides/API_ARCHITECTURE_CURRENT.md) | 현재 API 구조 및 라우팅 설계 |

---

## 프로젝트

| 문서 | 설명 |
|------|------|
| [프로젝트 로드맵](project/clouddx-roadmap.md) | 기능 개발 로드맵 |
| [KIS WebSocket 계획](plans/backend/KIS_WEBSOCKET_PLAN.md) | 한국투자증권 WebSocket 연동 설계 |
