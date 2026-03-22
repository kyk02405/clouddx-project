# 2026-03-13 클라우드/인프라 신입 채용 관점 피드백

기준일: 2026년 3월 13일  
관점: "내가 클라우드/인프라 실무 담당자로서 신입 팀원을 뽑는다면 무엇을 높게 보겠는가"

## 한 줄 결론

신입에게 가장 경쟁력 있는 스펙은 **기술 이름을 많이 적는 것**이 아니라,  
**Linux/네트워크/AWS/Docker 기본기를 바탕으로 실제 서비스를 배포해보고, 장애를 로그와 메트릭으로 좁혀가며, 그 과정을 Terraform/CI/CD/문서화로 설명할 수 있는 상태**다.

즉, 채용에서 강한 신입은 보통 이런 사람이다.

- `기초가 단단하다`
- `작게라도 실제 운영 흐름을 끝까지 경험했다`
- `장애를 근거로 설명할 수 있다`
- `자동화/보안/비용을 함께 본다`
- `배운 것을 문서와 포트폴리오로 남긴다`

---

## 1. 중요도 순으로 보면 무엇이 가장 경쟁력 있나

### 1) 최우선: Linux + 네트워크 + Git + 스크립팅

이건 신입 클라우드/인프라 직무의 진짜 기본 체력이다.  
최근 공고를 보면 신입 또는 주니어 레벨에서도 반복적으로 나오는 요구사항이 `Linux`, `네트워크`, `AWS core`, `Shell/Python`, `협업`이다.

실무에서 이걸 높게 보는 이유:

- 인프라 문제는 결국 운영체제와 네트워크로 내려간다
- AWS 문제도 VPC, DNS, 라우팅, 보안그룹, 프로세스, 로그를 모르면 못 푼다
- 자동화는 결국 Shell/Python으로 이어진다
- 협업은 Git 없이 성립하지 않는다

신입에게 기대하는 수준:

- Linux
  - 파일 시스템, 권한, 프로세스, `systemd`, `journalctl`, 패키지 관리
  - `top`, `htop`, `df`, `du`, `free`, `ps`, `ss`, `lsof`, `curl`, `dig` 정도는 자연스럽게 사용
  - Nginx reverse proxy, 로그 확인, 서비스 재기동, 환경변수 관리 가능
- 네트워크
  - OSI 7계층을 외우는 수준이 아니라 `실무 문제와 연결`해서 설명 가능
  - CIDR, subnet, routing, DNS, NAT, TCP/UDP, TLS, Load Balancer, reverse proxy 이해
  - "왜 접속이 안 되는지"를 DNS/SG/NACL/포트/프로세스/헬스체크 순으로 좁혀갈 수 있음
- Git
  - branch 전략, merge/rebase 차이, conflict 해결, PR 리뷰 흐름 이해
- 스크립팅
  - Shell 또는 Python으로 반복 작업 자동화 가능
  - 예: 로그 압축, 백업, 배포 보조, 헬스체크, 비용 확인 스크립트

내가 면접에서 높게 평가하는 포인트:

- 명령어를 많이 아는가보다, **문제가 생겼을 때 어떤 순서로 확인하는지**
- "이론"이 아니라 **실제 확인 절차가 입에서 바로 나오는지**

### 2) 아주 중요: AWS core 서비스 이해와 아키텍처 감각

신입이 AWS를 "콘솔에서 눌러봤다" 수준으로 말하면 약하다.  
반대로 아래처럼 서비스 흐름을 연결해서 설명하면 강하다.

예:

`사용자 -> Route53 -> ACM -> ALB -> EC2/ECS/EKS -> RDS/ElastiCache -> CloudWatch`

중요 서비스 우선순위:

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
- Systems Manager
- ECR
- WAF

신입이 여기서 보여주면 좋은 것:

- public/private subnet 구분
- NAT Gateway를 왜 쓰는지
- ALB health check 실패 시 어떤 일이 생기는지
- RDS Multi-AZ를 왜 쓰는지
- IAM 최소 권한을 왜 써야 하는지
- EC2에 직접 SSH 붙는 대신 SSM을 쓰는 이유

