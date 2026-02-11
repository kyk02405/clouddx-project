# CloudDX Kubernetes 마이그레이션 계획서

> 작성일: 2026-02-10
> 현재 상태: Docker Compose 기반 3-Node VM 운영
> 목표 상태: Kubernetes 클러스터 + Istio + LGTM + GitOps + KEDA + Karpenter

---

## 1. 현재 아키텍처 (AS-IS)

```
┌─────────────────────────────────────────────────────────────┐
│                    VirtualBox 3-Node 구성                     │
│                                                             │
│  Node1 (4GB/2Core)    Node2 (4GB/2Core)   Node3 (8GB/3Core) │
│  ┌─────────────┐     ┌──────────────┐    ┌──────────────┐  │
│  │ Nginx       │     │ Redis        │    │ Elasticsearch│  │
│  │ Frontend    │     │ MinIO        │    │ Kafka        │  │
│  │ Backend     │     │ Harbor       │    │ Zookeeper    │  │
│  └─────────────┘     └──────────────┘    │ Workers      │  │
│                       MongoDB Atlas       └──────────────┘  │
│                     (임시, K8s에서 로컬 전환)                  │
└─────────────────────────────────────────────────────────────┘
```

**현재 구성 요소:**
- Frontend: Next.js (포트 3000)
- Backend: FastAPI (포트 8000)
- Nginx: 리버스 프록시 (포트 80/443)
- MongoDB: Atlas Cloud (외부 SRV)
- Redis: 캐싱/세션 (포트 6379)
- Kafka + Zookeeper: 메시지 브로커
- Elasticsearch + Kibana: 검색/로그
- MinIO: 오브젝트 스토리지
- Harbor: 컨테이너 레지스트리
- Workers: price_producer, news_producer, indexer_consumer, price_consumer

---

## 2. MSA 아키텍처 패턴 선택

### 2.1 후보 패턴 비교

| 패턴 | 통신 방식 | 데이터 일관성 | 복잡도 | CloudDX 적합도 |
|------|----------|-------------|--------|---------------|
| **API Gateway + BFF** | 동기 (REST/gRPC) | 강한 일관성 | 낮음 | 부분 적합 |
| **Choreography (이벤트 기반)** | 비동기 (이벤트 브로커) | 최종 일관성 | 중간 | **적합** |
| **Orchestration (Saga)** | 동기+비동기 혼합 | 보상 트랜잭션 | 높음 | 과도 |
| **CQRS + Event Sourcing** | 명령/조회 분리 | 이벤트 소싱 | 매우 높음 | 과도 |

### 2.2 선택: Choreography 기반 이벤트 드리븐 MSA

```
┌─────────────────────────────────────────────────────────────────┐
│             Choreography Event-Driven MSA                        │
│                                                                 │
│  ┌──────────┐    REST/SSE     ┌──────────┐                     │
│  │ Frontend │ ◄─────────────▶ │ Backend  │                     │
│  │ (Next.js)│                 │ (FastAPI) │                     │
│  └──────────┘                 └─────┬────┘                     │
│                                     │                           │
│                                     │ Produce / Consume         │
│                                     ▼                           │
│                            ┌────────────────┐                   │
│                            │     Kafka      │                   │
│                            │  (Event Bus)   │                   │
│                            └───┬────┬───┬───┘                   │
│                                │    │   │                       │
│                    ┌───────────┘    │   └───────────┐           │
│                    ▼                ▼               ▼           │
│             ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│             │   Price    │  │    News    │  │  Indexer   │     │
│             │  Consumer  │  │  Producer  │  │  Consumer  │     │
│             │ → Redis    │  │ → Kafka    │  │ → ES       │     │
│             └────────────┘  └────────────┘  └────────────┘     │
│                                                                 │
│  각 서비스는 독립적으로 이벤트를 발행/구독하며                       │
│  중앙 오케스트레이터 없이 자율적으로 동작                            │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 선택 근거

**1. 기존 아키텍처와의 정합성**
- Kafka가 이미 메시지 브로커로 도입되어 있음
- Workers(price_producer, news_producer, indexer_consumer, price_consumer)가 이미 이벤트 기반으로 동작
- 추가 인프라 없이 현재 구조를 자연스럽게 MSA로 확장 가능

**2. 서비스 간 결합도**
- Orchestration(Saga)는 중앙 조율자가 필요 → 단일 장애점(SPOF)
- Choreography는 각 서비스가 자율적으로 이벤트를 발행/구독 → 느슨한 결합
- CloudDX의 데이터 흐름(시세 수집 → 캐싱 → 조회)은 단방향 파이프라인이므로 보상 트랜잭션이 불필요

**3. 복잡도 대비 효과**
- CQRS + Event Sourcing은 이벤트 저장소, 프로젝션 재구축 등 운영 복잡도가 매우 높음
- CloudDX 규모(서비스 5~7개)에서는 과도한 엔지니어링
- Choreography는 Kafka 토픽 설계만으로 충분한 이벤트 흐름 관리 가능

**4. 확장성**
- 새로운 Consumer 추가 시 기존 서비스 수정 불필요 (토픽 구독만 추가)
- KEDA와 연동하여 이벤트 볼륨에 따라 Consumer를 자동 스케일링
- 향후 AWS 마이그레이션 시 MSK(Managed Kafka)로 자연스럽게 전환 가능

### 2.4 서비스 분리 단위

| 서비스 | 역할 | 통신 방식 | 데이터 저장소 |
|--------|------|----------|-------------|
| Frontend | UI 렌더링, BFF 역할 | REST → Backend | - |
| Backend (API) | 인증, 자산 CRUD, 시세 조회 | REST + SSE(채팅) | MongoDB, Redis |
| Price Producer | 외부 시세 수집 → Kafka 발행 | Kafka Produce | 외부 API (KIS, Upbit) |
| Price Consumer | Kafka 시세 → Redis 캐싱 | Kafka Consume | Redis |
| News Producer | 뉴스 수집 → Kafka 발행 | Kafka Produce | 외부 API |
| Indexer Consumer | Kafka 뉴스 → ES 인덱싱 | Kafka Consume | Elasticsearch |
| Chat Service | AI 채팅 (Bedrock) | SSE Stream | Bedrock, ES(RAG) |

### 2.5 Kafka 토픽 설계

| 토픽 | Producer | Consumer | 파티션 | 용도 |
|------|----------|----------|--------|------|
| `prices` | price_producer | price_consumer | 3 | 실시간 시세 |
| `news` | news_producer | indexer_consumer | 3 | 뉴스 데이터 |
| `alerts` | backend | (향후) notification | 1 | 가격 알림 |
| `audit` | backend | (향후) audit_consumer | 1 | 거래 감사 로그 |

---

## 3. 목표 아키텍처 (TO-BE)

```
                         ┌──────────────────────────┐
                         │      GitLab CI/CD        │
                         │  ┌────────┐ ┌─────────┐  │
                         │  │SonarQube│ │ Harbor  │  │
                         │  └────┬───┘ └────┬────┘  │
                         │       │          │       │
                         └───────┼──────────┼───────┘
                                 │          │
                         ┌───────▼──────────▼───────┐
                         │       ArgoCD             │
                         │   (GitOps Controller)    │
                         └───────────┬──────────────┘
                                     │ sync
         ┌───────────────────────────▼──────────────────────────────┐
         │                 Kubernetes Cluster                        │
         │                                                          │
         │  ┌──────────────────────────────────────────────────┐   │
         │  │              Istio Service Mesh                   │   │
         │  │                                                   │   │
         │  │  ┌─────────────────────────────────────────────┐ │   │
         │  │  │         Istio Ingress Gateway               │ │   │
         │  │  │         (외부 트래픽 진입점)                   │ │   │
         │  │  └────────────┬────────────────┬───────────────┘ │   │
         │  │               │                │                  │   │
         │  │    ┌──────────▼──┐   ┌────────▼────────┐        │   │
         │  │    │  Frontend   │   │    Backend      │        │   │
         │  │    │  (Next.js)  │   │   (FastAPI)     │        │   │
         │  │    │  Deployment │   │   Deployment    │        │   │
         │  │    │  x2 replicas│   │   x3 replicas   │        │   │
         │  │    └─────────────┘   └──┬──────┬───────┘        │   │
         │  │                         │      │                 │   │
         │  │    ┌────────────────────┘      └──────────┐     │   │
         │  │    │                                       │     │   │
         │  │    ▼                                       ▼     │   │
         │  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
         │  │  │  Redis   │  │  Kafka   │  │Elasticsearch │  │   │
         │  │  │StatefulSet│ │StatefulSet│ │ StatefulSet  │  │   │
         │  │  └──────────┘  └──────────┘  └──────────────┘  │   │
         │  │  ┌──────────┐  ┌──────────┐                    │   │
         │  │  │ MongoDB  │  │  Harbor  │                    │   │
         │  │  │StatefulSet│ │StatefulSet│                    │   │
         │  │  └──────────┘  └──────────┘                    │   │
         │  │                     │                            │   │
         │  │              ┌──────▼──────┐                    │   │
         │  │              │   Workers   │  ◄── KEDA          │   │
         │  │              │ ScaledObject│  (이벤트 기반       │   │
         │  │              │ Kafka Lag   │   오토스케일링)      │   │
         │  │              └─────────────┘                    │   │
         │  └──────────────────────────────────────────────────┘   │
         │                                                          │
         │  ┌──────────────────────────────────────────────────┐   │
         │  │     Grafana Alloy (DaemonSet, 클러스터 내부)       │   │
         │  │     메트릭/로그/트레이스 수집 → 외부 LGTM 전송      │   │
         │  └────────────────────────┬─────────────────────────┘   │
         │                           │                              │
         │  ┌──────────────────────────────────────────────────┐   │
         │  │          Auto Scaling Layer                       │   │
         │  │                                                   │   │
         │  │  ┌──────────────┐       ┌────────────────────┐   │   │
         │  │  │    KEDA      │       │    Karpenter       │   │   │
         │  │  │ (Pod Scaling │       │  (Node Scaling     │   │   │
         │  │  │  이벤트 기반) │       │   워크로드 기반)    │   │   │
         │  │  └──────────────┘       └────────────────────┘   │   │
         │  └──────────────────────────────────────────────────┘   │
         │                                                          │
         │  ┌──────────────────────────┐                           │
         │  │   External Services      │                           │
         │  │  - MinIO (ObjectStorage) │                           │
         │  └──────────────────────────┘                           │
         └─────────────────────────┬────────────────────────────────┘
                                   │ Alloy → 원격 전송
         ┌─────────────────────────▼────────────────────────────────┐
         │          Monitoring VM (별도 서버, K8s 외부)               │
         │                                                          │
         │  ┌────────┐ ┌────────┐ ┌───────┐ ┌───────────┐         │
         │  │ Loki   │ │Grafana │ │ Tempo │ │  Mimir    │         │
         │  │ (Logs) │ │(Dash)  │ │(Trace)│ │(Metrics)  │         │
         │  └────────┘ └────────┘ └───────┘ └───────────┘         │
         │                                                          │
         │  ┌──────────┐ ┌──────────┐                              │
         │  │  Kiali   │ │  Kibana  │                              │
         │  │(Istio UI)│ │ (ES UI)  │                              │
         │  └──────────┘ └──────────┘                              │
         │                                                          │
         │  Docker Compose 또는 직접 설치 (K8s 클러스터에 부하 없음)  │
         └──────────────────────────────────────────────────────────┘
