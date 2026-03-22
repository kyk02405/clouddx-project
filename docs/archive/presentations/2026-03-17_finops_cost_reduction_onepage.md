# TUTUM 비용 절감 성과 1페이지 PPT 초안

- 작성일: 2026-03-17
- 목적: 발표용 PPT 1페이지에 바로 옮길 수 있도록, 실제 dev log 근거 수치와 구조 변화를 기준으로 비용 절감 스토리를 정리한다.
- 범위: AWS staging/prod 운영 구조, EKS 비용 절감 스크립트, prod 정리, staging full down 운영

---

## 1. 한 줄 요약

TUTUM은 `prod 환경 정리 + staging 단일화 + 미사용 시간 full down 운영`을 통해, 기존 추정 `USD 75~80/day` 수준의 인프라 런레이트를 `USD 33.26/day`까지 낮췄고, full down 운영까지 적용하면 `USD 7~9/day` 수준까지 절감 가능한 구조를 만들었다.

---

## 2. PPT 한 페이지 핵심 메시지

### 슬라이드 제목

`AWS FinOps 적용으로 인프라 비용 구조 개선`

### 슬라이드 부제

`prod 제거 + staging only 운영 + full down 자동화로 일일 런레이트 대폭 절감`

### 슬라이드에 꼭 넣을 숫자 4개

- AWS Billing 누적 비용 스냅샷: `2026-03-13 기준 USD 446.03`
- 문제 인지 시점 누적 비용: `2026-03-11 기준 약 USD 300`
- 정리 전 추정 런레이트: `USD 75~80/day`
- 정리 후 추정 런레이트:
  - 상시 운영 시 `USD 33.26/day`
  - full down 운영 시 `USD 7~9/day`

### 발표에서 강조할 절감 효과

- 정리 조치만 반영: `약 USD 42~47/day 절감`
- full down 운영까지 반영: `정리 전 대비 약 USD 66~73/day 절감 가능`

---

## 3. 2026-03-17 현재 시점 기준 비용 관측 방식

### 직접 Billing 조회 가능 여부

- 현재 AWS 계정 `903913341620`에서는 `ce:GetCostAndUsage`가 `SCP explicit deny`로 막혀 있어, Cost Explorer API로 오늘 시점 청구액을 직접 조회할 수는 없다.
- 따라서 발표에서는 아래 두 가지를 함께 보여주는 방식이 가장 정확하다.
  - `실제 Billing 누적 관측값`: `2026-03-11 약 USD 300`, `2026-03-13 USD 446.03`
  - `현재 라이브 리소스 기준 런레이트`: 현재 실행 중인 리소스를 AWS 가격 API와 인프라 인벤토리로 재산정한 값

### 2026-03-17 라이브 리소스 기준 재산정 결과

- 기준 시각: `2026-03-17 KST`
- 기준 리소스:
  - EKS node `13대`
  - monitoring EC2 `1대`
  - NAT Gateway `1개`
  - RDS MariaDB Multi-AZ `1개`
  - Public IPv4 `3개`
  - gp3 EBS 합계 `1287 GiB`
- 현재 라이브 런레이트 재산정: `약 USD 37.35/day`

### 현재 런레이트 구성 비중

| 항목 | 추정 비용 | 비중 |
|---|---:|---:|
| EC2 compute | `USD 27.94/day` | `74.8%` |
| gp3 EBS (`1287 GiB`) | `USD 3.91/day` | `10.5%` |
| EKS control plane | `USD 2.40/day` | `6.4%` |
| NAT Gateway 1개 | `USD 1.49/day` | `4.0%` |
| RDS MariaDB Multi-AZ | `USD 1.25/day` | `3.3%` |
| Public IPv4 3개 | `USD 0.36/day` | `1.0%` |
| 합계 | `USD 37.35/day` | `100%` |

### EC2 compute 안에서 많이 드는 부분

