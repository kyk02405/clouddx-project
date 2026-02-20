# 📓 Dev Log — 2026-02-12 ~ 2026-02-19

> **Branch**: `ruby-backup0218`
> **Author**: Ruby Kim
> **Last Updated**: 2026-02-19

## 2026-02-19 (수)

### 🌅 작업 배경

자택에서 작업 중으로 학원 K8s 클러스터 네트워크 접근 불가.
→ **오프라인 전략**: 모든 K8s YAML 파일을 로컬에서 미리 작성하여 Git에 저장.
학원 접속 시 순서대로 `kubectl apply` 예정.

---

### 📁 Step 1: MetalLB & Namespaces (`k8s-manifests/step1-metallb/`)

| 파일                     | 내용                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `01-metallb-ippool.yaml` | IPAddressPool `192.168.56.100-192.168.56.110` + L2Advertisement                                |
| `02-namespaces.yaml`     | `tutum-app`, `tutum-data`, `tutum-storage`, `monitoring`, `argocd`, `kyverno` 6개 네임스페이스 |
| `README.md`              | MetalLB 설치 순서 및 Istio 설치 가이드                                                         |

**핵심 결정사항**:

- MetalLB IP 대역: `192.168.56.100-192.168.56.110` (VirtualBox Host-only 네트워크 대역)
- Ingress 외부 IP: `192.168.56.100` (MetalLB가 자동 할당)

---

### 📁 Step 2: Nginx Ingress (`k8s-manifests/step2-ingress/`)

| 파일                               | 내용                                                              |
| ---------------------------------- | ----------------------------------------------------------------- |
| `01-nginx-ingress-controller.yaml` | Nginx Ingress Controller Deployment + RBAC + LoadBalancer Service |
| `02-app-ingress.yaml`              | `/api/*` → `backend-svc:8000`, `/*` → `frontend-svc:80` 라우팅    |
| `03-app-services.yaml`             | `frontend-svc` (80→3000), `backend-svc` (8000) ClusterIP          |
| `README.md`                        | Ingress 설치 및 테스트 가이드                                     |

**핵심 결정사항**:

- WebSocket 지원을 위한 Ingress 어노테이션 추가 (`proxy-read-timeout: 3600`)
- MetalLB LoadBalancer로 외부 IP 자동 할당

---

### 📁 Step 3: LGTM 모니터링 스택 (`k8s-manifests/step3-lgtm/`)

#### 모니터링 VM (`192.168.56.30`) - Docker Compose

| 서비스   | 포트      | 역할                           |
| -------- | --------- | ------------------------------ |
| Loki     | 3100      | 로그 수집/저장 (30일 보존)     |
| Tempo    | 4317/4318 | 분산 트레이싱 (OTLP gRPC/HTTP) |
| Mimir    | 9009      | 메트릭 저장 (Prometheus 호환)  |
| Grafana  | 3000      | 시각화 대시보드                |
| InfluxDB | 8086      | 시계열 DB (보조)               |

#### K8s 클러스터 - Grafana Alloy DaemonSet

- 모든 노드에서 메트릭/로그/트레이스 수집
- 모니터링 VM(`192.168.56.30`)으로 전송

**핵심 결정사항**:

- Alloy를 DaemonSet으로 배포하여 모든 노드 커버
- Grafana 데이터소스 자동 프로비저닝 설정

---

### 📁 Base 애플리케이션 배포 (`k8s-manifests/base/`)

#### Frontend Deployment

- 이미지: `192.168.56.12:8080/tutum/frontend:latest`
- 레플리카: 2
- `NEXT_PUBLIC_API_URL`: `http://backend-svc:8000`
- `imagePullSecrets`: `harbor-secret`

#### Backend Deployment

- 이미지: `192.168.56.12:8080/tutum/backend:latest`
- 레플리카: 2
- 민감 환경변수: `backend-secret`에서 `secretKeyRef`로 로드
- `imagePullSecrets`: `harbor-secret`

#### Secrets (`base/backend/secret.yaml`)

- **`backend-secret`**: MongoDB URL, MariaDB 자격증명, SECRET_KEY, KIS/Upbit API 키, Google OAuth, AWS Bedrock, MinIO 설정
- **`harbor-secret`**: Harbor 레지스트리 인증 (`kubernetes.io/dockerconfigjson`)

---

### 📁 ArgoCD GitOps (`k8s-manifests/argocd/`)

| 파일                  | 환경               | 동기화 방식             |
| --------------------- | ------------------ | ----------------------- |
| `staging-app.yaml`    | `tutum-staging`    | 자동 (prune + selfHeal) |
| `production-app.yaml` | `tutum-production` | **수동** (운영 안전)    |