```

---

## 4. Kubernetes 네임스페이스 설계

| 네임스페이스 | 용도 | 포함 리소스 |
|-------------|------|------------|
| `clouddx` | 어플리케이션 핵심 | Frontend, Backend, Workers |
| `clouddx-data` | 데이터 레이어 | MongoDB, Redis, Kafka, Zookeeper, Elasticsearch |
| `clouddx-storage` | 오브젝트 스토리지 | MinIO, Harbor |
| `istio-system` | 서비스 메시 | Istio 컨트롤 플레인 |
| `monitoring` | 수집 에이전트 전용 | Grafana Alloy (DaemonSet만) |
| `keda` | 이벤트 기반 오토스케일링 | KEDA Operator, Metrics Server |
| `karpenter` | 노드 오토스케일링 | Karpenter Controller |
| `argocd` | GitOps | ArgoCD 컨트롤러 |

> **Note:** LGTM 백엔드(Loki, Grafana, Tempo, Mimir), Kiali, Kibana는 **별도 Monitoring VM**에서 Docker Compose로 운영합니다. 모니터링 도구는 리소스 사용량이 크므로 K8s 클러스터에 부하를 주지 않기 위해 분리합니다. K8s 내부에는 수집기(Alloy DaemonSet)만 배치합니다.

---

## 5. Kubernetes 리소스 매핑

### 5.1 Deployment (Stateless 서비스)

| 서비스 | 리소스 타입 | Replicas | CPU Request | Memory Request | CPU Limit | Memory Limit |
|--------|-----------|----------|-------------|---------------|-----------|-------------|
| Frontend | Deployment | 2 | 200m | 256Mi | 500m | 512Mi |
| Backend | Deployment | 3 | 300m | 512Mi | 1000m | 1Gi |
| Workers (price) | Deployment + KEDA | 0~3 | 100m | 128Mi | 300m | 256Mi |
| Workers (news) | Deployment + KEDA | 0~3 | 100m | 128Mi | 300m | 256Mi |
| Workers (indexer) | Deployment + KEDA | 0~3 | 100m | 128Mi | 300m | 256Mi |
| Workers (price_consumer) | Deployment + KEDA | 0~3 | 100m | 128Mi | 300m | 256Mi |

### 5.2 StatefulSet (Stateful 서비스)

| 서비스 | 리소스 타입 | Replicas | Storage | CPU | Memory |
|--------|-----------|----------|---------|-----|--------|
| MongoDB | StatefulSet | 1 (추후 ReplicaSet 3) | 30Gi | 500m | 1Gi |
| Redis | StatefulSet | 1 (추후 Sentinel 3) | 5Gi | 200m | 256Mi |
| Kafka | StatefulSet | 1 (추후 3) | 20Gi | 500m | 1Gi |
| Zookeeper | StatefulSet | 1 (추후 3) | 5Gi | 200m | 256Mi |
| Elasticsearch | StatefulSet | 1 (추후 3) | 30Gi | 500m | 2Gi |
| MinIO | StatefulSet | 1 | 20Gi | 200m | 512Mi |
| Harbor | StatefulSet | 1 | 50Gi | 300m | 512Mi |

### 5.3 Service 매핑

| 서비스 | Service 타입 | 포트 | 비고 |
|--------|-------------|------|------|
| Frontend | ClusterIP | 3000 | Istio Gateway 통해 외부 노출 |
| Backend | ClusterIP | 8000 | Istio Gateway 통해 외부 노출 |
| MongoDB | ClusterIP | 27017 | 클러스터 내부만 |
| Redis | ClusterIP | 6379 | 클러스터 내부만 |
| Kafka | ClusterIP | 9092 | 클러스터 내부만 |
| Elasticsearch | ClusterIP | 9200 | 클러스터 내부만 |
| MinIO | ClusterIP | 9000/9001 | 9001 콘솔은 선택적 노출 |
| Harbor | NodePort | 8080/4443 | CI/CD에서 이미지 Push/Pull |
| Kibana | ClusterIP | 5601 | Istio Gateway 통해 내부 접근 |
| Grafana | ClusterIP | 3000 | Istio Gateway 통해 내부 접근 |

---

## 6. Istio 서비스 메시

### 6.1 Istio 구성 요소

```
┌─────────────────────────────────────────────┐
│              Istio Control Plane             │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │  istiod  │  │ Gateway  │  │  Kiali    │  │
│  │(Pilot+   │  │Controller│  │(Dashboard)│  │
│  │ Citadel) │  │          │  │           │  │
│  └─────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              Istio Data Plane               │
│                                             │
│  모든 Pod에 Envoy Sidecar 자동 주입          │
│                                             │
│  [Frontend Pod]      [Backend Pod]          │
│  ┌──────┬────────┐  ┌──────┬────────┐      │
│  │ App  │ Envoy  │  │ App  │ Envoy  │      │
│  │      │Sidecar │  │      │Sidecar │      │
│  └──────┴────────┘  └──────┴────────┘      │
└─────────────────────────────────────────────┘
```

### 6.2 Istio Gateway 설정

```yaml
# Istio Gateway - 외부 트래픽 진입
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: clouddx-gateway
  namespace: clouddx
spec:
  selector:
    istio: ingressgateway
  servers:
    - port:
        number: 443
        name: https
        protocol: HTTPS
      tls:
        mode: SIMPLE
        credentialName: clouddx-tls-cert
      hosts:
        - "clouddx.example.com"
        - "api.clouddx.example.com"
    - port:
        number: 80
        name: http
        protocol: HTTP
      hosts:
        - "clouddx.example.com"
      tls:
        httpsRedirect: true
```

### 6.3 VirtualService 라우팅

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: clouddx-routing
  namespace: clouddx
spec:
  hosts:
    - "clouddx.example.com"
  gateways:
    - clouddx-gateway
  http:
    # Backend API 라우팅
    - match:
        - uri:
            prefix: /api/
      route:
        - destination:
            host: backend-svc
            port:
              number: 8000
      retries:
        attempts: 3
        retryOn: 5xx
      timeout: 30s

    # Frontend 라우팅 (기본)
    - route:
        - destination:
            host: frontend-svc
            port:
              number: 3000
```

### 6.4 Istio 트래픽 정책

```yaml
# mTLS 강제 적용
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: clouddx
spec:
  mtls:
    mode: STRICT

---
# Circuit Breaker (Backend)
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: backend-circuit-breaker
  namespace: clouddx
spec:
  host: backend-svc
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: DEFAULT
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 60s
      maxEjectionPercent: 50
```

### 6.5 Istio 사이드카 제외 대상

데이터 레이어 네임스페이스는 사이드카 오버헤드를 줄이기 위해 선택적으로 적용합니다.

```yaml
# clouddx-data 네임스페이스에는 사이드카 비활성화
apiVersion: v1
kind: Namespace
metadata:
  name: clouddx-data
  labels:
    istio-injection: disabled
```

---

## 7. NetworkPolicy (네임스페이스 격리)

Istio mTLS와 별개로 Kubernetes NetworkPolicy를 적용하여 네임스페이스 간 통신을 L3/L4 수준에서 제한합니다.

### 7.1 정책 개요

```
┌─────────────────────────────────────────────────────────────┐
│                 NetworkPolicy 통신 매트릭스                    │
│                                                             │
│                clouddx   clouddx-data   monitoring   외부   │
│  clouddx       ✅ 허용    ✅ 허용         ✅ 허용     ❌    │
│  clouddx-data  ❌ 차단    ✅ 허용         ✅ 허용     ❌    │
│  monitoring    ✅ 허용    ✅ 허용         ✅ 허용     ❌    │
│  외부(Ingress) ✅ GW만    ❌ 차단         ❌ 차단     -     │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 기본 정책: Deny All (네임스페이스별)

```yaml
# clouddx-data 네임스페이스 - 기본 모든 인그레스 차단
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: clouddx-data
spec:
  podSelector: {}
  policyTypes:
    - Ingress
```

### 7.3 허용 정책: 앱 → 데이터 레이어

```yaml
# clouddx 네임스페이스의 Pod만 Redis/Kafka/ES 접근 허용
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-app-to-data
  namespace: clouddx-data
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress:
    # clouddx 앱에서의 접근 허용
    - from:
        - namespaceSelector:
            matchLabels:
              name: clouddx
      ports:
        - port: 6379    # Redis
          protocol: TCP
        - port: 9092    # Kafka
          protocol: TCP
        - port: 9200    # Elasticsearch
          protocol: TCP
        - port: 2181    # Zookeeper
          protocol: TCP
    # monitoring (Alloy) 에서의 메트릭 수집 허용
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
```

### 7.4 허용 정책: Alloy → 전체 스크래핑

```yaml
# Alloy DaemonSet이 모든 네임스페이스의 메트릭 수집 가능
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-alloy-scrape
  namespace: clouddx
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
        - podSelector:
            matchLabels:
              app: alloy