| 리소스 | 추정 비용 | 전체 대비 |
|---|---:|---:|
| private-data on-demand 노드 `6 x m7i-flex.large` | `USD 16.95/day` | `45.4%` |
| private-app spot 노드 `1 x m8i.xlarge + 3 x m8i.large` | `USD 4.71/day` | `12.6%` |
| monitoring EC2 `1 x m5.large` | `USD 2.83/day` | `7.6%` |
| system node `1 x c6g.large` | `USD 1.85/day` | `4.9%` |
| private-ci spot 노드 `1 x m8i-flex.large` | `USD 0.88/day` | `2.4%` |
| private-system spot 노드 `1 x c8i.large` | `USD 0.72/day` | `1.9%` |

### 해석

- 현재 시점 기준으로는 `EC2 compute`가 비용의 대부분이며, 특히 `private-data` on-demand 노드가 가장 큰 비중을 차지한다.
- 즉 비용 절감 조치의 핵심은 `중복 환경 제거`, `worker node 축소`, `monitoring EC2 중지`, `full down 운영`이었다고 설명하는 것이 가장 설득력 있다.

---

## 4. 왜 비용이 많이 나갔는가

### 기존 구조 문제

- `staging EKS + prod EKS + monitoring EC2`가 동시에 비용을 발생시키는 구조였다.
- staging에는 app/data/platform 워크로드 때문에 여러 worker node가 상주했다.
- prod는 실제 공개 트래픽이 거의 없는데도 별도 EKS/VPC/NAT 비용을 계속 발생시키고 있었다.
- 사용하지 않는 시간에도 EKS worker EC2와 monitoring EC2가 계속 켜져 있었다.

### 비용 증가 신호

- `2026-03-11` 사용자 확인 기준 누적 비용은 약 `USD 300`
- `2026-03-13` AWS Billing 콘솔 기준 누적 비용은 `USD 446.03`
- 즉 약 2일 사이에 `USD 144`가 추가 발생한 상태에서 원인 분석을 시작했다.

---

## 5. 무엇을 어떻게 조치했는가

### 1. 불필요한 prod 환경 제거

- `tutum-prd-eks` 삭제
- prod VPC `vpc-032e15f57dbd8898b` 삭제
- prod NAT Gateway 2개 삭제
- prod CloudWatch EKS log group 삭제
- 실패 상태로 비용만 발생시키던 staging managed nodegroup `ng-stg-general` 삭제
- 불필요한 `t3.medium` 2대 제거

### 2. 운영 구조를 staging 중심으로 재설계

- 공개 서비스 경로가 모두 staging ALB를 바라보는 것을 재검증
- 운영 방향을 `prod 정리 -> staging만 유지 -> 미사용 시간 full down`으로 확정

### 3. 실제 운영 가능한 cost-down / cost-up 절차 구현

- `scripts/eks-cost-down.sh`
  - ArgoCD self-heal 간섭을 막기 위해 ArgoCD부터 중지
  - app/data/platform 워크로드 replicas를 0으로 축소
  - KEDA ScaledObject pause 처리
  - monitoring EC2 중지
- `scripts/eks-cost-up.sh`
  - monitoring EC2 시작
  - ArgoCD 컨트롤 플레인 복구
  - KEDA resume
  - ArgoCD self-heal로 전체 서비스 복구

---

## 6. 실제 수치로 본 비용 절감 결과

### 비용 변화 표

| 구간 | 비용 수준 | 설명 |
|---|---:|---|
| 정리 전 | `USD 75~80/day` | staging EKS + prod EKS + monitoring EC2 동시 운영 추정 |
| 정리 후 상시 운영 | `USD 33.26/day` | prod 제거, staging 단일화 이후 추정 |
| 현재 라이브 재산정 | `USD 37.35/day` | 2026-03-17 실제 실행 중인 리소스 기준 재산정 |
| 정리 후 full down 운영 | `USD 7~9/day` | worker EC2, monitoring EC2 대부분 중지 |

### 절감률로 표현하면