실무 담당자 입장에서는 "AWS 자격증이 있나"보다  
**작은 서비스라도 AWS 위에 스스로 올려본 경험**을 더 높게 본다.

### 3) 아주 중요: Docker + CI/CD + 배포 자동화

이제 Docker는 선택이 아니라 기본에 가깝다.  
그리고 신입이 경쟁력을 가지려면 단순 컨테이너 실행보다 `배포 자동화`까지 묶여 있어야 한다.

필수에 가까운 내용:

- Docker 이미지와 컨테이너 차이
- Dockerfile 작성
- 멀티 스테이지 빌드
- 환경변수/Secret 주입
- 로그 확인
- Health check
- 이미지 최적화
- `docker compose` 또는 유사한 로컬 재현 환경

CI/CD에서 최소한 보여주면 좋은 것:

- GitHub Actions 또는 GitLab CI
- 테스트 -> 이미지 빌드 -> 레지스트리 푸시 -> 서버/클러스터 배포
- 실패 시 어디서 막혔는지 확인 가능
- rollback 또는 재배포 전략 설명 가능

실무에서는 "개발자가 만든 걸 내가 매번 수동 배포"하는 사람보다  
**안전하게 자동 배포되도록 만드는 사람**이 훨씬 가치 있다.

### 4) 아주 중요: 트러블슈팅 경험

이건 신입을 뽑을 때 생각보다 큰 차이를 만든다.  
왜냐하면 실무에서 결국 믿음이 가는 사람은 "문제 생겼을 때 도망가지 않는 사람"이기 때문이다.

좋은 트러블슈팅 경험 예시:

- `EC2/Nginx` 배포 후 502/504 발생
  - 원인: upstream 애플리케이션 포트 불일치, health check 실패, timeout 설정
- `RDS` 연결 실패
  - 원인: SG, subnet, DNS, connection pool 설정, max connections
- `Docker` 컨테이너가 계속 재시작
  - 원인: 환경변수 누락, 포트 충돌, volume 권한 문제
- `Kubernetes`에서 CrashLoopBackOff
  - 원인: Secret 미주입, readiness/liveness probe 실패, resource 부족
- CI/CD 실패
  - 원인: runner 권한, registry auth, tag 규칙, 환경 분리 실수

중요한 건 "문제를 겪었다"가 아니다.  
**문제를 어떤 근거로 좁혀갔는지**가 중요하다.

좋은 설명 구조:

1. 증상
2. 영향 범위
3. 처음 세운 가설
4. 확인한 로그/메트릭/설정
5. 최종 원인
6. 해결 방법
7. 재발 방지 조치

신입인데 이 구조로 2~3개만 이야기해도 꽤 강하다.

### 5) 중요: Terraform 등 IaC

2026년 시점에서 클라우드/인프라 직무를 길게 가져가려면 IaC는 거의 필수 방향이다.  
특히 AWS를 콘솔 클릭으로만 다루는 신입보다 Terraform으로 기본 인프라를 코드화한 신입이 훨씬 눈에 띈다.

신입이 가져가면 좋은 수준:

- `provider`, `resource`, `variable`, `output`
- module 기본 개념
- state가 왜 중요한지 이해
- dev/stage/prod 분리 감각
- `terraform plan` 결과를 읽고 설명 가능

포트폴리오에 좋게 보이는 예:

- VPC + subnet + route table + security group + EC2 + RDS
- 또는 ECS/EKS까지는 아니어도 EC2 기반 3-tier 구조

IaC가 중요한 이유:

- 재현 가능성
- 리뷰 가능성
- 변경 이력 관리
- 사람 실수 감소

### 6) 중요: Kubernetes는 "있으면 분명 강점", 하지만 기본기보다 앞서면 안 됨