```

### 7.5 허용 정책: Istio Ingress → Frontend/Backend만

```yaml
# 외부에서는 Istio Gateway를 통해 Frontend/Backend만 접근 가능
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-to-app
  namespace: clouddx
spec:
  podSelector:
    matchExpressions:
      - key: app
        operator: In
        values: ["frontend", "backend"]
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: istio-system
```

---

## 8. LGTM 옵저버빌리티 스택 (Grafana Alloy)

### 8.1 LGTM 아키텍처 (별도 VM 분리)

모니터링 도구(Loki, Grafana, Tempo, Mimir)는 리소스 사용량이 크므로 K8s 클러스터 내부가 아닌 **별도 Monitoring VM**에서 Docker Compose로 운영합니다.

```
┌────────────────────────────────┐    ┌────────────────────────────────────┐
│    Kubernetes Cluster          │    │      Monitoring VM (별도 서버)       │
│                                │    │                                    │
│  ┌──────────────────────────┐  │    │  ┌─────────────┐                  │
│  │  Grafana Alloy           │  │    │  │   Grafana   │ ◄── 대시보드     │
│  │  (DaemonSet)             │──┼────┼─▶│  (Port 3000)│                  │
│  │                          │  │    │  └──────┬──────┘                  │
│  │  모든 K8s 노드에서 수집   │  │    │         │ 쿼리                     │
│  │  - 컨테이너 로그          │  │    │  ┌──────┼──────┐                  │
│  │  - Pod 메트릭             │  │    │  │      │      │                  │
│  │  - Istio Envoy 트레이스   │  │    │  ▼      ▼      ▼                  │
│  └──────────────────────────┘  │    │ ┌────┐┌─────┐┌─────┐             │
│                                │    │ │Loki││Tempo││Mimir│             │
│                                │    │ │Log ││Trace││Metr.│             │
│                                │    │ └────┘└─────┘└─────┘             │
│                                │    │                                    │
│                                │    │  ┌──────────┐ ┌──────────┐        │
│                                │    │  │  Kiali   │ │  Kibana  │        │
│                                │    │  │(Istio UI)│ │ (ES UI)  │        │
│                                │    │  └──────────┘ └──────────┘        │
│                                │    │                                    │
│                                │    │  운영: Docker Compose              │
│                                │    │  스펙: 4Core / 16GB+ / 200GB SSD  │
└────────────────────────────────┘    └────────────────────────────────────┘
```

### 8.2 Grafana Alloy 구성 (K8s 내부 DaemonSet)

Alloy는 기존의 Promtail + OTel Collector + Prometheus Agent를 하나로 통합한 수집기입니다.

```hcl
// alloy-config.alloy - Grafana Alloy 설정

// ============================================
// 1. Metrics 수집 (Mimir로 전송)
// ============================================

// Kubernetes Pod Metrics 스크래핑
prometheus.scrape "k8s_pods" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [prometheus.remote_write.mimir.receiver]

  scrape_interval = "30s"
}

// Istio Envoy Metrics
prometheus.scrape "istio_envoy" {
  targets = discovery.kubernetes.pods.targets
  metrics_path = "/stats/prometheus"
  forward_to   = [prometheus.remote_write.mimir.receiver]

  scrape_interval = "15s"
}

// Node Exporter Metrics
prometheus.scrape "node_exporter" {
  targets    = discovery.kubernetes.nodes.targets
  forward_to = [prometheus.remote_write.mimir.receiver]
}

prometheus.remote_write "mimir" {
  endpoint {
    url = "http://<MONITORING_VM_IP>:9009/api/v1/push"
  }
}

// ============================================
// 2. Logs 수집 (Loki로 전송)
// ============================================

// 컨테이너 로그 수집
loki.source.kubernetes "k8s_logs" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [loki.write.default.receiver]
}

loki.write "default" {
  endpoint {
    url = "http://<MONITORING_VM_IP>:3100/loki/api/v1/push"
  }
}

// ============================================
// 3. Traces 수집 (Tempo로 전송)
// ============================================

// OTLP gRPC 수신 (앱에서 보내는 트레이스)
otelcol.receiver.otlp "default" {
  grpc {
    endpoint = "0.0.0.0:4317"
  }
  http {
    endpoint = "0.0.0.0:4318"
  }

  output {
    traces = [otelcol.exporter.otlp.tempo.input]
  }
}

otelcol.exporter.otlp "tempo" {
  client {
    endpoint = "<MONITORING_VM_IP>:4317"
    tls {
      insecure = true
    }
  }
}
```

### 8.3 Monitoring VM Docker Compose 배포

**Monitoring VM (Docker Compose):**

```yaml
# monitoring-vm/docker-compose.yml
services:
  loki:
    image: grafana/loki:3.0.0
    ports:
      - "3100:3100"
    volumes:
      - loki_data:/loki
      - ./loki-config.yml:/etc/loki/config.yml
    command: -config.file=/etc/loki/config.yml

  tempo:
    image: grafana/tempo:2.4.0
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "3200:3200"   # Tempo API
    volumes:
      - tempo_data:/var/tempo
      - ./tempo-config.yml:/etc/tempo/config.yml

  mimir:
    image: grafana/mimir:2.12.0
    ports:
      - "9009:9009"
    volumes:
      - mimir_data:/data
      - ./mimir-config.yml:/etc/mimir/config.yml
    command: -config.file=/etc/mimir/config.yml

  grafana:
    image: grafana/grafana:11.0.0
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false

  kiali:
    image: quay.io/kiali/kiali:v1.82
    ports:
      - "20001:20001"
    environment:
      - KUBERNETES_SERVICE_HOST=<K8S_API_SERVER_IP>
      - KUBERNETES_SERVICE_PORT=6443

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://<K8S_ES_NODEPORT_IP>:9200

volumes:
  loki_data:
  tempo_data:
  mimir_data:
  grafana_data:
```

**K8s 클러스터 내 Alloy만 Helm 설치:**

```bash
# K8s 클러스터 안에는 수집기(Alloy)만 설치
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install alloy grafana/alloy \
  --namespace monitoring \
  --create-namespace \
  --set alloy.configMap.content="$(cat alloy-config.alloy)"
```

### 8.4 모니터링 대시보드 구성

| 대시보드 | 데이터소스 | 용도 |
|---------|----------|------|
| CloudDX Overview | Mimir | 서비스 상태, 요청량, 에러율 |
| API Performance | Mimir + Tempo | API 응답시간, P95/P99, 트레이스 |
| Kafka Monitoring | Mimir | 토픽 Lag, Producer/Consumer 상태 |
| Redis Dashboard | Mimir | 히트율, 메모리, 커넥션 |
| Istio Mesh | Mimir | 메시 트래픽, mTLS 상태 |
| Log Explorer | Loki | 로그 검색, 에러 추적 |
| Trace Explorer | Tempo | 분산 트레이싱, 병목 분석 |

### 8.5 알림 규칙

```yaml
# Mimir Alerting Rules
groups:
  - name: clouddx-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "높은 에러율 감지 ({{ $value }})"

      - alert: BackendDown
        expr: up{job="backend"} == 0
        for: 1m
        labels:
          severity: critical

      - alert: KafkaConsumerLag
        expr: kafka_consumer_group_lag > 1000
        for: 10m
        labels:
          severity: warning

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
```

---

## 9. GitLab CI/CD 파이프라인

### 9.1 파이프라인 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitLab CI/CD Pipeline                        │
│                                                                 │
│  ┌──────┐   ┌──────────┐   ┌──────┐   ┌──────┐   ┌─────────┐ │
│  │Build │──▶│SonarQube │──▶│ Test │──▶│Build │──▶│  Push   │ │
│  │Check │   │  Scan    │   │      │   │Image │   │ Harbor  │ │
│  └──────┘   └──────────┘   └──────┘   └──────┘   └────┬────┘ │
│                                                         │      │
└─────────────────────────────────────────────────────────┼──────┘
                                                          │
                                              Git Commit (tag)
                                                          │
                                                  ┌───────▼───────┐
                                                  │  K8s Manifests│
                                                  │  Git Repo     │
                                                  │ (image tag    │
                                                  │  업데이트)      │
                                                  └───────┬───────┘
                                                          │
                                                  ┌───────▼───────┐
                                                  │    ArgoCD     │
                                                  │  (Auto Sync)  │
                                                  └───────┬───────┘
                                                          │
                                                  ┌───────▼───────┐
                                                  │  Kubernetes   │
                                                  │  Cluster      │
                                                  └───────────────┘
```

### 9.2 `.gitlab-ci.yml`