- Git 소스: `http://192.168.56.12:8929/root/k8s-manifests.git`
- Staging: `overlays/staging`, Production: `overlays/production`

---

### 📁 Kyverno 보안 정책 (`k8s-manifests/kyverno/`)

- **`cosign-verify-policy.yaml`**: `tutum-app` 네임스페이스에 배포되는 모든 Pod의 이미지는 반드시 Cosign 서명 필요
- `validationFailureAction: Enforce` (미서명 이미지 배포 차단)
- ⚠️ 학원에서 `cosign generate-key-pair` 후 공개키 설정 필요

---

### 📊 Grafana 대시보드 JSON (`step3-lgtm/monitoring-vm/grafana/provisioning/dashboards/`)

#### 1. `tutum-k8s-overview.json` — K8s 클러스터 전체 현황

- Pod 상태 (Running/Failed 카운트)
- 노드 CPU/메모리 사용률
- API 요청 수 (RPS)
- 5xx 에러율
- API 응답 시간 (P50/P95/P99)
- Kafka Consumer Lag
- Backend 로그 (Loki 연동)

#### 2. `tutum-data-layer.json` — 데이터 레이어 모니터링

- Redis 메모리 사용량 / 캐시 히트율 / 연결 수
- Kafka Consumer Lag (토픽별) / 메시지 처리량
- Elasticsearch 인덱싱 처리량 / JVM 힙 메모리

---

### 🖥️ 관리자 대시보드 UI (`frontend/app/admin/page.tsx`)

Next.js 기반 관리자 전용 페이지 (`/admin`) 구현.
Mock 데이터 기반으로 실제 API 연결 없이 동작.

#### 탭 구성

**📊 Overview 탭**

- 요약 카드: 노드 수, Running Pod 수, 총 재시작 횟수, Ingress IP
- 노드 카드: CPU/메모리 게이지 바 (임계값 초과 시 색상 변경)
- 메트릭 스파크라인 차트: API RPS, P95 레이턴시, 에러율, Kafka Lag
- 서비스 상태 그리드: 8개 서비스 상태 표시

**🫛 Pods 탭**

- 네임스페이스 필터 버튼 (all / tutum-app / tutum-data / monitoring / ingress-nginx)
- Pod 목록 테이블: 이름, 네임스페이스, 상태 배지, 재시작 횟수 (>0 시 amber 강조), 노드, Age

**📋 Logs 탭**

- 실시간 로그 스트림 시뮬레이션 (3초마다 새 로그 추가)
- INFO/WARN/ERROR 레벨별 컬러 구분
- 최대 50개 로그 유지 (FIFO)

---

### 📦 Git 커밋 내역 (2026-02-19)

```
9db30c6  feat: add app deployments, secrets, ArgoCD, Kyverno, and Grafana dashboards
a48de83  feat: add admin dashboard UI page (/admin)
```

**총 변경 파일**: 10개 파일, 1,091줄 추가

---

### ✅ 오늘 완료된 작업 체크리스트

- [x] MetalLB IP Pool + L2Advertisement YAML
- [x] 6개 네임스페이스 YAML
- [x] Nginx Ingress Controller YAML (RBAC 포함)
- [x] App Ingress 라우팅 규칙 (WebSocket 지원)
- [x] Frontend/Backend ClusterIP 서비스
- [x] LGTM Docker Compose (Loki/Tempo/Mimir/Grafana/InfluxDB)
- [x] Loki/Tempo/Mimir 설정 파일
- [x] Grafana 데이터소스 자동 프로비저닝
- [x] Grafana Alloy DaemonSet (K8s 클러스터)
- [x] Frontend Deployment (imagePullSecret, 개선된 probe)
- [x] Backend Deployment (Secret 참조, imagePullSecret)
- [x] backend-secret + harbor-secret
- [x] ArgoCD staging/production Application
- [x] Kyverno Cosign 이미지 서명 검증 정책
- [x] Grafana 대시보드 프로비저닝 설정
- [x] K8s Overview 대시보드 JSON
- [x] Data Layer 대시보드 JSON
- [x] 관리자 대시보드 UI (`/admin` 페이지)

---

### 🔜 다음 작업 (학원 접속 시)

1. **K8s 클러스터 연결 확인** (`kubectl get nodes`)
2. **Step 1 실행**: MetalLB 설치 → IP Pool 적용 → 네임스페이스 생성
3. **Step 2 실행**: Nginx Ingress Controller 설치 → 서비스/Ingress 적용
4. **Step 3 실행**: 모니터링 VM에 Docker Compose 배포 → Alloy DaemonSet 적용
5. **Cosign 키 쌍 생성** 및 Kyverno 정책 공개키 설정
6. **ArgoCD 설치** 및 Application 적용
7. **Grafana 대시보드** 자동 로드 확인