현재 트렌드상 Kubernetes는 분명 중요하다.  
공고를 봐도 중상위 포지션은 거의 `AWS + Kubernetes + Terraform + GitOps + 관측성` 조합으로 간다.

다만 신입에게는 우선순위가 조금 다르다.

- 기본기 없는 Kubernetes는 약하다
- Linux/네트워크/AWS 없이 YAML만 외우면 실무에서 무너진다

신입에게 적절한 Kubernetes 수준:

- Pod / Deployment / Service / Ingress
- ConfigMap / Secret
- request/limit
- readiness/liveness probe
- rolling update / rollback
- Helm 기본

여기까지를 **직접 올려보고**, 왜 필요한지 설명할 수 있으면 충분히 강점이다.

좋은 어필:

- "EKS를 깊게 운영했다"보다
- "작은 서비스 하나를 Kubernetes에 올리고, 배포/로그/헬스체크/롤백까지 경험했다"

### 7) 중요: 모니터링/관측성

실무에서 운영 감각 있는 신입은 희소하다.  
그래서 관측성을 조금이라도 다뤄본 사람은 눈에 들어온다.

좋은 구성 예:

- CloudWatch 기본 메트릭과 로그
- Prometheus + Grafana
- Loki 또는 ELK/OpenSearch
- Alertmanager 또는 CloudWatch Alarm

중요한 건 툴 설치가 아니다.

- CPU만 보면 안 되는 이유
- 메모리, 디스크, 네트워크, 애플리케이션 응답속도, 에러율을 같이 봐야 하는 이유
- 로그와 메트릭의 차이
- trace가 필요한 상황

실무 담당자는 대체로 이런 말을 좋아한다.

- "문제가 생기면 어디를 먼저 볼지 알고 있습니다"
- "알람을 줄여야 할 때와 늘려야 할 때를 구분하려고 했습니다"

### 8) 중요: 보안과 비용 감각

최근 실무에서 더 중요해진 부분이다.  
이제 인프라 엔지니어는 그냥 띄우는 사람보다 **안전하고, 과금이 터지지 않게 운영하는 사람**이 더 높게 평가된다.

보안에서 신입이 최소한 챙겨야 할 것:

- IAM 최소 권한
- Secret 하드코딩 금지
- Security Group 전체 오픈 지양
- public/private subnet 구분
- HTTPS/TLS 기본
- 이미지 취약점 스캔 개념
- SSH 상시 개방보다 SSM 선호

비용에서 신입이 보여주면 좋은 것:

- EC2 sizing 고민
- 불필요한 리소스 정리
- S3 lifecycle
- CloudWatch 로그 보존기간
- NAT Gateway, ALB, EKS가 생각보다 비싸다는 감각
- dev/stage 환경 on/off 또는 scale-down 경험

실무에서는 "잘 만들었다"만큼 "얼마나 안전하고 합리적으로 만들었는가"가 중요하다.

### 9) 중요도는 상대적으로 낮지만 도움이 되는 것: 자격증

자격증은 분명 도움 된다.  
하지만 **자격증만으로 합격시키지는 않는다**.  
자격증은 보통 아래 의미로 본다.

- 최소 학습량을 증명
- 용어와 서비스 전반을 한 번 훑었다는 신호
- 면접 질문을 던지기 좋은 기준점

실무 기준 추천 순서:

1. `AWS Certified Solutions Architect - Associate`
2. `AWS Certified CloudOps Engineer - Associate`  
   현재 명칭 기준이며, 예전 `SysOps Administrator - Associate`의 업데이트된 시험이다.
3. `KCNA` 또는 `CKA`
4. 이후 필요 시 `AWS Certified Security - Specialty`

각 자격증을 어떻게 볼까:

- `AWS SAA`
  - 가장 무난하고 범용성이 좋다
  - AWS 전체 그림을 보는 데 좋다
  - 신입 포지션에서 가장 설명하기 쉽다
- `AWS CloudOps Engineer - Associate`
  - 운영/모니터링/보안/네트워킹/비용 최적화 쪽 성격이 더 강하다
  - 클라우드 운영 직무와 결이 잘 맞는다