```yaml
stages:
  - lint
  - test
  - scan
  - build
  - deploy

variables:
  HARBOR_REGISTRY: "harbor.clouddx.local:8080"
  HARBOR_PROJECT: "clouddx"
  SONAR_HOST_URL: "http://sonarqube.clouddx.local:9000"

# ============================================
# Stage 1: Lint
# ============================================
lint:backend:
  stage: lint
  image: python:3.11-slim
  script:
    - pip install ruff
    - cd backend && ruff check .
  rules:
    - changes:
        - backend/**/*

lint:frontend:
  stage: lint
  image: node:20-alpine
  script:
    - cd frontend && npm ci && npm run lint
  rules:
    - changes:
        - frontend/**/*

# ============================================
# Stage 2: Test
# ============================================
test:backend:
  stage: test
  image: python:3.11-slim
  services:
    - redis:7-alpine
    - mongo:7
  variables:
    REDIS_URL: "redis://redis:6379"
    MONGODB_URL: "mongodb://mongo:27017"
    MONGODB_DB_NAME: "clouddx_test"
  script:
    - cd backend
    - pip install -r requirements.txt
    - pip install pytest pytest-asyncio httpx
    - pytest tests/ -v --junitxml=report.xml
  artifacts:
    reports:
      junit: backend/report.xml

test:frontend:
  stage: test
  image: node:20-alpine
  script:
    - cd frontend && npm ci && npm run test -- --ci
  rules:
    - changes:
        - frontend/**/*

# ============================================
# Stage 3: SonarQube Scan
# ============================================
sonarqube:backend:
  stage: scan
  image:
    name: sonarsource/sonar-scanner-cli:latest
    entrypoint: [""]
  variables:
    SONAR_USER_HOME: "${CI_PROJECT_DIR}/.sonar"
  script:
    - >
      sonar-scanner
      -Dsonar.projectKey=clouddx-backend
      -Dsonar.sources=backend/app
      -Dsonar.host.url=$SONAR_HOST_URL
      -Dsonar.token=$SONAR_TOKEN
      -Dsonar.python.version=3.11
      -Dsonar.qualitygate.wait=true
  allow_failure: false

sonarqube:frontend:
  stage: scan
  image:
    name: sonarsource/sonar-scanner-cli:latest
    entrypoint: [""]
  script:
    - >
      sonar-scanner
      -Dsonar.projectKey=clouddx-frontend
      -Dsonar.sources=frontend/app,frontend/components,frontend/lib
      -Dsonar.host.url=$SONAR_HOST_URL
      -Dsonar.token=$SONAR_TOKEN
      -Dsonar.qualitygate.wait=true
  allow_failure: false

# ============================================
# Stage 4: Build & Push Docker Images
# ============================================
.build_template: &build_template
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  before_script:
    - echo "$HARBOR_PASSWORD" | docker login $HARBOR_REGISTRY -u $HARBOR_USERNAME --password-stdin

build:backend:
  <<: *build_template
  script:
    - docker build -t $HARBOR_REGISTRY/$HARBOR_PROJECT/backend:$CI_COMMIT_SHORT_SHA -f backend/Dockerfile.prod backend/
    - docker push $HARBOR_REGISTRY/$HARBOR_PROJECT/backend:$CI_COMMIT_SHORT_SHA
    - docker tag $HARBOR_REGISTRY/$HARBOR_PROJECT/backend:$CI_COMMIT_SHORT_SHA $HARBOR_REGISTRY/$HARBOR_PROJECT/backend:latest
    - docker push $HARBOR_REGISTRY/$HARBOR_PROJECT/backend:latest
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes:
        - backend/**/*

build:frontend:
  <<: *build_template
  script:
    - docker build -t $HARBOR_REGISTRY/$HARBOR_PROJECT/frontend:$CI_COMMIT_SHORT_SHA -f frontend/Dockerfile.prod frontend/
    - docker push $HARBOR_REGISTRY/$HARBOR_PROJECT/frontend:$CI_COMMIT_SHORT_SHA
    - docker tag $HARBOR_REGISTRY/$HARBOR_PROJECT/frontend:$CI_COMMIT_SHORT_SHA $HARBOR_REGISTRY/$HARBOR_PROJECT/frontend:latest
    - docker push $HARBOR_REGISTRY/$HARBOR_PROJECT/frontend:latest
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes:
        - frontend/**/*

build:workers:
  <<: *build_template
  script:
    - docker build -t $HARBOR_REGISTRY/$HARBOR_PROJECT/workers:$CI_COMMIT_SHORT_SHA -f backend/workers/Dockerfile.prod backend/workers/
    - docker push $HARBOR_REGISTRY/$HARBOR_PROJECT/workers:$CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes:
        - backend/workers/**/*

# ============================================
# Stage 5: Deploy (ArgoCD 매니페스트 업데이트)
# ============================================
deploy:staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache git
  script:
    # K8s 매니페스트 레포에서 이미지 태그 업데이트
    - git clone https://$DEPLOY_TOKEN@gitlab.clouddx.local/clouddx/k8s-manifests.git
    - cd k8s-manifests/overlays/staging
    - |
      sed -i "s|image: .*backend:.*|image: $HARBOR_REGISTRY/$HARBOR_PROJECT/backend:$CI_COMMIT_SHORT_SHA|g" backend-deployment.yaml
      sed -i "s|image: .*frontend:.*|image: $HARBOR_REGISTRY/$HARBOR_PROJECT/frontend:$CI_COMMIT_SHORT_SHA|g" frontend-deployment.yaml
      sed -i "s|image: .*workers:.*|image: $HARBOR_REGISTRY/$HARBOR_PROJECT/workers:$CI_COMMIT_SHORT_SHA|g" workers-deployment.yaml
    - git add . && git commit -m "deploy: $CI_COMMIT_SHORT_SHA" && git push
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  environment:
    name: staging

deploy:production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache git
  script:
    - git clone https://$DEPLOY_TOKEN@gitlab.clouddx.local/clouddx/k8s-manifests.git
    - cd k8s-manifests/overlays/production
    - |
      sed -i "s|image: .*backend:.*|image: $HARBOR_REGISTRY/$HARBOR_PROJECT/backend:$CI_COMMIT_SHORT_SHA|g" backend-deployment.yaml
      sed -i "s|image: .*frontend:.*|image: $HARBOR_REGISTRY/$HARBOR_PROJECT/frontend:$CI_COMMIT_SHORT_SHA|g" frontend-deployment.yaml
      sed -i "s|image: .*workers:.*|image: $HARBOR_REGISTRY/$HARBOR_PROJECT/workers:$CI_COMMIT_SHORT_SHA|g" workers-deployment.yaml
    - git add . && git commit -m "deploy: $CI_COMMIT_SHORT_SHA [production]" && git push
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
  environment:
    name: production
```

### 9.3 SonarQube Quality Gate 기준

| 항목 | 기준 | 설명 |
|------|------|------|
| Coverage | >= 60% | 테스트 커버리지 |
| Duplications | < 5% | 중복 코드 비율 |
| Bugs | 0 (New) | 새로 발견된 버그 |
| Vulnerabilities | 0 (New) | 새 보안 취약점 |
| Code Smells | A등급 | 코드 품질 |
| Security Hotspots | 100% Reviewed | 보안 핫스팟 검토 |

---

## 10. ArgoCD GitOps 배포

### 10.1 ArgoCD 구성

```
┌──────────────────────────────────────────────────────┐
│                    ArgoCD                             │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │          Application 정의                    │    │
│  │                                              │    │
│  │  clouddx-staging                             │    │
│  │    Source: gitlab/k8s-manifests              │    │
│  │    Path: overlays/staging                    │    │
│  │    Sync: Auto (3분 간격)                      │    │
│  │                                              │    │
│  │  clouddx-production                          │    │
│  │    Source: gitlab/k8s-manifests              │    │
│  │    Path: overlays/production                 │    │
│  │    Sync: Manual (승인 후 배포)                 │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │          Sync Policy                        │    │
│  │                                              │    │
│  │  - Auto-Prune: 삭제된 리소스 자동 정리        │    │
│  │  - Self-Heal: Drift 자동 복구                 │    │
│  │  - Sync Window: 업무시간 외 자동배포 제한      │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### 10.2 K8s 매니페스트 레포 구조 (Kustomize)

```
k8s-manifests/
├── base/
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── hpa.yaml
│   ├── backend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── hpa.yaml
│   ├── workers/
│   │   ├── price-producer.yaml
│   │   ├── news-producer.yaml
│   │   ├── indexer-consumer.yaml
│   │   └── price-consumer.yaml
│   ├── mongodb/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   └── secret.yaml
│   ├── redis/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   ├── kafka/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   └── zookeeper.yaml
│   ├── elasticsearch/
│   │   ├── statefulset.yaml
│   │   └── service.yaml
│   ├── minio/
│   │   ├── statefulset.yaml
│   │   └── service.yaml
│   ├── harbor/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   └── secret.yaml
│   ├── istio/
│   │   ├── gateway.yaml
│   │   ├── virtual-service.yaml
│   │   ├── destination-rules.yaml
│   │   └── peer-authentication.yaml
│   ├── keda/
│   │   ├── price-consumer-scaler.yaml
│   │   ├── indexer-consumer-scaler.yaml
│   │   ├── backend-http-scaler.yaml
│   │   └── trigger-auth.yaml
│   └── karpenter/
│       ├── app-nodepool.yaml
│       ├── data-nodepool.yaml
│       ├── monitoring-nodepool.yaml
│       └── nodeclass.yaml
│
├── overlays/
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   ├── backend-deployment.yaml    # 이미지 태그 오버라이드
│   │   ├── frontend-deployment.yaml
│   │   ├── workers-deployment.yaml
│   │   ├── configmap-patch.yaml       # staging 환경 변수
│   │   └── replicas-patch.yaml        # staging replica 수
│   │
│   └── production/
│       ├── kustomization.yaml
│       ├── backend-deployment.yaml
│       ├── frontend-deployment.yaml
│       ├── workers-deployment.yaml
│       ├── configmap-patch.yaml       # production 환경 변수
│       ├── replicas-patch.yaml        # production replica 수
│       └── resource-limits-patch.yaml # production 리소스 제한
│
└── argocd/
    ├── staging-app.yaml
    └── production-app.yaml
```

### 10.3 ArgoCD Application 정의

```yaml
# argocd/staging-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: clouddx-staging
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://gitlab.clouddx.local/clouddx/k8s-manifests.git
    targetRevision: main
    path: overlays/staging
  destination:
    server: https://kubernetes.default.svc
    namespace: clouddx
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 3
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m

