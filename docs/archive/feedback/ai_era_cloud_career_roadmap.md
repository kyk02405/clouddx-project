# AI 시대에 클라우드/인프라 엔지니어로 성장하기 위한 구체적 역량 로드맵

지금 방향이면 **“AI에 대체 안 되는 사람”**이 아니라,
정확히는 **“AI를 활용해 더 큰 문제를 해결하는 사람”** 쪽으로 가는 게 맞다.

현재 기준으로 가장 유리한 포지션은 단순 백엔드 개발자보다 **클라우드/인프라/플랫폼 엔지니어 + DevOps + 운영 자동화 역량을 가진 사람**이다. 이 영역은 아직도 **설계 판단, 장애 대응, 보안, 비용, 운영 안정성, 협업** 비중이 크기 때문이다.

---

## 1. 앞으로 키워야 하는 핵심 역량 방향

크게 5가지로 정리할 수 있다.

### 1) 단순 구현보다 “시스템 전체를 보는 능력”
예를 들면 이런 질문에 답할 수 있어야 한다.

- 이 서비스가 왜 느린지
- 트래픽이 몰리면 어디가 먼저 죽는지
- DB, 캐시, 메시지 큐를 왜 나누는지
- 단일 서버에서 쿠버네티스로 가야 하는 이유가 뭔지
- 고가용성을 위해 왜 Multi-AZ, Load Balancer, Auto Scaling이 필요한지

즉 코드를 짜는 사람을 넘어서 **서비스 구조를 설명할 수 있는 사람**이 되어야 한다.

이미 InfraForge, Tutum, Kubernetes, AWS, Kafka 같은 키워드와 경험을 갖고 있다면 방향은 좋다. 이제 필요한 것은 “해봤다”를 넘어서 **왜 그렇게 설계했는지 논리적으로 설명하는 능력**이다.

### 2) 운영 자동화 능력
앞으로 가치가 높은 사람은 매번 수동으로 작업하는 사람이 아니라,

- 서버를 코드로 만들고
- 배포를 자동화하고
- 장애를 빨리 탐지하고
- 반복 작업을 스크립트로 없애는 사람

이다.

그래서 **IaC, CI/CD, 모니터링, 스크립팅**이 매우 중요하다.

### 3) 장애 대응 / 트러블슈팅 능력
실무에서 진짜 강한 사람은 새 기능만 잘 만드는 사람이 아니라 **문제 생겼을 때 원인을 찾는 사람**이다.

예:

- Pod가 계속 CrashLoopBackOff 나는 이유
- Ingress는 열렸는데 서비스가 안 붙는 이유
- DB connection timeout 원인
- Kafka lag 증가 원인
- CPU는 낮은데 응답속도가 느린 이유
- 디스크/메모리/네트워크 병목 구분

이건 AI가 바로 대체하기 어렵다. 실제 환경의 로그, 메트릭, 구성, 의존성, 팀 상황을 함께 봐야 하기 때문이다.

### 4) 보안과 권한 설계 능력
클라우드/인프라 쪽에서는 특히 중요하다.

- IAM 최소 권한
- Secret 관리
- 네트워크 분리
- SG/NACL
- WAF
- HTTPS/TLS
- SSM 기반 무SSH 운영
- 이미지 취약점 점검
- 공급망 보안(CI/CD에서 Cosign, Trivy, SBOM 등)

이런 것들은 “있으면 좋은 옵션”이 아니라 실무 기본 체력에 가깝다.

### 5) AI 활용 능력
AI 시대에는 AI를 안 쓰는 사람이 불리한 것이 맞다. 다만 중요한 것은 “질문을 잘하는 사람”이 아니라 **AI 결과를 검증하고 시스템에 적용하는 사람**이다.

즉 앞으로는 이런 흐름이 자연스러워야 한다.

- Claude/Codex/Gemini로 초안 생성
- 설계 검토
- 테스트/로그/문서로 검증
- 실제 운영환경에 맞게 수정

---

## 2. 기술 스택 우선순위

모든 것을 다 하려고 하면 흐려진다. 아래 순서로 깊이를 만드는 것이 좋다.

### A. 가장 먼저 단단히 해야 할 기반
이건 사실상 필수다.

#### 1) Linux
최소한 이 정도는 익숙해야 한다.

- 파일/권한/프로세스
- systemd
- journalctl
- 네트워크 확인 명령어
- ssh, scp, rsync
- crontab
- package manager
- nginx/apache 기본 설정
- 로그 보는 습관

목표는 **리눅스 서버에 들어가서 서비스 상태를 확인하고 문제를 좁혀갈 수 있는 수준**이다.

#### 2) 네트워크
이해가 깊을수록 인프라에서 강해진다.

- IP, Subnet, CIDR
- Routing
- DNS
- NAT
- TCP/UDP
- 3-way handshake
- HTTP/HTTPS
- Load Balancer 동작
- Reverse Proxy
- VPN/VPC Peering 기초

면접에서도 자주 나오고, 실무에서도 매우 자주 등장한다.