- `KCNA`
  - 입문용으로는 깔끔하다
  - "쿠버네티스를 아예 모르는 건 아니다"라는 신호로 적당
- `CKA`
  - 실기형이라 체감 신뢰도가 높다
  - 다만 신입이 무리해서 따느라 기본기를 놓치면 오히려 역효과다
- `Security Specialty`
  - 좋지만 신입 초반 우선순위는 보통 아니다
  - AWS 운영 경험이 어느 정도 붙은 뒤가 더 낫다

결론적으로:

- 자격증은 **플러스 요인**
- 실습/장애 경험/문서화가 **당락 요인**

---

## 2. 지금 트렌드에 맞춰 보면 무엇이 더 중요해졌나

2026년 3월 기준으로 보면 아래 흐름이 분명하다.

### 1) Kubernetes와 플랫폼 엔지니어링은 더 이상 일부 회사만의 얘기가 아니다

최근 CNCF 자료를 보면 Kubernetes는 운영 환경에서 사실상 표준 인프라에 가까워졌고,  
GitOps, observability, platform engineering이 성숙도 지표처럼 취급되고 있다.

신입 관점 해석:

- "쿠버네티스가 뭔지 모른다"는 이제 약점이 될 수 있다
- 다만 "깊은 운영"보다 "기본 개념 + 실제 배포 경험"이 중요하다
- 앞으로 성장 가능성을 보여주기 위한 키워드로는 매우 좋다

### 2) IaC와 표준화, 플랫폼 팀 감각이 중요해졌다

HashiCorp 자료를 보면 많은 조직이 platform team을 만들고 있거나 이미 표준화를 시작했다.  
즉, 회사는 사람 한 명이 영웅처럼 수동 대응하는 것보다 `표준화된 운영 방식`을 원한다.

신입 관점 해석:

- Terraform
- 공통 배포 방식
- 환경 분리
- 모듈화
- 문서화

이런 것들을 이해하는 사람은 성장 가능성이 높다고 본다.

### 3) 비용 최적화는 더 이상 부가 업무가 아니다

Flexera 자료를 보면 클라우드 비용 관리는 여전히 상위 과제다.  
이 말은 곧, 신입도 "서비스를 띄울 줄만 아는 사람"이 아니라  
`얼마가 드는지`, `왜 이런 구성이 비싼지`, `어디를 줄일 수 있는지`를 고민하는 태도가 있으면 강하다는 뜻이다.

### 4) AI를 쓸 줄 아는 것보다, AI 결과를 검증할 줄 아는 것이 중요하다

DORA 2024, 2025 자료를 보면 AI 사용은 이미 보편화됐지만,  
기초 프로세스와 테스트, 빠른 피드백 루프가 약하면 오히려 불안정성이 커질 수 있다고 본다.

신입 관점 해석:

- AI로 Terraform 초안을 만들 수 있음
- AI로 Bash/Python 스크립트 초안을 만들 수 있음
- AI로 장애 로그를 요약할 수 있음

하지만 결국 중요한 건:

- 이 코드가 진짜 맞는지 검증했는가
- 테스트와 로그로 확인했는가
- 팀 문맥에 맞게 수정했는가

즉, AI 활용 능력은 플러스지만 **기본기 대체재는 아니다**.

---

## 3. 신입이 자주 놓치는 부분과 실수 사례

### 실수 1) 기술 이름만 많고, 실제 운영 흐름이 없다

예:

- "AWS, Docker, Kubernetes, Terraform, ArgoCD, Prometheus 해봤습니다"
- 그런데 정작 "하나의 서비스가 어떻게 배포되고 장애 시 어떻게 확인했는가"를 설명 못함

실무자가 느끼는 문제:

- 넓게 찍었지만 얕다
- 바로 투입했을 때 손에 잡히는 게 없다

올바른 방향:

- 기술 10개를 얕게 말하지 말고
- `서비스 1개를 끝까지 운영한 경험`으로 묶어서 설명

### 실수 2) 쿠버네티스를 너무 빨리, 너무 겉핥기로 공부한다

예:

- Pod, Deployment YAML 몇 번 작성
- Minikube hello world 정도
- 그런데 Linux 프로세스, DNS, reverse proxy, 네트워크는 약함

실무자가 느끼는 문제:

- 문제 생기면 레이어를 못 내려간다
- K8s를 해도 결국 원인 분석을 못 한다

올바른 방향:

- 먼저 Linux, 네트워크, Docker, AWS core를 단단히
- 그 위에 Kubernetes를 올려야 오래 간다

### 실수 3) 트러블슈팅을 "재시작해서 해결" 수준으로만 말한다

예:

- "오류가 나서 재배포했습니다"
- "다시 띄우니 됐습니다"

실무자가 느끼는 문제:

- 원인 분석 능력이 보이지 않는다
- 운 좋게 복구한 것인지 구분이 안 된다

올바른 방향:

- 로그 캡처
- 메트릭 변화
- 설정 diff
- 원인 후보 비교
- 재발 방지 조치

이걸 남겨야 한다.

### 실수 4) 보안과 비용을 거의 말하지 않는다

예:

- 모든 포트를 열어놓음
- DB를 public subnet에 둠
- IAM을 광범위하게 줌
- NAT/ALB/EKS 비용 개념이 없음

실무자가 느끼는 문제:

- 운영 리스크를 너무 가볍게 본다
- 실제 서비스 맡기기 불안하다

올바른 방향:

- 왜 private subnet으로 분리했는지
- 왜 최소 권한으로 줬는지
- 왜 개발 환경은 scale-down 했는지

이런 설명이 나와야 한다.

### 실수 5) 자격증이 곧 실무 역량이라고 생각한다

예:

- 자격증은 많은데 직접 배포해본 서비스가 없음
- 장애 경험이 없음
- README, 구조도, runbook이 없음

실무자가 느끼는 문제:

- 공부는 했는데 실제로 손에 남은 게 적다

올바른 방향:

- 자격증 1~2개 + 실습 프로젝트 1~2개 + 장애 문서 2개
- 이 조합이 훨씬 강하다

### 실수 6) 포트폴리오가 "구현 자랑"에만 머문다

예:

- 예쁜 화면
- 기능 소개
- 기술 스택 나열

실무자가 실제로 보고 싶은 것:

- 왜 이 구조를 선택했는지
- 장애가 났을 때 어떻게 대응했는지
- 운영과 보안을 어떻게 고려했는지
- 비용은 어떻게 봤는지

즉, 인프라 직무 포트폴리오는 **기능 소개서**가 아니라  
**운영 설계와 문제 해결 보고서**에 가까워야 한다.

---

## 4. 그러면 신입으로서 어떤 스펙 조합이 가장 경쟁력 있나

내가 실제로 "서류에서 눈에 띄고, 면접에서 기대감이 생기는 신입"이라고 느끼는 조합은 대략 이렇다.

### 조합 A: 가장 현실적이고 강한 기본형

- Linux / 네트워크 기초 단단함
- AWS EC2, VPC, RDS, S3, ALB 정도 직접 사용
- Docker로 서비스 컨테이너화
- GitHub Actions 또는 GitLab CI로 자동 배포
- 장애 경험 2건 이상 문서화
- AWS SAA 보유

이 조합은 가장 무난하면서도 실무 적응력이 좋다.

### 조합 B: 인프라/DevOps 성향이 더 강한 형

- 조합 A 포함
- Terraform으로 기본 인프라 코드화
- CloudWatch 또는 Prometheus/Grafana 구성
- Shell/Python 자동화 스크립트 작성
- AWS CloudOps Engineer - Associate 또는 KCNA 추가

이 조합이면 "운영 자동화 감각이 있다"는 인상을 줄 수 있다.

### 조합 C: 쿠버네티스까지 확실히 어필하는 형