---
# argocd/production-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: clouddx-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://gitlab.clouddx.local/clouddx/k8s-manifests.git
    targetRevision: main
    path: overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: clouddx
  syncPolicy:
    # production은 수동 배포
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 3
```

### 10.4 배포 전략

| 서비스 | 전략 | 설정 |
|--------|------|------|
| Frontend | RollingUpdate | maxSurge: 1, maxUnavailable: 0 |
| Backend | RollingUpdate | maxSurge: 1, maxUnavailable: 0 |
| Workers | Recreate | 중복 소비 방지 |
| Redis | OnDelete | 수동 업데이트 (데이터 안전) |
| Kafka | OnDelete | 수동 업데이트 (데이터 안전) |

---

## 11. 마이그레이션 단계별 진행 계획

### Phase 0: 사전 준비

```
┌──────────────────────────────────────────────┐
│ Phase 0: 사전 준비                            │
│                                              │
│ 1. Production Dockerfile 작성                 │
│    - frontend/Dockerfile.prod (multi-stage)  │
│    - backend/Dockerfile.prod (multi-stage)   │
│    - workers/Dockerfile.prod                 │
│                                              │
│ 2. Harbor 이미지 빌드 및 푸시 검증              │
│    - 모든 서비스 이미지 정상 빌드 확인           │
│    - Harbor에서 이미지 Pull 테스트              │
│                                              │
│ 3. 환경 변수 정리                              │
│    - ConfigMap/Secret으로 분리할 항목 정리      │
│    - 하드코딩된 URL/값 환경변수화               │
│                                              │
│ 4. Health Check 엔드포인트 정비                 │
│    - /healthz (liveness)                     │
│    - /readyz (readiness)                     │
└──────────────────────────────────────────────┘
```

**체크리스트:**
- [ ] Frontend Dockerfile.prod 작성 (Next.js standalone)
- [ ] Backend Dockerfile.prod 작성 (multi-stage, non-root)
- [ ] Workers Dockerfile.prod 작성
- [ ] 모든 하드코딩 URL 환경변수화 (OAuth callback 등)
- [ ] Backend `/healthz`, `/readyz` 엔드포인트 추가
- [ ] Frontend `/api/health` 엔드포인트 추가
- [ ] `next.config.js` output: 'standalone' 설정

---

### Phase 1: Kubernetes 클러스터 구축

```
┌──────────────────────────────────────────────┐
│ Phase 1: K8s 클러스터 구축                     │
│                                              │
│ 1. K8s 클러스터 설치                           │
│    - kubeadm 또는 k3s 기반                    │
│    - Control Plane: 1 노드                    │
│    - Worker Node: 2~3 노드                    │
│                                              │
│ 2. 필수 컴포넌트 설치                          │
│    - CNI: Calico 또는 Cilium                  │
│    - StorageClass: local-path 또는 NFS        │
│    - MetalLB (Bare Metal LoadBalancer)        │
│    - Cert-Manager (TLS 인증서)                │
│                                              │
│ 3. 네임스페이스 생성                           │
│    - clouddx, clouddx-data, clouddx-storage  │
│    - istio-system, monitoring, argocd         │
└──────────────────────────────────────────────┘
```

**노드 구성 (최소 사양):**

| 역할 | CPU | Memory | Storage | 비고 |
|------|-----|--------|---------|------|
| Control Plane | 2 Core | 4GB | 50GB | Master + etcd |
| Worker 1 | 4 Core | 8GB | 100GB | App 워크로드 |
| Worker 2 | 4 Core | 8GB | 100GB | Data 워크로드 |
| Worker 3 (선택) | 4 Core | 8GB | 100GB | Monitoring |

---

### Phase 2: Istio 서비스 메시 설치

```
┌──────────────────────────────────────────────┐
│ Phase 2: Istio 설치                           │
│                                              │
│ 1. Istio 설치 (istioctl)                      │
│    $ istioctl install --set profile=default  │
│                                              │
│ 2. clouddx 네임스페이스 Sidecar 활성화         │
│    $ kubectl label namespace clouddx \       │
│      istio-injection=enabled                 │
│                                              │
│ 3. Kiali 대시보드 설치                         │
│    $ kubectl apply -f kiali.yaml             │
│                                              │
│ 4. Istio Gateway + VirtualService 배포        │
│                                              │
│ 5. mTLS PeerAuthentication 적용               │
└──────────────────────────────────────────────┘
```

---

### Phase 3: LGTM 옵저버빌리티 구축

```
┌──────────────────────────────────────────────┐
│ Phase 3: LGTM + Alloy 설치                    │
│                                              │
│ 1. monitoring 네임스페이스 생성                │
│                                              │
│ 2. Helm으로 LGTM 스택 설치                     │
│    - Loki (로그)                              │
│    - Grafana (대시보드)                        │
│    - Tempo (트레이싱)                          │
│    - Mimir (메트릭)                           │
│                                              │
│ 3. Grafana Alloy DaemonSet 배포               │
│    - 메트릭 + 로그 + 트레이스 수집             │
│                                              │
│ 4. 대시보드 프로비저닝                          │
│    - CloudDX Overview                        │
│    - Istio Mesh Dashboard                    │
│    - Redis/Kafka/ES Monitoring               │
│                                              │
│ 5. 알림 규칙 설정                              │
│    - Slack/Email 알림 연동                     │
└──────────────────────────────────────────────┘
```

---

### Phase 4: GitLab CI/CD + SonarQube 구성

```
┌──────────────────────────────────────────────┐
│ Phase 4: CI/CD 파이프라인 구축                 │
│                                              │
│ 1. GitLab Runner 설치 (K8s Executor)          │
│    - K8s 클러스터 내 Runner Pod 실행           │
│                                              │
│ 2. SonarQube 설치                             │
│    - Helm 또는 Docker로 설치                   │
│    - GitLab 연동 설정                         │
│    - Quality Gate 기준 설정                    │
│                                              │
│ 3. .gitlab-ci.yml 작성                        │
│    - lint → test → scan → build → deploy     │
│                                              │
│ 4. Harbor 연동                                │
│    - GitLab → Harbor 이미지 푸시 자동화        │
│                                              │
│ 5. 파이프라인 테스트                           │
│    - Feature Branch 빌드 검증                  │
│    - Main Branch 자동 배포 검증                │
└──────────────────────────────────────────────┘
```

---

### Phase 5: ArgoCD GitOps 배포 구성

```
┌──────────────────────────────────────────────┐
│ Phase 5: ArgoCD 설치 및 GitOps 구성            │
│                                              │
│ 1. ArgoCD 설치                                │
│    $ kubectl create namespace argocd         │
│    $ kubectl apply -n argocd -f \            │
│      https://...install.yaml                 │
│                                              │
│ 2. K8s 매니페스트 Git 레포 생성                │
│    - base/ + overlays/ 구조 (Kustomize)      │
│                                              │
│ 3. ArgoCD Application 등록                    │
│    - clouddx-staging (Auto Sync)             │
│    - clouddx-production (Manual Sync)        │
│                                              │
│ 4. GitLab CI → 매니페스트 레포 연동            │
│    - CI에서 이미지 태그 업데이트 → Git Push     │
│    - ArgoCD 감지 → 자동 배포                   │
│                                              │
│ 5. Rollback 테스트                            │
│    - ArgoCD UI에서 이전 버전 롤백 확인          │
└──────────────────────────────────────────────┘
```

---

### Phase 5.5: KEDA + Karpenter 설치

```
┌──────────────────────────────────────────────┐
│ Phase 5.5: KEDA + Karpenter 구성              │
│                                              │
│ 1. KEDA 설치 (Helm)                           │
│    $ helm install keda kedacore/keda \       │
│      --namespace keda --create-namespace     │
│                                              │
│ 2. KEDA ScaledObject 배포                     │
│    - Workers: Kafka Lag 기반 스케일링          │
│    - Backend: HTTP RPS 기반 스케일링           │
│    - Scale-to-Zero 정책 설정                  │
│                                              │
│ 3. Karpenter 설치 (Helm)                      │
│    $ helm install karpenter karpenter/...    │
│      --namespace karpenter                   │
│                                              │
│ 4. NodePool 정의 배포                          │
│    - app-pool (App 워크로드)                  │
│    - data-pool (Data 워크로드, Taint)         │
│    - monitoring-pool (모니터링, Taint)        │
│                                              │
│ 5. 부하 테스트로 동작 검증                      │
│    - KEDA Pod 스케일 업/다운 확인              │
│    - Karpenter Node 프로비저닝 확인            │
│    - Scale-to-Zero → Scale-from-Zero 확인    │
└──────────────────────────────────────────────┘
```

---

### Phase 6: 데이터 레이어 마이그레이션

```
┌──────────────────────────────────────────────┐
│ Phase 6: Stateful 서비스 K8s 이전             │
│                                              │
│ 1. MongoDB StatefulSet 배포                    │
│    - Atlas → 로컬 K8s 전환                    │
│    - PVC 30Gi, mongodump → mongorestore      │
│    - 연결 URI 환경변수 변경                     │
│                                              │
│ 2. Redis StatefulSet 배포                     │
│    - PersistentVolumeClaim 설정               │
│    - 기존 Redis → K8s Redis 전환              │
│                                              │
│ 3. Kafka + Zookeeper StatefulSet 배포         │
│    - PVC 설정 (데이터 보존)                    │
│    - Topic 재생성/마이그레이션                  │
│                                              │
│ 4. Elasticsearch StatefulSet 배포             │
│    - PVC 설정                                │
│    - 인덱스 재생성                             │
│                                              │
│ 5. MinIO StatefulSet 배포                     │
│    - PVC 설정                                │
│    - 버킷/데이터 마이그레이션                   │
│                                              │
│ 6. Harbor StatefulSet 배포                    │
│    - 기존 VM Harbor → K8s 이전                │
│    - PVC 50Gi, 이미지 레이어 마이그레이션        │
└──────────────────────────────────────────────┘
```

---

### Phase 7: 어플리케이션 마이그레이션

```
┌──────────────────────────────────────────────┐
│ Phase 7: App 서비스 K8s 이전                   │
│                                              │
│ 1. Backend Deployment 배포                    │
│    - ConfigMap (환경 변수)                     │
│    - Secret (API 키, DB 비밀번호)              │
│    - HPA (Auto Scaling)                      │
│    - Readiness/Liveness Probe                │
│                                              │
│ 2. Frontend Deployment 배포                   │
│    - ConfigMap (API URL 등)                   │
│    - HPA                                     │
│                                              │
│ 3. Workers Deployment 배포                    │
│    - 각 Worker 별도 Deployment                │
│    - Kafka 연결 설정                          │
│                                              │
│ 4. Istio 라우팅 적용                          │
│    - Gateway → VirtualService → Service      │
│                                              │
│ 5. DNS 전환                                   │
│    - 기존 VM IP → K8s Ingress IP              │
└──────────────────────────────────────────────┘
```

---

### Phase 8: 검증 및 최적화

```
┌──────────────────────────────────────────────┐
│ Phase 8: 검증 및 최적화                        │
│                                              │
│ 1. E2E 테스트                                 │
│    - 전체 플로우 정상 동작 확인                  │
│    - OAuth 로그인/로그아웃                      │
│    - 자산 CRUD + 매수/매도                     │
│    - 시세 조회 (캐시 동작)                      │
│    - AI 챗봇                                  │
│                                              │
│ 2. 부하 테스트                                 │
│    - k6 또는 Locust 사용                       │
│    - HPA/KEDA 동작 확인                        │
│    - Karpenter Node 프로비저닝 확인             │
│    - Istio Circuit Breaker 동작 확인           │
│                                              │
│ 3. 스케일링 시나리오 테스트                      │
│    - KEDA: Kafka Lag 증가 → Worker 확장       │
│    - KEDA: Lag 해소 → Scale-to-Zero           │
│    - Karpenter: Pending Pod → 신규 노드 생성  │
│    - Karpenter: 유휴 노드 Consolidation       │
│                                              │
│ 4. 장애 시나리오 테스트                         │
│    - Pod 강제 종료 → 자동 복구 확인             │
│    - Node 장애 → Karpenter 재프로비저닝 확인    │
│    - ArgoCD 롤백 테스트                        │
│                                              │
│ 4. 모니터링 검증                               │
│    - Grafana 대시보드 데이터 확인               │
│    - 알림 수신 테스트                           │
│    - 로그/트레이스 검색 확인                     │
│                                              │
│ 5. 기존 VM 인프라 정리                         │
│    - Docker Compose 서비스 중지                │
│    - VM 리소스 회수                            │
└──────────────────────────────────────────────┘
```

---

## 12. 전체 배포 플로우 요약

```
┌──────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
│Developer │────▶│  GitLab  │────▶│ SonarQube │────▶│  Harbor  │
│ git push │     │  CI/CD   │     │   Scan    │     │  (이미지) │
└──────────┘     └──────────┘     └───────────┘     └─────┬────┘
                                                          │
                      ┌───────────────────────────────────┘
                      │ 이미지 태그 업데이트
                      ▼
              ┌──────────────┐
              │  K8s Manifest│
              │  Git Repo    │
              └──────┬───────┘
                     │ ArgoCD 감지
                     ▼
              ┌──────────────┐     ┌───────────┐
              │    ArgoCD    │────▶│Kubernetes │
              │  (GitOps)   │     │  Cluster  │
              └──────────────┘     └─────┬─────┘
                                         │
                     ┌───────────────────┼───────────────────┐
                     │                   │                   │
               ┌──────────┼──────────┼──────────┐
               │          │          │          │
               ▼          ▼          ▼          ▼
        ┌──────────┐┌──────────┐┌────────┐┌──────────┐
        │  Istio   ││   LGTM   ││  KEDA  ││Karpenter │
        │(Traffic) ││(Monitor) ││(Pod AS)││(Node AS) │
        └──────────┘└──────────┘└────────┘└──────────┘