| 비교 기준 | 절감률 |
|---|---:|
| 정리 전 `75/day` -> 현재 라이브 `37.35/day` | `50.2% 절감` |
| 정리 전 `80/day` -> 현재 라이브 `37.35/day` | `53.3% 절감` |
| 현재 라이브 `37.35/day` -> full down `7/day` | `81.3% 추가 절감` |
| 현재 라이브 `37.35/day` -> full down `9/day` | `75.9% 추가 절감` |
| 정리 전 `75/day` -> full down `7/day` | `90.7% 절감` |
| 정리 전 `80/day` -> full down `9/day` | `88.8% 절감` |

### 현재 상시 운영 기준 런레이트 구성

| 항목 | 추정 비용 |
|---|---:|
| EC2 | `USD 24.01/day` |
| gp3 EBS (`1233 GiB`) | `USD 3.75/day` |
| RDS MariaDB Multi-AZ | `USD 1.25/day` |
| EKS control plane 1개 | `USD 2.40/day` |
| NAT Gateway 1개 | `USD 1.49/day` |
| Public IPv4 3개 | `USD 0.36/day` |
| 합계 | `USD 33.26/day` |

### full down 시에도 남는 고정 비용

| 항목 | 추정 비용 |
|---|---:|
| data PVC gp3 (`195 GiB`) | `USD 0.59/day` |
| RDS | `USD 1.25/day` |
| EKS control plane 1개 | `USD 2.40/day` |
| NAT Gateway 1개 | `USD 1.49/day` |
| ALB / WAF / Route53 / CloudWatch | `USD 1~3/day` |
| 합계 | `USD 7~9/day` |

### 해석

- 절감의 핵심은 `리소스 수 축소`와 `가동 시간 축소`를 동시에 적용한 것이다.
- 즉 `환경 자체를 줄인 것(prod 제거)`과 `안 쓸 때 꺼버리는 것(full down)`이 같이 들어가야 큰 절감이 나온다.

---

## 7. 현재 AWS 구조에서 절감 포인트가 생긴 이유

현재 staging 구조는 [AWS_STAGING_TOPOLOGY_ARCHITECTURE_2026-03-16.md](C:/Users/CloudDX/Documents/GitHub/clouddx-project/backend/docs/plans/infra/AWS_STAGING_TOPOLOGY_ARCHITECTURE_2026-03-16.md) 기준으로 다음 특징이 있다.

- 메인 앱은 `EKS` 위에서 구동
- 관계형 데이터는 `RDS MariaDB`
- 객체 저장소는 `S3`
- 관측 스택은 별도 `monitoring EC2`
- 외부 공개 경로는 `ALB + Route53 + WAF`

이 구조에서 비용 절감이 가능한 이유는 다음과 같다.

- EKS app/data 워크로드는 replica 축소로 worker node를 내려 비용을 즉시 줄일 수 있다.
- monitoring은 별도 EC2이므로 서비스 미사용 시간에 완전히 stop 할 수 있다.
- prod 클러스터를 없애면 EKS, NAT, VPC 부가비용이 같이 사라진다.
- 다만 `RDS`, `EKS control plane`, `NAT`, `ALB/WAF/Route53`는 full down 후에도 일부 고정비가 남는다.

즉 이 프로젝트의 FinOps는 단순 인스턴스 다운이 아니라, `아키텍처 구조를 staging 중심으로 단순화하고, 중지 가능한 계층을 운영 프로세스에 편입한 것`이 핵심이다.

---

## 8. PPT 1페이지 배치 예시

### 상단

- 제목: `AWS FinOps 적용으로 인프라 비용 구조 개선`
- 서브 문장: `prod 제거 + staging only 운영 + full down 자동화`

### 좌측

- 문제:
  - `2026-03-13 누적 비용 USD 446.03`
  - `정리 전 런레이트 USD 75~80/day`
- 원인:
  - `prod/staging 동시 운영`
  - `미사용 시간에도 worker/monitoring 상시 가동`