- 조합 B 포함
- 작은 서비스 하나를 Kubernetes 또는 EKS에 배포
- Ingress, Secret, probe, resource limit, rollback 경험
- CrashLoopBackOff, Ingress 라우팅, 이미지 pull 실패 같은 문제 해결 경험
- KCNA 또는 CKA

이 조합은 확실히 눈에 띈다.  
다만 기본기가 약한 상태에서 억지로 만들면 오히려 질문 몇 개에 무너질 수 있다.

---

## 5. 자격증보다 더 강한 포트폴리오 구성 방식

클라우드/인프라 신입 포트폴리오는 아래 6개가 있으면 강하다.

### 1) 아키텍처 다이어그램

- 사용자 진입점
- 네트워크 구간
- 컴퓨트
- DB/스토리지
- 모니터링
- 보안 포인트

### 2) IaC 또는 인프라 구성 문서

- Terraform 코드 또는 수동 구성 절차
- 환경 분리 기준
- 주요 설정 이유

### 3) 배포 자동화 흐름

- push
- test
- build
- registry
- deploy
- rollback

### 4) 장애 대응 보고서 2~3개

- 증상
- 원인
- 근거
- 해결
- 재발 방지

### 5) 운영 체크리스트 또는 runbook

- 배포 전 확인
- 장애 시 확인 순서
- 롤백 절차
- 로그 위치

### 6) 비용/보안 개선 포인트

- 어떤 리소스가 비용을 많이 먹었는지
- 어떤 권한을 줄였는지
- 어떤 포트를 닫았는지

이걸 갖춘 포트폴리오는 단순 공부 흔적보다 훨씬 실무적으로 보인다.

---

## 6. 앞으로의 올바른 공부 방향

핵심은 **많이 배우는 것**보다 **하나를 끝까지 운영해보는 것**이다.

### 추천 학습 순서

#### 1단계: 기초 체력 고정

- Linux
- 네트워크
- Git
- Shell/Python

목표:

- 서버 한 대에 애플리케이션 띄우기
- 로그 보기
- 프로세스 보기
- 네트워크 문제 찾기

#### 2단계: AWS core로 작은 서비스 운영

- VPC
- EC2
- ALB
- RDS
- S3
- CloudWatch

목표:

- 3-tier 구조를 직접 올려보기
- HTTPS 붙이기
- 로그/메트릭 보기
- 비용이 어디서 나가는지 확인하기

#### 3단계: Docker + CI/CD

- Dockerfile
- compose
- 레지스트리
- GitHub Actions/GitLab CI

목표:

- 수동 배포를 자동 배포로 바꾸기

#### 4단계: Terraform

- 인프라를 코드로 재현
- dev/stage 분리
- 변수화

목표:

- "내 환경을 다시 만들 수 있다"를 보여주기

#### 5단계: Kubernetes

- 작은 서비스 배포
- rollout / rollback
- Secret / ConfigMap
- probe / ingress

목표:

- 쿠버네티스 운영의 기본 흐름 체험

#### 6단계: 관측성 + 보안 + 비용

- CloudWatch 또는 Prometheus/Grafana
- IAM 최소 권한
- Secret 관리
- 비용 줄이기

목표:

- 운영 감각까지 가진 신입으로 보이기

---

## 7. 현실적인 12주 학습 플랜

### 1~4주

- Linux와 네트워크 복습
- AWS에 EC2 + Nginx + App + RDS 구조 배포
- 도메인/HTTPS 연결
- 배포 문서 작성

### 5~8주

- Dockerfile 정리
- GitHub Actions 또는 GitLab CI 구축
- CloudWatch 알람 추가
- 장애 1~2개 일부러 만들어보고 기록

### 9~12주

- Terraform으로 인프라 일부 코드화
- Kubernetes 또는 EKS/k3s에 서비스 배포
- 로그/메트릭 대시보드 구성
- 최종 README, 구조도, 트러블슈팅 문서 정리