```

**플로우:**
1. 개발자가 코드를 GitLab에 Push
2. GitLab CI가 Lint → Test → SonarQube Scan 실행
3. 품질 게이트 통과 시 Docker 이미지 빌드 → Harbor Push
4. CI가 K8s 매니페스트 레포의 이미지 태그를 업데이트
5. ArgoCD가 변경 감지 → Kubernetes에 자동 배포
6. Istio가 트래픽 관리 (라우팅, mTLS, Circuit Breaker)
7. LGTM + Alloy가 메트릭/로그/트레이스 수집 및 시각화
8. KEDA가 이벤트(Kafka Lag, HTTP RPS) 기반 Pod 오토스케일링
9. Karpenter가 Pending Pod 감지 시 최적 Node 자동 프로비저닝/회수

---

## 13. Secret 관리

| Secret | 저장 위치 | 용도 |
|--------|----------|------|
| MongoDB URI/Password | K8s Secret | DB 연결 (로컬 StatefulSet) |
| KIS API Key/Secret | K8s Secret | 주식 시세 API |
| JWT Secret Key | K8s Secret | 토큰 서명 |
| OAuth Client Secrets | K8s Secret | Google/Kakao/Naver |
| AWS Bedrock Credentials | K8s Secret | AI 챗봇 |
| Harbor Credentials | K8s Secret | 이미지 Pull |
| Redis Password | K8s Secret | 캐시 접근 |
| SonarQube Token | GitLab CI Variable | 코드 스캔 |
| GitLab Deploy Token | GitLab CI Variable | 매니페스트 레포 접근 |

> 향후 HashiCorp Vault 또는 Sealed Secrets 도입 고려

---

## 14. HPA vs KEDA: Pod 오토스케일링 전략 선택

### 14.1 객관적 비교

| 항목 | HPA | KEDA | 비고 |
|------|-----|------|------|
| **트리거 소스** | CPU, Memory만 (기본) | Kafka Lag, HTTP RPS, Redis, Prometheus 등 50+ | KEDA **압도적** |
| **Scale-to-Zero** | 불가 (minReplicas >= 1) | 가능 (minReplicas = 0) | KEDA **비용 절감** |
| **반응 속도** | 15~30초 (메트릭 수집 주기) | 10~15초 (pollingInterval 설정) | KEDA **약간 빠름** |
| **설치 복잡도** | K8s 내장 (추가 설치 없음) | Helm 설치 필요 (KEDA Operator) | HPA **단순** |
| **커스텀 메트릭** | Prometheus Adapter 별도 필요 | 내장 지원 | KEDA **편리** |
| **안정성/성숙도** | K8s 핵심 컴포넌트 (매우 안정) | CNCF Graduated (안정) | 둘 다 프로덕션 가능 |
| **리소스 오버헤드** | 없음 | KEDA Operator Pod (~128Mi) | HPA **가벼움** |

### 14.2 CloudDX 적용 전략: 혼합 사용

HPA와 KEDA를 **대체가 아닌 보완 관계**로 사용합니다.

| 서비스 | 스케일러 | 이유 |
|--------|---------|------|
| **Frontend** | HPA만 | CPU 기반 스케일링으로 충분. 이벤트 소스 없음 |
| **Backend** | HPA + KEDA | 기본 CPU/Memory는 HPA, 추가로 HTTP RPS 급증 시 KEDA가 보조 |
| **Workers (Producer)** | KEDA만 | CPU 기반으로는 스케일링 불가 (외부 API 호출 대기가 대부분) |
| **Workers (Consumer)** | KEDA만 | Kafka Consumer Lag 기반 스케일링. **Scale-to-Zero 필수** (Lag 0일 때 리소스 낭비 방지) |

**선택 근거:**
1. Workers는 CPU 사용률이 낮아도 Kafka Lag가 쌓이면 스케일 업이 필요 → HPA로는 감지 불가, KEDA 필수
2. Consumer Workers는 야간/주말에 데이터 없을 때 Pod 0으로 축소 → Scale-to-Zero는 KEDA만 지원
3. Frontend는 단순한 Next.js 서빙이므로 CPU 기반 HPA가 가장 적합하고 가벼움
4. Backend는 평상시 HPA로 안정적 운영 + 시세 조회 폭주 시 KEDA의 Prometheus 트리거로 빠른 대응

---

## 14.5. HPA (Horizontal Pod Autoscaler) 설정

```yaml
# Backend HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: clouddx
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 6
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

---
# Frontend HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: clouddx
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 2
  maxReplicas: 4
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## 15. KEDA (Kubernetes Event-Driven Autoscaling)

### 15.1 KEDA 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     KEDA 동작 흐름                            │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Event Source │    │    KEDA      │    │  Kubernetes  │  │
│  │              │───▶│   Operator   │───▶│   HPA/Pod    │  │
│  │ - Kafka Lag  │    │              │    │  Scale Up/   │  │
│  │ - Redis Len  │    │ ScaledObject │    │  Scale Down  │  │
│  │ - HTTP Rate  │    │   정의 기반   │    │  (0까지 축소) │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Scale to Zero                        │   │
│  │                                                      │   │
│  │  이벤트 없음 → Replica 0 (리소스 절약)                 │   │
│  │  이벤트 발생 → Replica 1+ (자동 확장)                  │   │
│  │  Kafka Lag 증가 → Replica 추가 (처리량 확보)           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 15.2 KEDA 설치

```bash
# KEDA Helm 설치
helm repo add kedacore https://kedacore.github.io/charts
helm repo update

helm install keda kedacore/keda \
  --namespace keda \
  --create-namespace \
  --set metricsServer.useHostNetwork=false
```

### 15.3 KEDA vs HPA 역할 분리

| 대상 | 스케일러 | 트리거 | 비고 |
|------|---------|--------|------|
| Frontend | HPA | CPU/Memory | 전통적 리소스 기반 |
| Backend | HPA + KEDA | CPU/Memory + HTTP RPS | 요청량 기반 확장 |
| Workers (Kafka) | KEDA | Kafka Consumer Lag | 이벤트 기반, Scale-to-Zero |
| Workers (price_consumer) | KEDA | Kafka Consumer Lag | 이벤트 기반, Scale-to-Zero |

### 15.4 ScaledObject 정의 - Kafka Workers

