# K8S 문서 인덱스 (라인 번호 포함)

> 경로: `docs/plans/infra/K8S_MIGRATION_PLAN.md`, `K8S_CICD_LGTM_SETUP_PLAN.md`, `K8S_TECH_STACK.md`

- 목표: 팀원들이 섹션을 **섹션명+라인번호**로 바로 찾을 수 있게 정리
- 라인 이동: `Ctrl+G` (또는 `:번호`)로 바로 이동

## 1) 문서별 빠른 진입

### 1-1. K8S_MIGRATION_PLAN.md

| 주제 | 시작 라인 |
|---|---:|
| AS-IS | 11 |
| TO-BE | 133 |
| 네임스페이스 설계 | 298 |
| 리소스 매핑 | 320 |
| Istio 서비스 메시 | 366 |
| NetworkPolicy | 516 |
| LGTM 스택 | 631 |
| CI/CD 파이프라인 | 898 |
| 아키텍처/배포 흐름(Phase) | 1316 |
| KEDA | 1806 |
| Karpenter | 2026 |
| 운영협업/알림 | 2394 |
| 보안(Trivy/Cosign/Kyverno) | 2600 |
| 부하 테스트 | 2816 |
| MetalLB | 3006 |
| 배포 전략(Canary/Blue-Green) | 3190 |
| Backup/DR | 3421 |
| 참고사항 | 3623 |

### 1-2. K8S_CICD_LGTM_SETUP_PLAN.md

| 주제 | 시작 라인 |
|---|---:|
| 전체 로드맵 | 10 |
| 5대 배치/사양(1-1) | 27 |
| 공통 접속/분담(1-0) | 55 |
| 팀원별 작업분담(1-0-1 ~ 1-0-5) | 65 |
| VM 생성(1-1-1) | 296 |
| 포트포워딩(1-1-2) | 326 |
| 고정 IP(1-1-3) | 410 |
| SSH 확인(1-1-4) | 523 |
| 방화벽(UFW) | 596 |
| VM 간 통신(1-1-6) | 703 |
| 공통셋업(1-2) | 731 |
| Master init(1-3) | 795 |
| Worker join(1-4) | 817 |
| MetalLB(1-6) | 866 |
| Istio 설치(1-8) | 927 |
| Phase 1 완료 검증(1-10/1-11/1-12) | 981 |
| Phase 2(전체) | 1106 |
| GitLab Runner(2-2) | 1186 |
| CI/CD 파이프라인(2-9) | 1537 |
| Phase 2 완료 검증(2-10) | 1749 |
| Phase 3(모니터링) | 1794 |
| Monitoring 구성 검증(3-8) | 2228 |
| E2E 검증 | 2262 |
| 네트워크 포트 정리 | 2287 |
| 주의사항 | 2313 |

### 1-3. K8S_TECH_STACK.md

| 주제 | 시작 라인 |
|---|---:|
| AS-IS/TO-BE 요약 | 7 |
| 한눈에 보기 | 36 |
| 기술 스택 상세 | 80 |
| 클러스터 기반 | 82 |
| 서비스 메시/트래픽 | 91 |
| 오토스케일링 | 99 |
| CI/CD & 보안 | 106 |
| 데이터 레이어 | 119 |
| 모니터링/테스트 | 130 |
| AI | 143 |
| 백업 & DR | 149 |

---

## 2) 팀 역할별 바로 가기(짧은 체크리스트)

### A. 클러스터/HA 담당
1) `docs/plans/infra/K8S_CICD_LGTM_SETUP_PLAN.md:55~280` (분담/조정 모드)
2) `docs/plans/infra/K8S_CICD_LGTM_SETUP_PLAN.md:296~703` (VM/네트워크 기본)
3) `docs/plans/infra/K8S_CICD_LGTM_SETUP_PLAN.md:731~981` (공통셋업~1-10)
4) `K8S_MIGRATION_PLAN.md:1316~1389` (Phase 1 기준 검증)

### B. CI/CD 담당
1) `docs/plans/infra/K8S_CICD_LGTM_SETUP_PLAN.md:1106~1749`
2) `docs/plans/infra/K8S_MIGRATION_PLAN.md:898~1140`
3) `docs/plans/infra/K8S_MIGRATION_PLAN.md:2600~2794` (보안 연동)

### C. 모니터링/알림 담당
1) `docs/plans/infra/K8S_CICD_LGTM_SETUP_PLAN.md:1794~2231`
2) `docs/plans/infra/K8S_MIGRATION_PLAN.md:631~859`
3) `docs/plans/infra/K8S_MIGRATION_PLAN.md:2394~2472`

### D. 아키텍처/운영 정책 담당
1) `docs/plans/infra/K8S_MIGRATION_PLAN.md:42~344`
2) `docs/plans/infra/K8S_MIGRATION_PLAN.md:3421~3623`
3) `K8S_TECH_STACK.md:7~149`

---

## 3) 자주 쓰는 “빠른 검색 키워드”(라인 없이도 찾기 쉬운 용도)

- `Harbor` → `docs/plans/infra/K8S_MIGRATION_PLAN.md:7`, `docs/plans/infra/K8S_CICD_LGTM_SETUP_PLAN.md:1257`, `docs/plans/infra/K8S_TECH_STACK.md:17`
- `MetalLB` → `docs/plans/infra/K8S_CICD_LGTM_SETUP_PLAN.md:866~872`, `docs/plans/infra/K8S_MIGRATION_PLAN.md:3006~3159`
- `KEDA` → `docs/plans/infra/K8S_MIGRATION_PLAN.md:1771~1806`, `docs/plans/infra/K8S_TECH_STACK.md:99`
- `조정 모드` → `docs/plans/infra/K8S_CICD_LGTM_SETUP_PLAN.md:232~280`
- `포트/방화벽` → `docs/plans/infra/K8S_CICD_LGTM_SETUP_PLAN.md:596~698`, `docs/plans/infra/K8S_CICD_LGTM_SETUP_PLAN.md:2287`