#### 3) Git/GitHub
그냥 push/pull 수준이 아니라 아래까지 이해하는 것이 좋다.

- branch 전략
- rebase / merge 차이
- conflict 해결
- PR 리뷰 흐름
- GitHub Actions 기본
- tag / release
- rollback 개념

### B. 진로에서 제일 중요한 핵심 스택
여기부터가 메인이다.

#### 4) AWS
목표상 가장 중요하다.

우선순위 추천:

- IAM
- VPC
- EC2
- ALB / Target Group
- Auto Scaling
- S3
- RDS
- CloudWatch
- Route53
- ACM
- WAF
- Systems Manager
- ECR
- EKS
- Lambda / SQS / SNS

공부는 서비스 하나하나 외우는 방식보다 **3-tier 서비스 하나를 AWS에 올린다**는 기준으로 묶어서 익히는 것이 좋다.

예:

사용자 접속  
→ Route53  
→ ACM  
→ ALB  
→ EC2/EKS  
→ RDS/Redis  
→ CloudWatch 로그/메트릭  
→ IAM/SG/WAF로 보호

이렇게 그림으로 연결해서 이해해야 실력이 오른다.

#### 5) Docker
이제는 기초이자 실무 기본이다.

- 이미지 / 컨테이너 차이
- Dockerfile 잘 쓰기
- 레이어 캐시
- 볼륨 / 네트워크
- docker-compose
- 멀티 스테이지 빌드
- 이미지 최적화
- 컨테이너 로그 확인
- 헬스체크

목표는 **앱을 컨테이너화하고 로컬에서 재현 가능한 환경을 만드는 것**이다.

#### 6) Kubernetes
강점 포인트가 될 수 있는 기술이다.

우선순위:

- Pod
- Deployment
- Service
- ConfigMap / Secret
- Ingress
- Namespace
- Resource requests/limits
- Liveness/Readiness Probe
- HPA
- PersistentVolume / PVC
- Helm
- RBAC
- NetworkPolicy
- rolling update / rollback

그 다음 단계:

- KEDA
- Argo CD
- Istio
- Karpenter
- Cluster Autoscaler
- observability stack
- EKS 운영

중요한 것은 YAML을 외우는 게 아니라 **왜 Deployment를 쓰고, 왜 Service가 필요하고, 왜 Ingress가 필요한지 설명할 수 있어야 한다는 점**이다.

#### 7) Terraform
클라우드 엔지니어/플랫폼 엔지니어를 가려면 매우 중요하다.

- provider / resource / variable / output
- module
- state
- remote backend
- workspace 기초
- plan / apply / destroy
- resource dependency
- 환경 분리(dev/stage/prod)
- AWS VPC, EC2, RDS, EKS 코드화

목표는 **콘솔 클릭 대신 인프라를 코드로 설명할 수 있는 수준**이다.

#### 8) CI/CD
여기서 차별화된다.

최소 구성:

- GitHub Actions
- Docker build/push
- 테스트 자동화
- 배포 자동화
- environment variables / secrets
- Argo CD 기반 GitOps

이 정도까지 되면 포트폴리오가 확 살아난다.

### C. 있으면 강해지는 추가 스택

#### 9) 모니터링 / 관측성
매우 중요하다.

- Prometheus
- Grafana
- Loki
- Tempo
- Alertmanager
- CloudWatch

배워야 하는 관점은 도구 설치가 아니라 다음이다.

- 메트릭은 뭘 봐야 하는가
- 로그는 어디서 찾는가
- trace는 언제 필요한가
- 장애 조짐을 어떻게 감지하는가

#### 10) 데이터/메시징
실시간 서비스라면 매우 중요하다.

- Redis
- Kafka
- RabbitMQ와 차이
- consumer group
- lag
- partition
- at least once / exactly once 기초
- 캐시 무효화 기초

프로젝트에도 바로 연결된다.

#### 11) 보안 도구 체인
실무 느낌을 확 살려준다.

- Trivy
- SonarQube
- Cosign
- OWASP Top 10 기초
- Secret scanning
- SAST / DAST 개념
- IAM least privilege
- KMS / Secrets Manager

특히 “운영 가능한 서비스” 느낌을 만들어 준다.

---

## 3. 공부 방향: 무엇을 버리고 무엇을 깊게 해야 하는가

### 버려야 할 방향
- 자잘한 문법만 외우기
- 서비스 이름만 잔뜩 아는 공부
- 유튜브로 개념만 많이 보고 실습 안 하는 것
- “나도 Kubernetes 해봤어요” 수준의 얕은 경험
- AI가 짜준 코드 붙여넣고 끝내는 습관

### 가져가야 할 방향
- 하나의 프로젝트를 계속 고도화하기
- 설계 이유를 문서로 남기기
- 장애 상황을 직접 만들어보고 복구하기
- 성능/비용/보안까지 함께 생각하기
- 결과물을 GitHub README, 아키텍처 다이어그램, 트러블슈팅 문서로 정리하기

---

## 4. 구체적인 학습 로드맵

### 1단계: 기반 체력
지금부터 가장 먼저 단단히 할 것:

- Linux
- 네트워크
- Python 또는 Bash 자동화
- Git/GitHub
- SQL 기본기

목표는 **서버, 로그, 네트워크, DB를 무서워하지 않는 상태**다.

### 2단계: 클라우드 배포 기본형
작은 서비스 하나를 AWS에 올린다.

예:

- 프론트 1개
- 백엔드 1개
- DB 1개
- Nginx reverse proxy
- HTTPS 적용
- CloudWatch 로그 확인

이 단계에서 익힐 것:

- EC2
- RDS
- IAM
- VPC
- ALB
- Route53
- ACM
- SG

### 3단계: 컨테이너 + 자동화
그 서비스를 Docker로 감싸고 배포 자동화까지 해본다.

- Dockerfile 작성
- compose 구성
- GitHub Actions로 빌드
- ECR push
- 배포 스크립트 자동화

### 4단계: Kubernetes/EKS
여기서부터 포트폴리오가 강해진다.

- 로컬 K8s나 온프레 K8s에서 먼저 운영
- Helm chart 구성
- Argo CD로 GitOps
- HPA/KEDA
- Ingress
- 모니터링 붙이기

그 다음 EKS로 이전한다.

### 5단계: 운영형 아키텍처로 고도화
여기서 면접에서 먹히는 포인트가 생긴다.

- 장애 대응 문서
- 롤백 전략
- 비용 최적화
- WAF/보안 강화
- Secret 관리
- 백업/복구
- Multi-AZ / 고가용성 설명
- 부하 테스트

---

## 5. 공부 비중 추천

현재 상황 기준으로 비중을 잡으면:

- **클라우드/AWS** 30
- **Kubernetes/Docker** 25
- **Linux/네트워크** 20
- **CI/CD + Terraform** 15
- **보안/모니터링** 10

핵심은 **AWS + K8s + Linux/네트워크** 삼각형이다.

---

## 6. 포지션 관점에서 어떤 사람이 되어야 하나

아래 3개를 섞은 형태가 가장 강하다.

### 1) 클라우드 엔지니어
- AWS 인프라 설계/구축
- 네트워크/보안
- 운영 자동화

### 2) DevOps/Platform 엔지니어
- CI/CD
- Kubernetes
- GitOps
- 모니터링
- 개발 생산성 향상

### 3) SRE 성향 운영 엔지니어
- 장애 대응
- 가용성
- 성능
- 관측성
- 운영 표준화

신입 때는 포지션 이름이 달라도 실제론 섞여 있는 경우가 많다. 그래서 한쪽만 파기보다 **플랫폼/클라우드 중심 + 운영 자동화 + 보안 기본기** 조합이 가장 좋다.

---

## 7. 특히 추천하는 스택 조합

지금까지 해온 경험과 연결해서 추천하면:

- **OS**: Linux(Rocky/Ubuntu 둘 다 경험)
- **Cloud**: AWS
- **IaC**: Terraform
- **Container**: Docker
- **Orchestration**: Kubernetes, EKS, Helm
- **CI/CD**: GitHub Actions, Argo CD
- **Monitoring**: Prometheus, Grafana, Loki
- **Scripting**: Python, Bash
- **DB**: MySQL/PostgreSQL, Redis
- **Messaging**: Kafka
- **Security**: IAM, WAF, Trivy, Secrets Manager, Cosign
- **Docs**: Markdown, Draw.io, README, runbook

이 조합이면 프로젝트 경험과도 맞고, 취업 포지션에도 잘 연결된다.

---

## 8. 면접에서 강해지려면 추가로 꼭 해야 하는 것

기술만 아는 걸로는 부족하다. 반드시 아래를 말할 수 있어야 한다.

- 왜 EC2 대신 EKS를 썼는지
- 왜 Kafka를 넣었는지
- 왜 Redis가 필요한지
- 장애가 났을 때 어떻게 탐지했는지
- 비용은 어떤 부분이 많이 나오는지
- 보안상 어떤 위험이 있었고 어떻게 줄였는지
- IaC를 왜 도입했는지
- GitOps의 장점이 뭔지

즉 **기술명 설명**보다 **의사결정 설명**을 연습해야 한다.

---

## 9. 당장 실행할 공부 순서

가장 현실적인 순서는 다음과 같다.

**Linux/네트워크 탄탄히 → AWS 3-tier 서비스 구축 → Docker → GitHub Actions → Terraform → Kubernetes → EKS → 모니터링/보안 고도화**

---

## 10. 결론

지금처럼 가면 단순 코딩 경쟁보다 오히려 유리한 방향으로 갈 수 있다.

키워야 하는 것은 아래 6가지다.

- **시스템 설계력**
- **운영 자동화**
- **장애 대응력**
- **클라우드/쿠버네티스 실무력**
- **보안/관측성 기본기**
- **AI를 활용하되 검증하는 능력**

그리고 기술 스택은 아래 축으로 가져가면 된다.

**AWS + Linux + 네트워크 + Docker + Kubernetes + Terraform + CI/CD + Monitoring**