이 12주를 제대로 하면,  
말만 많은 포트폴리오보다 훨씬 강한 결과물이 나온다.

---

## 8. 면접에서 이렇게 말하면 강하다

좋은 답변 예시 방향:

- "이 기술을 배웠습니다"보다 "이 문제를 해결하기 위해 이 기술을 선택했습니다"
- "쿠버네티스를 써봤습니다"보다 "배포/헬스체크/롤백까지 경험했습니다"
- "AWS를 할 줄 압니다"보다 "VPC, ALB, RDS, CloudWatch를 연결해서 운영했습니다"
- "문제를 해결했습니다"보다 "로그와 메트릭을 보고 원인을 좁혀갔습니다"

인프라 직무는 결국 `도구 설명`보다 `판단 설명`이 중요하다.

---

## 9. 최종 정리

신입으로 가장 경쟁력 있는 스펙은 아래 순서라고 본다.

1. Linux + 네트워크 + Git + 스크립팅 기본기
2. AWS core 서비스 이해와 실제 배포 경험
3. Docker + CI/CD 자동화 경험
4. 근거 기반 트러블슈팅 경험
5. Terraform 등 IaC 경험
6. Kubernetes 기본 운영 경험
7. 모니터링/보안/비용 감각
8. 자격증은 보조 지표

그래서 지금 가장 좋은 전략은:

- 자격증만 쌓기보다
- 작은 서비스 하나를 `설계 -> 배포 -> 모니터링 -> 장애 대응 -> 자동화 -> 문서화`까지 끝내는 것

이걸 해낸 신입은 실제 채용시장에서도 분명히 경쟁력이 있다.

---

## 참고한 최근 자료

아래 링크들은 2026년 3월 13일 기준으로 확인했으며, 채용 공고는 시점에 따라 마감 또는 변경될 수 있다.

- CNCF, 2025 Annual Cloud Native Survey announcement, 2026-01-20  
  https://www.cncf.io/announcements/2026/01/20/kubernetes-established-as-the-de-facto-operating-system-for-ai-as-production-use-hits-82-in-2025-cncf-annual-cloud-native-survey/
- CNCF, CNPA announcement, 2025-06-15  
  https://www.cncf.io/blog/2025/06/15/introducing-the-certified-cloud-native-platform-engineering-associate-cnpa-community-driven-certification-for-platform-engineers/
- HashiCorp, 2024 State of Cloud Strategy Survey  
  https://www.hashicorp.com/en/state-of-the-cloud
- Flexera, 2025 State of the Cloud press release, 2025-03-19  
  https://www.flexera.com/about-us/press-center/new-flexera-report-finds-84-percent-of-organizations-struggle-to-manage-cloud-spend
- Google Cloud, DORA 2024 report overview, 2024-10-23  
  https://cloud.google.com/blog/products/devops-sre/announcing-the-2024-dora-report
- Google Cloud, DORA 2025 report overview, 2025-09-24  
  https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report
- AWS, AWS Certified Solutions Architect - Associate  
  https://aws.amazon.com/ko/certification/certified-solutions-architect-associate/
- AWS, AWS Certified CloudOps Engineer - Associate  
  https://aws.amazon.com/ko/certification/certified-cloudops-engineer-associate/
- Linux Foundation, KCNA  
  https://training.linuxfoundation.org/certification/kubernetes-cloud-native-associate/
- Linux Foundation, CKA  
  https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/
- Wanted 예시 공고, 클라우드호스피탈 DevOps 엔지니어 (Kubernetes)  
  https://www.wanted.co.kr/wd/203760
- Wanted 예시 공고, 스마일샤크 AWS 클라우드 서비스 운영 엔지니어  
  https://www.wanted.co.kr/wd/266487
- Wanted 예시 공고, 레브잇 DevOps Engineer  
  https://www.wanted.co.kr/wd/311606
- Wanted 예시 공고, 헤리트 클라우드 인프라 엔지니어  
  https://www.wanted.co.kr/wd/345087
