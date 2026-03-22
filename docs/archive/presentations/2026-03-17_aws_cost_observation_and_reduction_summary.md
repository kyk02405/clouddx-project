# TUTUM AWS 비용 관측 및 절감 효과 정리

- 작성일: 2026-03-17
- 목적: 발표 자료에 바로 넣을 수 있도록, AWS 비용이 어디서 발생했고 어떤 조치로 얼마나 줄였는지 실제 수치 중심으로 정리한다.

---

## 1. 핵심 결론

TUTUM은 `prod 제거 + staging 단일화 + full down 운영`을 통해, 정리 전 추정 `USD 75~80/day` 수준의 인프라 런레이트를 현재 라이브 기준 `USD 37.35/day` 수준까지 낮췄다.  
추가로 `full down` 운영까지 적용하면 `USD 7~9/day` 수준까지 내려갈 수 있어, 정리 전 대비 `약 88.8%~90.7%` 절감 가능한 구조를 확보했다.

---

## 2. 실제 비용 관측값과 현재 런레이트

## 2-1. 실제 Billing 관측값

- `2026-03-11` 사용자 확인 기준 3월 누적 비용: `약 USD 300`
- `2026-03-13` AWS Billing 콘솔 스냅샷 기준 3월 누적 비용: `USD 446.03`
- 즉 약 2일 사이 `USD 144`가 추가 발생한 상태에서 비용 원인 분석을 시작했다.

## 2-2. 현재 시점 Billing API 조회 가능 여부

- 현재 AWS 계정 `903913341620`에서는 `ce:GetCostAndUsage`가 조직 정책 `SCP explicit deny`로 차단되어 있다.
- 따라서 오늘 시점의 청구 누적값은 API로 직접 조회하지 못하고, 아래 두 방식으로 발표하는 것이 가장 정확하다.
  - `실제 Billing 누적 관측값`
  - `현재 라이브 리소스 기준 런레이트`

## 2-3. 2026-03-17 현재 라이브 리소스 기준 런레이트

- 기준 리소스
  - EKS node: `13대`ㅁ
  - monitoring EC2: `1대`
  - NAT Gateway: `1개`
  - RDS MariaDB Multi-AZ: `1개`
  - Public IPv4: `3개`
  - gp3 EBS: `1287 GiB`
- 현재 추정 런레이트: `USD 37.35/day`

---

## 3. 현재 비용은 어디서 발생하는가

### 전체 비용 비중

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
| system 노드 `1 x c6g.large` | `USD 1.85/day` | `4.9%` |
| private-ci spot 노드 `1 x m8i-flex.large` | `USD 0.88/day` | `2.4%` |
| private-system spot 노드 `1 x c8i.large` | `USD 0.72/day` | `1.9%` |

### 해석

- 현재 시점 기준 가장 큰 비용 원인은 `EC2 compute`다.
- 그중에서도 `private-data` on-demand 노드 6대가 비용의 중심이다.
- 즉 비용 절감은 결국 `중복 환경 제거`, `worker 노드 수 축소`, `monitoring EC2 중지`, `미사용 시간 full down`이 핵심이었다고 설명할 수 있다.

---

## 4. 왜 비용이 컸는가

### 정리 전 구조

- `staging EKS + prod EKS + monitoring EC2`가 동시에 비용을 발생시키는 구조였다.
- staging에는 app/data/platform 워크로드 때문에 여러 worker node가 상주했다.
- prod는 실제 공개 트래픽이 거의 없는데도 별도 EKS/VPC/NAT 비용을 계속 발생시키고 있었다.
- 미사용 시간에도 EKS worker와 monitoring EC2가 계속 켜져 있었다.

### 정리 전 추정 런레이트

| 구간 | 비용 수준 | 설명 |
|---|---:|---|
| 정리 전 | `USD 75~80/day` | staging EKS + prod EKS + monitoring EC2 동시 운영 |

---

## 5. 어떤 조치를 했는가

### 1. prod 환경 제거

- `tutum-prd-eks` 삭제
- prod VPC 삭제
- prod NAT Gateway `2개` 삭제
- prod CloudWatch EKS log group 삭제

### 2. staging 내부 불필요 리소스 정리

- 실패 상태였던 managed nodegroup `ng-stg-general` 삭제
- 비용만 발생하던 `t3.medium` 2대 제거

### 3. 운영 프로세스에 full down / full up 도입

- `scripts/eks-cost-down.sh`
  - ArgoCD 중지
  - app/data/platform 워크로드 scale 0
  - KEDA pause
  - monitoring EC2 중지