```yaml
# KEDA ScaledObject - Price Producer Worker
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: price-producer-scaler
  namespace: clouddx
spec:
  scaleTargetRef:
    name: price-producer
  pollingInterval: 15           # 15초마다 메트릭 확인
  cooldownPeriod: 60            # 스케일다운 대기 60초
  minReplicaCount: 1            # 최소 1 (항상 실행)
  maxReplicaCount: 3
  triggers:
    - type: cpu
      metadata:
        type: Utilization
        value: "70"

---
# KEDA ScaledObject - Price Consumer Worker
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: price-consumer-scaler
  namespace: clouddx
spec:
  scaleTargetRef:
    name: price-consumer
  pollingInterval: 15
  cooldownPeriod: 120           # Consumer는 더 긴 쿨다운
  minReplicaCount: 0            # Scale to Zero 허용
  maxReplicaCount: 3
  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka-svc.clouddx-data.svc:9092
        consumerGroup: price-consumer-group
        topic: prices
        lagThreshold: "100"     # Lag 100 이상이면 스케일 업
        offsetResetPolicy: latest

---
# KEDA ScaledObject - News Producer Worker
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: news-producer-scaler
  namespace: clouddx
spec:
  scaleTargetRef:
    name: news-producer
  pollingInterval: 30
  cooldownPeriod: 300
  minReplicaCount: 1
  maxReplicaCount: 2
  triggers:
    - type: cpu
      metadata:
        type: Utilization
        value: "70"

---
# KEDA ScaledObject - Indexer Consumer Worker
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: indexer-consumer-scaler
  namespace: clouddx
spec:
  scaleTargetRef:
    name: indexer-consumer
  pollingInterval: 15
  cooldownPeriod: 120
  minReplicaCount: 0            # Scale to Zero 허용
  maxReplicaCount: 3
  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka-svc.clouddx-data.svc:9092
        consumerGroup: indexer-consumer-group
        topic: news
        lagThreshold: "50"
        offsetResetPolicy: latest
```

### 15.5 ScaledObject 정의 - Backend HTTP 기반

```yaml
# KEDA ScaledObject - Backend (HTTP 요청 기반 추가 스케일링)
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: backend-http-scaler
  namespace: clouddx
spec:
  scaleTargetRef:
    name: backend
  pollingInterval: 10
  cooldownPeriod: 120
  minReplicaCount: 2            # 최소 2 유지 (가용성)
  maxReplicaCount: 6
  triggers:
    # Prometheus/Mimir 메트릭 기반
    - type: prometheus
      metadata:
        serverAddress: http://mimir.monitoring.svc:9009
        query: |
          sum(rate(istio_requests_total{
            destination_service_name="backend-svc",
            reporter="destination"
          }[2m]))
        threshold: "50"         # 초당 50 요청 이상이면 스케일 업
        activationThreshold: "5"
    # Redis 기반 (Rate Limit 카운터 활용)
    - type: redis
      metadata:
        address: redis-svc.clouddx-data.svc:6379
        listName: "request_queue"
        listLength: "100"
```

### 15.6 KEDA TriggerAuthentication (Kafka 인증 시)

```yaml
# Kafka 인증이 필요한 경우
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: kafka-trigger-auth
  namespace: clouddx
spec:
  secretTargetRef:
    - parameter: sasl
      name: kafka-credentials
      key: sasl
    - parameter: username
      name: kafka-credentials
      key: username
    - parameter: password
      name: kafka-credentials
      key: password
```

---

## 16. Karpenter (노드 오토스케일링)

### 16.1 Karpenter 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                   Karpenter 동작 흐름                         │
│                                                             │
│                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Pending  │    │  Karpenter   │    │  새 Node 프로비저닝 │  │
│  │  Pods    │───▶│  Controller  │───▶│  (적정 사양 선택)   │  │
│  │(스케줄링 │    │              │    │                    │  │
│  │ 불가)    │    │ NodePool     │    │  Pod 스케줄링      │  │
│  └──────────┘    │ 정의 기반     │    │  → Node 배치      │  │
│                  └──────────────┘    └──────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Node Lifecycle 관리                      │   │
│  │                                                      │   │
│  │  1. Provisioning: Pending Pod → 최적 Node 생성       │   │
│  │  2. Consolidation: 유휴 Node 통합 → 비용 절감         │   │
│  │  3. Drift Detection: 스펙 변경 → Node 교체           │   │
│  │  4. Expiration: TTL 기반 Node 자동 교체              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 16.2 Karpenter vs Cluster Autoscaler: 선택 근거

**객관적 지표 비교:**

| 항목 | Cluster Autoscaler (CA) | Karpenter | 비고 |
|------|------------------------|-----------|------|
| **프로비저닝 속도** | 3~5분 (ASG → EC2) | 30초~1분 (직접 API) | Karpenter **3~5배 빠름** |
| **스케일링 단위** | Node Group 단위 (고정 인스턴스 타입) | 개별 Node (동적 인스턴스 선택) | Karpenter **유연** |
| **Scale-Down 지연** | 기본 10분 대기 | Consolidation 즉시 감지 | Karpenter **비용 절감** |
| **Bin Packing** | Node Group 내 제한적 | 전체 클러스터 최적화 | Karpenter **효율** |
| **비용 최적화** | 같은 타입만 사용 | Spot/On-Demand 혼합, 최저가 자동 선택 | Karpenter **20~40% 절감** |
| **노드 다양성** | Node Group별 1타입 고정 | 수십 가지 인스턴스 중 동적 선택 | Karpenter **적응적** |
| **멀티 아키텍처** | 별도 Node Group 필요 | 자동 (arm64/amd64 혼합) | Karpenter **간편** |
| **설정 복잡도** | ASG + Launch Template 필요 | NodePool CR 하나로 완료 | Karpenter **단순** |
| **Drift Detection** | 없음 (수동 교체) | 자동 감지 → 교체 | Karpenter **운영 편의** |
| **커뮤니티/성숙도** | 오래된 표준 (2016~) | AWS 공식 지원 (2021~, GA) | 둘 다 프로덕션 안정 |

**CloudDX에서 Karpenter 선택 이유:**

1. **KEDA와의 시너지**: KEDA가 Kafka Lag 기반으로 Worker Pod를 0→3으로 급격히 스케일 업할 때, CA는 Node Group의 ASG 조정에 3~5분이 걸리지만, Karpenter는 30초~1분 내에 최적 노드를 프로비저닝하여 KEDA의 빠른 Pod 스케일링에 즉시 대응
2. **비용 효율**: CloudDX는 주간(시세 조회 활발)과 야간(유휴)의 트래픽 차이가 크므로, Karpenter의 Consolidation이 야간 유휴 노드를 빠르게 통합하여 비용 절감
3. **운영 단순성**: CA는 Node Group × 인스턴스 타입별로 ASG를 관리해야 하나, Karpenter는 NodePool 하나로 app/data/monitoring 워크로드를 분리 관리

### 16.3 Karpenter 설치

```bash
# Karpenter Helm 설치
helm repo add karpenter https://charts.karpenter.sh
helm repo update

helm install karpenter karpenter/karpenter \
  --namespace karpenter \
  --create-namespace \
  --set settings.clusterName=clouddx-cluster \
  --set settings.clusterEndpoint=https://<k8s-api-endpoint> \
  --set controller.resources.requests.cpu=0.5 \
  --set controller.resources.requests.memory=512Mi
```

### 16.4 NodePool 정의

```yaml
# Karpenter NodePool - 어플리케이션 워크로드
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: app-pool
spec:
  template:
    metadata:
      labels:
        workload-type: application
    spec:
      requirements:
        # CPU 아키텍처
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64"]
        # 인스턴스 카테고리 (베어메탈 환경은 capacity-type 조정)
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand"]
        # 노드 크기 제한
        - key: node.kubernetes.io/instance-type
          operator: In
          values: ["m5.large", "m5.xlarge", "m6i.large", "m6i.xlarge"]
      nodeClassRef:
        group: karpenter.sh
        kind: NodeClass
        name: default

  # 리소스 제한 (전체 NodePool)
  limits:
    cpu: "32"           # 최대 32 코어
    memory: "64Gi"      # 최대 64GB

  # Node 통합(Consolidation) 정책
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 60s

  # Node TTL (자동 교체)
  expireAfter: 720h     # 30일마다 노드 교체

---
# Karpenter NodePool - 데이터 워크로드 (StatefulSet용)
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: data-pool
spec:
  template:
    metadata:
      labels:
        workload-type: data
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values: ["r5.large", "r5.xlarge", "r6i.large"]  # 메모리 최적화
      # 데이터 노드는 Taint 적용
      taints:
        - key: workload-type
          value: data
          effect: NoSchedule

  limits:
    cpu: "16"
    memory: "64Gi"

  disruption:
    consolidationPolicy: WhenEmpty  # 데이터 노드는 보수적으로
    consolidateAfter: 300s

  expireAfter: 2160h    # 90일

---
# Karpenter NodePool - 모니터링 워크로드
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: monitoring-pool
spec:
  template:
    metadata:
      labels:
        workload-type: monitoring
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values: ["m5.large", "m5.xlarge"]
      taints:
        - key: workload-type
          value: monitoring
          effect: NoSchedule

  limits:
    cpu: "8"
    memory: "32Gi"

  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 120s
```

### 16.5 NodeClass 정의

```yaml
apiVersion: karpenter.sh/v1
kind: NodeClass
metadata:
  name: default
spec:
  # AMI (클라우드 환경 시) 또는 베어메탈 OS 이미지
  amiSelectorTerms:
    - tags:
        karpenter.sh/discovery: clouddx-cluster

  # 보안 그룹
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: clouddx-cluster

  # 서브넷
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: clouddx-cluster

  # Block Device (스토리지)
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 100Gi
        volumeType: gp3
        iops: 3000
        throughput: 125
        encrypted: true
```

### 16.6 워크로드별 Node 배치 전략 (NodeSelector + Toleration)