### 중앙

- 조치:
  - `prod EKS/VPC/NAT 제거`
  - `불필요 nodegroup/EC2 제거`
  - `eks-cost-down/up 스크립트 도입`
  - `staging full down 운영 프로세스 확립`

### 우측

- 결과:
  - `USD 75~80/day -> USD 37.35/day`
  - `full down 시 USD 7~9/day`
  - `최대 88.8~90.7% 절감 가능`

### 하단

- 작은 메모:
  - `Cost Explorer API는 SCP로 차단되어 있어, 실제 Billing 스냅샷 + 라이브 런레이트 재산정값을 함께 사용`
  - `RDS, EKS control plane, NAT, ALB/WAF/Route53는 full down 후에도 일부 비용 유지`

---

## 9. 발표 멘트 예시

`저희는 AWS 비용이 급격히 증가한 시점에 실제 리소스 단위로 원인을 다시 분석했습니다. Cost Explorer API는 조직 정책으로 막혀 있어서, 실제 Billing 스냅샷과 현재 라이브 리소스 기준 런레이트를 함께 사용했습니다. 그 결과 정리 전에는 staging EKS, prod EKS, monitoring EC2가 함께 비용을 만들고 있었고, 현재도 라이브 기준으로는 하루 약 37.35달러 수준의 런레이트가 발생하고 있습니다. 이 중 74.8%가 EC2 compute이고, 특히 private-data on-demand 노드가 가장 큰 비중을 차지합니다. 그래서 prod 환경을 제거하고, 불필요 nodegroup과 EC2를 정리했으며, 미사용 시간에는 worker와 monitoring EC2를 함께 내리는 full down 절차를 만들었습니다. 그 결과 정리 전 추정 75에서 80달러 수준 대비 현재는 약 50에서 53% 절감됐고, full down까지 적용하면 약 89에서 91% 수준까지 줄일 수 있는 구조를 확보했습니다.` 

---

## 10. 근거 문서

- [2026-03-13_finops_cost_reduction_staging_only_strategy.md](C:/Users/CloudDX/Documents/GitHub/clouddx-project/backend/docs/dev_logs/3월_둘째주/2026-03-13_finops_cost_reduction_staging_only_strategy.md)
- [2026-03-12_eks_cost_saving_scripts.md](C:/Users/CloudDX/Documents/GitHub/clouddx-project/backend/docs/dev_logs/3월_둘째주/2026-03-12_eks_cost_saving_scripts.md)
- [2026-03-13_prod_decommission_and_staging_full_down_runbook.md](C:/Users/CloudDX/Documents/GitHub/clouddx-project/backend/docs/dev_logs/3월_둘째주/2026-03-13_prod_decommission_and_staging_full_down_runbook.md)
- [2026-03-14_staging_full_down_up_validation_and_final_down.md](C:/Users/CloudDX/Documents/GitHub/clouddx-project/backend/docs/dev_logs/3월_둘째주/2026-03-14_staging_full_down_up_validation_and_final_down.md)
- [AWS_STAGING_TOPOLOGY_ARCHITECTURE_2026-03-16.md](C:/Users/CloudDX/Documents/GitHub/clouddx-project/backend/docs/plans/infra/AWS_STAGING_TOPOLOGY_ARCHITECTURE_2026-03-16.md)

---

## 11. 발표 시 주의할 점

- `USD 446.03`, `USD 300`은 실제 누적 관측값이다.
- `USD 75~80/day`, `USD 33.26/day`, `USD 7~9/day`는 dev log에 정리된 런레이트 추정값이다.
- `USD 37.35/day`는 `2026-03-17` 현재 실행 중인 리소스를 AWS 가격 API와 인벤토리로 재산정한 현재 런레이트다.
- 따라서 발표에서는 `실제 billing 관측값 + 현재 라이브 런레이트 재산정값`으로 구분해서 말하는 것이 가장 정확하다.