- `scripts/eks-cost-up.sh`
  - monitoring EC2 시작
  - ArgoCD 복구
  - KEDA resume
  - ArgoCD self-heal로 전체 서비스 복구

---

## 6. 그래서 얼마나 줄었는가

### 절감 전후 비교

| 구간 | 비용 수준 |
|---|---:|
| 정리 전 추정 런레이트 | `USD 75~80/day` |
| 현재 라이브 재산정 | `USD 37.35/day` |
| full down 운영 시 | `USD 7~9/day` |

### 절감률

| 비교 기준 | 절감률 |
|---|---:|
| `75/day -> 37.35/day` | `50.2% 절감` |
| `80/day -> 37.35/day` | `53.3% 절감` |
| `37.35/day -> 7/day` | `81.3% 추가 절감` |
| `37.35/day -> 9/day` | `75.9% 추가 절감` |
| `75/day -> 7/day` | `90.7% 절감` |
| `80/day -> 9/day` | `88.8% 절감` |

### 발표용 한 줄 요약

- `현재 구조만으로 약 50~53% 절감`
- `full down까지 적용하면 약 89~91% 절감 가능`

---

## 7. full down 후에도 남는 비용

`full down`을 해도 비용이 0이 되지는 않는다.  
주요 잔존 비용은 아래와 같다.

| 항목 | 추정 비용 |
|---|---:|
| data PVC gp3 (`195 GiB`) | `USD 0.59/day` |
| RDS | `USD 1.25/day` |
| EKS control plane | `USD 2.40/day` |
| NAT Gateway 1개 | `USD 1.49/day` |
| ALB / WAF / Route53 / CloudWatch | `USD 1~3/day` |
| 합계 | `USD 7~9/day` |

---

## 8. PPT에 바로 넣을 문구

### 제목

`AWS FinOps 적용으로 인프라 비용 50% 이상 절감`

### 서브 문구

`prod 제거 + staging only 운영 + full down 자동화`

### 본문 문구

- 기존에는 `staging EKS + prod EKS + monitoring EC2`가 동시에 비용을 발생시키는 구조였다.
- 실제 Billing 기준 `2026-03-11 약 USD 300 -> 2026-03-13 USD 446.03`로 비용 급증을 확인했다.
- 현재 라이브 리소스 기준 비용의 `74.8%`는 EC2 compute이며, 특히 `private-data on-demand 노드 6대`가 가장 큰 비중을 차지한다.
- prod EKS/VPC/NAT 제거, 불필요 nodegroup/EC2 제거, full down 운영 도입으로 현재 런레이트를 `USD 37.35/day` 수준까지 낮췄다.
- full down 운영까지 적용하면 `USD 7~9/day`, 즉 정리 전 대비 `약 88.8%~90.7% 절감` 가능하다.

---

## 9. 발표 시 주의할 점

- `USD 300`, `USD 446.03`은 실제 Billing 누적 관측값이다.
- `USD 37.35/day`, `USD 7~9/day`, 절감률 수치는 현재 라이브 인프라와 dev log 기준으로 계산한 런레이트다.
- 따라서 발표에서는 `실제 Billing 관측값 + 현재 런레이트 재산정값`을 구분해서 말하는 것이 가장 정확하다.

---

## 10. 근거 문서

- [2026-03-13_finops_cost_reduction_staging_only_strategy.md](C:/Users/CloudDX/Documents/GitHub/clouddx-project/backend/docs/dev_logs/3월_둘째주/2026-03-13_finops_cost_reduction_staging_only_strategy.md)
- [2026-03-12_eks_cost_saving_scripts.md](C:/Users/CloudDX/Documents/GitHub/clouddx-project/backend/docs/dev_logs/3월_둘째주/2026-03-12_eks_cost_saving_scripts.md)
- [2026-03-13_prod_decommission_and_staging_full_down_runbook.md](C:/Users/CloudDX/Documents/GitHub/clouddx-project/backend/docs/dev_logs/3월_둘째주/2026-03-13_prod_decommission_and_staging_full_down_runbook.md)
- [2026-03-14_staging_full_down_up_validation_and_final_down.md](C:/Users/CloudDX/Documents/GitHub/clouddx-project/backend/docs/dev_logs/3월_둘째주/2026-03-14_staging_full_down_up_validation_and_final_down.md)
- [2026-03-17_finops_cost_reduction_onepage.md](C:/Users/CloudDX/Documents/GitHub/clouddx-project/backend/docs/presentations/2026-03-17_finops_cost_reduction_onepage.md)