```yaml
# Backend Deployment - app-pool에 배치
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: clouddx
spec:
  template:
    spec:
      nodeSelector:
        workload-type: application
      containers:
        - name: backend
          # ...

---
# Elasticsearch StatefulSet - data-pool에 배치
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
  namespace: clouddx-data
spec:
  template:
    spec:
      nodeSelector:
        workload-type: data
      tolerations:
        - key: workload-type
          value: data
          effect: NoSchedule
      containers:
        - name: elasticsearch
          # ...

---
# Grafana Deployment - monitoring-pool에 배치
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  template:
    spec:
      nodeSelector:
        workload-type: monitoring
      tolerations:
        - key: workload-type
          value: monitoring
          effect: NoSchedule
      containers:
        - name: grafana
          # ...
```

### 16.7 Karpenter + KEDA 연동 시나리오

```
트래픽 급증 시나리오:

1. 사용자 트래픽 증가
   │
2. KEDA가 Backend Pod 스케일 업 (2 → 6)
   │
3. 기존 Node에 리소스 부족 → Pending Pod 발생
   │
4. Karpenter가 Pending Pod 감지
   │
5. 최적 사양의 새 Node 프로비저닝 (약 60초)
   │
6. Pending Pod → 새 Node에 스케줄링
   │
7. 서비스 정상 처리

트래픽 감소 시나리오:

1. 사용자 트래픽 감소
   │
2. KEDA가 Backend Pod 스케일 다운 (6 → 2)
   │
3. Kafka Consumer Lag 0 → KEDA가 Worker 0으로 축소
   │
4. Node 리소스 사용률 저하
   │
5. Karpenter Consolidation 감지
   │
6. Pod를 다른 Node로 이동 (Cordon → Drain)
   │
7. 유휴 Node 제거 → 비용 절감
```

---

## 17. KEDA + Karpenter 스케일링 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                    오토스케일링 계층 구조                          │
│                                                                 │
│  ┌──── Pod Level (수평 확장) ──────────────────────────────┐    │
│  │                                                         │    │
│  │  ┌─────────────┐     ┌──────────────────────────────┐  │    │
│  │  │     HPA     │     │           KEDA               │  │    │
│  │  │             │     │                              │  │    │
│  │  │ - Frontend  │     │ - Workers (Kafka Lag)        │  │    │
│  │  │   CPU/Mem   │     │ - Backend (HTTP RPS)         │  │    │
│  │  │             │     │ - Scale-to-Zero 지원          │  │    │
│  │  └─────────────┘     └──────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ Pending Pods 발생                  │
│                              ▼                                   │
│  ┌──── Node Level (인프라 확장) ──────────────────────────┐     │
│  │                                                         │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │              Karpenter                            │  │     │
│  │  │                                                   │  │     │
│  │  │  NodePool: app-pool      → App 워크로드 노드       │  │     │
│  │  │  NodePool: data-pool     → Data 워크로드 노드      │  │     │
│  │  │  NodePool: monitoring-pool → 모니터링 노드          │  │     │
│  │  │                                                   │  │     │
│  │  │  - 최적 인스턴스 자동 선택                          │  │     │
│  │  │  - Consolidation (유휴 노드 통합)                  │  │     │
│  │  │  - Drift Detection (스펙 변경 감지)                │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └─────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

| 스케일링 계층 | 도구 | 대상 | 트리거 |
|-------------|------|------|--------|
| Pod 수평 확장 | HPA | Frontend | CPU > 70% |
| Pod 수평 확장 | HPA | Backend (기본) | CPU > 70%, Memory > 80% |
| Pod 이벤트 확장 | KEDA | Backend (고급) | HTTP RPS > 50 |
| Pod 이벤트 확장 | KEDA | Workers | Kafka Consumer Lag > 100 |
| Pod → Zero | KEDA | Workers (Consumer) | Lag = 0 → 0 replica |
| Node 확장 | Karpenter | 전체 클러스터 | Pending Pod 발생 |
| Node 축소 | Karpenter | 전체 클러스터 | Node 유휴/저활용 |

---

## 18. 운영 협업: Slack + Jira 연동

### 18.1 알림/장애 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                    운영 이벤트 흐름                                │
│                                                                 │
│  ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌─────────┐ │
│  │ Grafana  │───▶│   Slack   │───▶│   Jira   │───▶│ 담당자  │ │
│  │ Alert    │    │  Webhook  │    │  Ticket  │    │ 대응    │ │
│  │ Manager  │    │ #ops-alert│    │ 자동 생성 │    │         │ │
│  └──────────┘    └───────────┘    └──────────┘    └─────────┘ │
│                                                                 │
│  ┌──────────┐    ┌───────────┐                                 │
│  │ ArgoCD   │───▶│   Slack   │  배포 완료/실패 알림              │
│  │ Webhook  │    │ #deploys  │                                 │
│  └──────────┘    └───────────┘                                 │
│                                                                 │
│  ┌──────────┐    ┌───────────┐                                 │
│  │ GitLab   │───▶│   Slack   │  빌드/테스트 결과 알림            │
│  │ CI/CD    │    │ #ci-cd    │                                 │
│  └──────────┘    └───────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 18.2 Slack 채널 구조

| 채널 | 용도 | 알림 소스 |
|------|------|----------|
| `#ops-alert` | 장애/경고 알림 | Grafana Alert Manager |
| `#deploys` | 배포 알림 | ArgoCD Webhook |
| `#ci-cd` | 빌드/테스트 결과 | GitLab CI/CD |
| `#daily-report` | 일일 운영 리포트 | Grafana 스케줄 리포트 |

### 18.3 Grafana → Slack 알림 설정

```yaml
# Grafana alerting - contact points
apiVersion: 1
contactPoints:
  - orgId: 1
    name: slack-ops
    receivers:
      - uid: slack-ops-alert
        type: slack
        settings:
          url: ${SLACK_WEBHOOK_URL}
          recipient: "#ops-alert"
          title: |
            [{{ .Status | toUpper }}] {{ .GroupLabels.alertname }}
          text: |
            *심각도:* {{ .CommonLabels.severity }}
            *서비스:* {{ .CommonLabels.job }}
            *요약:* {{ .CommonAnnotations.summary }}
            *Grafana:* {{ .ExternalURL }}
```

### 18.4 Jira 자동 티켓 생성

Grafana Alert → Slack 알림 → Slack Workflow → Jira API로 티켓 자동 생성

```
Critical 알림 발생 시:
1. Grafana → Slack #ops-alert 알림
2. Slack Workflow 자동 트리거
3. Jira REST API 호출 → 장애 티켓 생성
   - Project: CLOUDDX-OPS
   - Issue Type: Bug (Critical) / Task (Warning)
   - Priority: 알림 severity에 따라 자동 설정
   - Assignee: 당번 (Jira Automation Rule)
4. Slack 스레드에 Jira 티켓 링크 자동 회신
```

---

## 19. Kiali 대시보드 + AI 모니터링 요약

### 19.1 Kiali (Istio 시각화)

Kiali는 Monitoring VM에서 Docker로 운영하며, K8s API Server에 접근하여 Istio 메시 트래픽을 시각화합니다.

| 기능 | 설명 |
|------|------|
| Service Graph | 서비스 간 트래픽 흐름 실시간 시각화 |
| Traffic Animation | 요청 흐름 애니메이션 (성공/에러 색상 구분) |
| Health Check | Pod/Service/Workload 상태 대시보드 |
| Istio Config Validation | VirtualService/DestinationRule 설정 검증 |
| mTLS 상태 | 서비스 간 mTLS 적용 여부 확인 |

### 19.2 AI 모니터링 요약 기능 (운영 페이지)

CloudDX 운영 페이지에 **AI 모니터링 요약 버튼**을 제공하여 운영자가 현재 시스템 상태를 자연어로 확인할 수 있게 합니다.

```
┌─────────────────────────────────────────────────┐
│              운영 대시보드                         │
│                                                 │
│  [메트릭 요약]  [로그 요약]  [트레이스 요약]  [통합 요약] │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  AI 요약 결과:                              │  │
│  │                                            │  │
│  │  "현재 Backend API 평균 응답시간은 120ms로   │  │
│  │   정상 범위입니다. 최근 1시간 내 에러율은     │  │
│  │   0.02%이며, Kafka Consumer Lag는 0으로     │  │
│  │   모든 메시지가 정상 처리되고 있습니다.       │  │
│  │   Redis 히트율은 94%로 캐시 효율이 양호합니다."│  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**구현 방식:**
1. Frontend 운영 페이지에서 요약 버튼 클릭
2. Backend가 Grafana API / Mimir API / Loki API를 호출하여 메트릭/로그 수집
3. 수집된 데이터를 Bedrock(Claude)에 프롬프트와 함께 전달
4. AI가 자연어로 요약하여 운영자에게 반환

| 요약 타입 | 데이터 소스 | 프롬프트 예시 |
|----------|-----------|-------------|
| 메트릭 요약 | Mimir (Prometheus) | "최근 1시간 CPU/메모리/응답시간/에러율을 요약해줘" |
| 로그 요약 | Loki | "최근 ERROR 레벨 로그를 분석하고 패턴을 요약해줘" |
| 트레이스 요약 | Tempo | "P95 응답시간이 긴 상위 5개 엔드포인트를 분석해줘" |
| 통합 요약 | 전체 | "전체 시스템 상태를 운영자 관점에서 브리핑해줘" |

---

## 참고사항

- MongoDB는 Atlas(임시)에서 K8s 로컬 StatefulSet으로 전환 (AWS 마이그레이션 시 별도 EC2에 배치 예정)
- Harbor도 K8s 내부 StatefulSet으로 운영 (AWS 마이그레이션 시 별도 EC2로 분리 예정)
- 각 Phase는 이전 Phase 완료 후 순차 진행
- Stateful 서비스 마이그레이션 시 데이터 백업 필수
- 프로덕션 전환 전 Staging 환경에서 충분한 검증 필요
