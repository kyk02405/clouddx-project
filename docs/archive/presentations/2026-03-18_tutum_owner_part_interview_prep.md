# TUTUM 발표 후 질의응답 대비 정리

- 작성일: `2026-03-18`
- 목적: 발표 후 기업 실무자/팀장급 질의응답 대비
- 범위: 내가 맡은 파트 중심
  - `Backend API 개발`
  - `Data Layer(MariaDB, MongoDB, Redis, Elasticsearch) 연동 및 정합성 관리`
  - `실시간 시세 API와 뉴스·검색 파이프라인 운영 정합화`
  - `Bedrock/AI 응답 경로 및 RAG 연동`
  - `Admin 모니터링/Observability 기능 개발`
  - `AWS 마이그레이션 후 서비스 안정화`

---

## 0. 이 문서를 어떻게 쓰면 좋은가

이 문서는 단순 발표 원고가 아니라, 질문이 들어왔을 때 근거 있게 답하기 위한 준비 문서다.

면접/발표 현장에서는 아래 순서로 답하면 안정적이다.

1. 왜 이 문제가 있었는지
2. 왜 이 기술을 선택했는지
3. 실제로 어떻게 구현했는지
4. 운영에서 어떤 문제가 있었고 어떻게 보완했는지
5. 지금 구조의 장점과 한계가 무엇인지

즉, "기술 이름"보다 `선택 이유 + 실제 구현 + 운영 경험`을 같이 말해야 한다.

---

## 1. 내가 맡은 파트 한눈에 보기

### 1-1. 역할 요약

나는 TUTUM 프로젝트에서 백엔드/서비스 운영 중심 역할을 맡아 아래 영역을 담당했다.

- FastAPI 기반 Backend API 개발 및 운영
- Data Layer(MariaDB, MongoDB, Redis, Elasticsearch) 연동 및 정합성 관리
- 실시간 시세 API, Redis fallback, 차트용 데이터 경로 보강
- 뉴스·검색 파이프라인의 Kubernetes 이관 이후 운영 정합화와 AI/RAG 연동
- Bedrock Claude + Titan Embed 기반 AI 응답 경로 개선
- `/admin` 모니터링 대시보드와 LGTM 기반 관측 기능 개발
- AWS EKS 마이그레이션 이후 서비스 레벨 안정화와 운영 복구

### 1-2. 한 문장 요약

`사용자 기능`과 `운영 기능`을 함께 담당했다.  
즉, 사용자가 보는 시세/AI 기능과 운영자가 보는 관측/장애 복구 체계를 함께 맡았고, 클러스터 구축 자체보다는 서비스가 실제로 정상 동작하게 만드는 역할에 가까웠다.

---

## 2. 담당 파트별 상세 정리

## 2-1. Backend API 개발

### 내가 한 일

- FastAPI 기반으로 자산, 포트폴리오, 시세, 뉴스, 채팅, 알림, 관리자 API를 개발
- `backend`를 중심으로 `auth`, `ocr`와의 연동 경로를 정리하고 운영
- MariaDB, MongoDB, Redis, Kafka, Elasticsearch를 API와 연결
- 운영성 강화를 위해 rate limit, fallback, trace-aware logging, readiness/liveness까지 포함

### 왜 이렇게 구성했는가

- 팀 규모가 작고 AI/OCR 연동이 핵심이라 Python 기반 백엔드가 유리했다.
- FastAPI는 비동기 I/O에 강해서 외부 API(KIS, Upbit, Bedrock, Loki, Mimir) 호출이 많은 구조와 잘 맞았다.
- 메인 API와 별도 서비스(`auth`, `ocr`)를 분리한 이유는 배포 단위와 장애 범위를 분리하기 위해서다.

### 핵심 구조

- `backend`: 메인 API, 포트폴리오/시세/뉴스/AI
- `auth`: 로그인, 소셜 로그인, 이메일 인증
- `ocr`: 이미지 자산 인식 전용 API

### 대표 파일

- `backend/app/main.py`
- `backend/app/routers/market.py`
- `backend/app/routers/news.py`
- `backend/app/routers/chat.py`
- `backend/app/mariadb.py`
- `auth/app/routers/auth.py`

### 실무적으로 강조할 포인트

- 단순 CRUD가 아니라 외부 API 의존성과 운영 fallback을 함께 고려한 API 구조
- health/readiness, rate limit, trace logging, cache fallback까지 포함한 운영형 백엔드

---

## 2-2. Data Layer 연동 및 정합성 관리

### 내가 한 일

- `MariaDB`를 사용자/포트폴리오 관계형 데이터의 기준 저장소로 운영
- `MongoDB Atlas -> EKS ReplicaSet` cutover를 수행해 애플리케이션 데이터 source of truth를 클러스터 내부로 수렴
- `MariaDB -> MongoDB fallback` 포트폴리오 조회 경로를 정리해 서비스 복원력을 높임
- `Redis`에 실시간 가격 캐시와 `last_good` 백업 구조를 적용해 외부 API 실패 시 0원/빈 응답을 방지
- `MongoDB` 원문 저장소와 `Elasticsearch` 검색 인덱스 역할을 분리하고, backfill과 정합성 점검을 수행

### 왜 DB를 하나로 통일하지 않았는가

- `MariaDB`는 사용자, 포트폴리오처럼 정합성과 관계가 중요한 데이터에 적합했다.
- `MongoDB`는 뉴스 원문, 캔들, 보조 자산 데이터처럼 문서 구조가 유연한 데이터에 더 잘 맞았다.
- `Redis`는 짧은 지연이 필요한 시세 캐시, 세션, 레이트리밋에 적합했다.
- `Elasticsearch`는 검색 최적화와 BM25/kNN 하이브리드 검색을 담당했다.

즉, 저장소를 나눈 기준은 기술 취향이 아니라 `데이터 성격과 조회 패턴`이었다.

### 핵심 구조

1. 관계형 기준 데이터: `MariaDB`
2. 문서형 원문 데이터: `MongoDB`
3. 실시간 캐시와 백업 캐시: `Redis`
4. 검색/벡터 인덱스: `Elasticsearch`

### 대표 파일

- `backend/app/mariadb.py`
- `backend/app/database.py`
- `backend/app/cache.py`
- `backend/app/routers/market.py`
- `backend/app/services/chat_service.py`
- `backend/workers/consumer_news.py`
- `backend/workers/elastic_consumer.py`

### 실무적으로 강조할 포인트

- 단순히 DB를 많이 쓴 것이 아니라, 각 저장소의 역할을 분리해서 장애 전파를 줄이고 운영 복원력을 높인 구조
- source of truth와 fallback 경로를 의식적으로 설계했다는 점

---

## 2-3. 실시간 시세 API와 뉴스·검색 파이프라인 운영 정합화

### 내가 한 일

- 실시간 시세 조회 경로에서 `Redis 현재 캐시 -> last_good -> 외부 API` fallback 구조를 보강
- 주식/코인 bulk price API가 0원이나 빈 값으로 무너지지 않도록 cache/backup 경로를 정리
- 기존 node3 기반 뉴스 파이프라인을 Kubernetes 매니페스트 구조로 이관하고 worker 설정을 정렬
- `news-producer` CrashLoopBackOff를 복구하고, `elastic-consumer` 상시 운영 및 임베딩 플래그를 정리
- Elasticsearch backfill, consumer warm 유지, MongoDB/Elasticsearch 정합성 점검을 통해 AI 검색 품질 기반을 안정화

### 왜 Kafka를 썼는가

- Producer와 Consumer를 느슨하게 분리할 수 있다.
- 외부 API 응답 속도와 내부 저장 속도를 직접 묶지 않아도 된다.
- 뉴스 저장과 검색 인덱싱을 분리할 수 있다.
- Kafka lag를 기준으로 KEDA 오토스케일링을 붙이기 쉽다.

### 왜 Redis를 썼는가

- 시세 조회는 지연이 짧아야 하므로 DB보다 캐시가 먼저다.
- 최신 가격은 짧은 TTL로 보관하고, `last_good` 백업으로 외부 API 실패 시 fallback 가능하게 했다.
- 세션, rate limit 같은 운영 기능도 Redis와 잘 맞는다.

### 왜 MongoDB와 Elasticsearch를 같이 썼는가

- MongoDB는 뉴스 원문 저장소이자 fallback 저장소 역할
- Elasticsearch는 BM25와 벡터 검색을 함께 처리하는 검색 인덱스 역할
- 둘을 같이 써서 `원문 저장`과 `검색 최적화`를 분리했다.

### 핵심 구조

1. 기존 뉴스 수집기가 Kafka `news.raw`를 발행
2. `news-consumer`가 MongoDB에 원문 저장
3. `elastic-consumer`가 Elasticsearch에 검색용 문서 저장
4. 필요 시 Titan Embed v2로 문서 임베딩 생성
5. 챗봇은 ES를 우선 조회하고 실패 시 MongoDB fallback
6. 시세는 Redis 캐시와 `last_good`으로 안정성 확보

### 대표 파일

- `backend/workers/producer_news.py`
- `backend/workers/consumer_news.py`
- `backend/workers/elastic_consumer.py`
- `backend/workers/price_consumer.py`
- `backend/workers/candle_aggregator.py`
- `backend/app/cache.py`
- `backend/app/routers/market.py`

### 실무적으로 강조할 포인트

- 새 파이프라인을 0부터 모두 설계했다기보다, 기존 파이프라인을 Kubernetes/AWS 환경에 맞게 이관하고 운영 가능한 상태로 안정화한 경험이 핵심
- 외부 API 실패를 캐시와 fallback으로 버티는 운영형 설계
- 검색 인덱스와 원문 저장소를 분리해 장애 전파를 줄인 구조

---

## 2-4. Bedrock/AI 응답 경로 및 RAG 연동

### 내가 한 일

- 사용자 질문이 들어오면 단순히 LLM에 바로 던지지 않고, 포트폴리오/시세/뉴스 컨텍스트를 먼저 수집
- Elasticsearch BM25 + kNN 하이브리드 검색 구현
- Titan Embed v2로 문서 임베딩과 쿼리 임베딩 생성
- Bedrock Claude Sonnet 4.6으로 최종 응답 생성
- 질문 의도 분석, ETF/종목 인식, 최근 뉴스 우선 검색, 포트폴리오 키워드 주입 제어 로직 개선

### 왜 Bedrock을 썼는가

- AWS 환경에서 IAM, Secret, 네트워크와 통합하기 쉬웠다.
- 직접 GPU나 모델 서버를 운영하지 않아도 된다.
- 모델 전환과 운영 표준화가 쉬웠다.
- 프로젝트 규모에서 self-hosted LLM보다 운영 리스크가 낮았다.

### 왜 Elasticsearch 하이브리드 검색을 썼는가

- 금융/뉴스 질의는 키워드 정확도도 중요하고 의미 기반 검색도 중요하다.
- BM25만 쓰면 의미 검색이 약하고, 벡터만 쓰면 정확한 키워드 매칭이 약할 수 있다.
- 그래서 `BM25 60% + kNN 40%` 방식으로 하이브리드 검색을 사용했다.

### 왜 MongoDB fallback을 넣었는가

- ES가 비어 있거나 실패해도 뉴스 원문 조회가 아예 끊기지 않게 하기 위해서다.
- MongoDB는 뉴스 원문 저장소이기 때문에 fallback source로 적합하다.

### AI 응답 흐름

1. Frontend AI Chat
2. Next.js proxy
3. Backend `chat.py`
4. `chat_service.py`
5. 포트폴리오 조회: `MariaDB -> MongoDB fallback`
6. 시세 조회: `Upbit / KIS`
7. 뉴스 조회: `Elasticsearch -> MongoDB fallback`
8. 쿼리 임베딩 생성: `Titan Embed`
9. Bedrock Claude 응답 생성
10. SSE 스트리밍으로 프론트 반환

### 대표 파일

- `backend/app/routers/chat.py`
- `backend/app/services/chat_service.py`
- `backend/app/services/market_data.py`
- `backend/app/routers/news.py`

### 실무적으로 강조할 포인트

- "AI를 붙였다"가 아니라 `컨텍스트를 먼저 조립한 뒤 응답하는 구조`
- 금융 질의 특성상 최신성, 관련성, fallback이 중요하다는 점을 이해하고 설계

---

## 2-5. Admin 모니터링 / Observability 기능 개발

### 내가 한 일

- `/admin` 대시보드를 직접 설계하고, FastAPI Admin API와 Next.js 화면을 연결
- Mimir, Loki, Tempo, Kubernetes API, Bedrock 진단을 하나의 운영 화면으로 통합
- Overview, Infra, Pipeline, Data, Backup, Logs, Traces, AI 분석 흐름 구성
- 로그에 trace ID를 남기고, 로그에서 Grafana Tempo trace 링크로 연결되는 구조까지 보강
- 로그 severity를 `CRITICAL / WARN / INFO`로 분류하는 규칙 기반 로직 추가

### 왜 LGTM을 썼는가

- 메트릭, 로그, 트레이스를 각각 따로 두지 않고 하나의 관측 체계로 묶을 수 있다.
- Grafana 생태계로 시각화와 탐색이 쉽다.
- Loki/Tempo/Mimir 조합이 쿠버네티스 운영 모니터링에 잘 맞았다.

### 왜 Grafana만 쓰지 않고 `/admin`을 따로 만들었는가

- Grafana는 원본 탐색 도구로는 좋지만, 서비스 맞춤 운영 화면은 아니다.
- 우리는 Kubernetes 상태, 파이프라인 상태, 백업 상태, AI 요약 진단까지 한 화면에서 보고 싶었다.
- 운영자가 매번 Grafana, kubectl, 로그창을 오가지 않게 하기 위해 서비스 맞춤 콘솔을 만든 것이다.

### 왜 Kibana를 운영 모니터링에 넣지 않았는가

- 현재 Elasticsearch는 운영 로그 저장소보다 `뉴스 검색/RAG 인덱스` 역할이 더 크다.
- 운영 로그의 중심은 Loki이고, 트레이스는 Tempo, 메트릭은 Mimir가 담당한다.
- 그래서 운영 모니터링 설명에서는 Kibana를 핵심 스택으로 넣지 않는 것이 더 정확하다.

### 관측 구조

- 애플리케이션 로그: FastAPI + trace-aware logging
- 메트릭: Alloy 수집 -> Mimir 저장
- 로그: Alloy 수집 -> Loki 저장
- 트레이스: OpenTelemetry -> Alloy -> Tempo
- 운영 화면: `/admin`

### 대표 파일

- `backend/app/routers/admin.py`
- `backend/app/main.py`
- `frontend/frontend/app/admin/page.tsx`
- `k8s-manifests/step3-lgtm/*`

### 실무적으로 강조할 포인트

- 운영 도구를 "보여주기용 페이지"가 아니라 실제 장애 대응 콘솔로 만들었다는 점
- 메트릭, 로그, 트레이스를 연결해서 운영 판단 속도를 높이려 했다는 점

---

## 2-6. AWS 마이그레이션 후 서비스 안정화

### 내가 한 일

- AWS staging EKS 구조 기준으로 서비스 동작 경로를 정리
- `auth` 서비스와 메인 서비스가 실제로 연결되도록 ALB 라우팅, PeerAuthentication, 시크릿 동기화, 프록시 경로를 복구
- MongoDB Atlas -> EKS in-cluster ReplicaSet cutover
- 프론트 프록시, ALB target group, proxy route, callback redirect 등 운영 장애 복구
- 비용 급증 원인 분석 후 staging only 전략과 full down/up 운영 자동화

### 왜 이 부분이 중요했는가

- AWS로 옮기는 것 자체보다, 옮긴 뒤 서비스가 정상 동작하고 운영 가능한 상태가 되는 것이 더 중요하다.
- 실제 운영에서는 "배포 완료"보다 `라우팅, 시크릿, 데이터 연결, 관측, 복구 절차`가 더 큰 이슈가 된다.

### 핵심 안정화 포인트

- auth와 메인 서비스 간 실제 동작 경로 복구
- ALB target group/ingress/proxy 라우팅 정비
- ExternalSecret/Secrets Manager 동기화 확인
- MongoDB source of truth 통일
- full down/up 스크립트 검증

### 대표 파일/문서

- `docs/plans/infra/AWS_STAGING_TOPOLOGY_ARCHITECTURE_2026-03-16.md`
- `docs/dev_logs/3월_둘째주/2026-03-11_auth_service_eks_deploy.md`
- `docs/dev_logs/3월_둘째주/2026-03-11_tutum_my_frontend_proxy_and_alb_recovery.md`
- `docs/dev_logs/3월_둘째주/2026-03-12_mongodb_atlas_to_eks_replicaset_cutover.md`
- `docs/dev_logs/3월_둘째주/2026-03-13_finops_cost_reduction_staging_only_strategy.md`
- `docs/dev_logs/3월_둘째주/2026-03-14_staging_full_down_up_validation_and_final_down.md`

### 실무적으로 강조할 포인트

- 마이그레이션은 기술 이전이 아니라 운영 위험을 줄이는 작업이라는 관점
- 실제 장애와 드리프트를 손으로 잡아본 경험이 있다는 점

---

## 3. 이해하기 쉬운 구조 설명

## 3-1. Backend API 구조

짧게 설명하면:

`Frontend -> Next.js proxy -> FastAPI backend/auth/ocr -> DB/Cache/AI/Workers`

핵심은 프론트가 직접 모든 외부 API를 치지 않고, 내부 서비스가 데이터와 정책을 통합해서 응답한다는 점이다.

---

## 3-2. 실시간 시세 구조

짧게 설명하면:

`외부 시세 소스(Upbit/KIS) -> Producer -> Kafka -> Consumer -> Redis -> API 응답`

보완 구조:

- 최신값은 `Redis`
- API 실패 시 `last_good`
- 일부 이력/캔들은 `MongoDB`

즉, 실시간성과 안정성을 같이 가져가려는 구조다.

---

## 3-3. 뉴스/RAG 구조

짧게 설명하면:

`뉴스 수집 -> Kafka -> MongoDB 원문 저장 + Elasticsearch 검색 인덱스 -> AI 챗봇이 조회`

보완 구조:

- Elasticsearch 우선 검색
- 실패/결과 부족 시 MongoDB fallback
- Titan 임베딩으로 kNN 검색

즉, 저장과 검색을 분리해 운영한다.

---

## 3-4. AI 응답 구조

짧게 설명하면:

`질문 -> 포트폴리오 조회 + 시세 조회 + 뉴스 검색 -> Bedrock Claude -> 스트리밍 응답`

핵심은:

- 그냥 LLM 호출이 아님
- 개인 자산과 실시간 데이터, 뉴스 컨텍스트를 함께 반영
- 금융 질문 특성상 최신성과 근거를 같이 보려는 구조

---

## 3-5. 모니터링 구조

짧게 설명하면:

`앱/클러스터 -> Alloy -> Mimir/Loki/Tempo -> /admin + Grafana`

즉:

- 원본 관측 데이터는 LGTM 스택에 저장
- 실제 운영 판단은 `/admin`에서 서비스 맞춤형으로 보여줌

---

## 4. 팀장급 예상 질문과 모범 답안

## 4-1. Backend API / 기술 선택

### Q1. 왜 Spring Boot나 NestJS가 아니라 FastAPI를 썼나요?

### A.

TUTUM은 AI, OCR, 외부 시세 API, 뉴스 수집, Bedrock 연동 같은 Python 친화적 요소가 많았습니다.  
그래서 메인 API와 AI/RAG, 워커를 같은 언어 생태계에서 관리하는 편이 개발 속도와 유지보수 측면에서 유리했습니다.  
또 FastAPI는 비동기 I/O에 강해서 KIS, Upbit, Bedrock, Loki, Mimir처럼 외부 호출이 많은 구조에 잘 맞았습니다.

다만 FastAPI를 썼다고 해서 단순한 구조로 두지 않고, `backend/auth/ocr`를 역할별로 분리하고 readiness, rate limit, trace logging, fallback까지 넣어 운영형 구조로 만들었습니다.

---

### Q2. 왜 auth를 backend 안에 두지 않고 분리했나요?

### A.

소셜 로그인, callback, 이메일 인증, rate limit은 보안 민감도가 높고 배포 이슈도 따로 생기기 쉬웠습니다.  
그래서 메인 비즈니스 API와 분리하면 장애 범위를 줄일 수 있고, 인증 경로만 별도 점검하거나 재배포하기도 쉬워집니다.

실제로 AWS 마이그레이션 후 auth 서비스가 독립 배포되지 않아 Google 로그인 라우팅이 깨졌고, 이 과정에서 서비스 분리의 필요성을 더 명확히 체감했습니다.

---

### Q3. 왜 MariaDB와 MongoDB를 같이 썼나요? 하나로 못 가나요?

### A.

서로 역할이 다르기 때문입니다.

- MariaDB는 `users`, `portfolio`처럼 정합성이 중요한 관계형 데이터
- MongoDB는 뉴스 원문, 캔들, 보조 자산 데이터처럼 구조가 유연한 문서형 데이터

하나로 통일할 수도 있지만, 이 프로젝트에서는 데이터 접근 패턴이 달랐고, 특히 뉴스/RAG 쪽은 MongoDB가 더 잘 맞았습니다.  
그래서 관계형과 문서형을 역할별로 분리했습니다.

---

## 4-2. Data Layer / 정합성 / 캐시 전략

### Q4. 왜 DB를 MariaDB, MongoDB, Redis, Elasticsearch로 나눴나요? 너무 복잡하지 않나요?

### A.

복잡해 보일 수 있지만, 각각의 역할이 분명했습니다.

- `MariaDB`: 사용자, 포트폴리오 같은 정합성 중심 데이터
- `MongoDB`: 뉴스 원문, 캔들, 보조 데이터 같은 문서형 데이터
- `Redis`: 실시간 가격 캐시, 세션, 레이트리밋
- `Elasticsearch`: 검색 인덱스와 RAG용 BM25/kNN 검색

즉, "저장 기술을 많이 써보고 싶어서"가 아니라 데이터 성격과 조회 패턴이 달라서 분리한 겁니다.  
오히려 하나로 밀어 넣으면 성격이 다른 요구사항을 한 저장소가 모두 떠안게 됩니다.

---

### Q5. MongoDB Atlas에서 EKS ReplicaSet으로 왜 옮겼나요?

### A.

운영 기준 데이터 경로를 클러스터 내부로 통일하기 위해서였습니다.  
당시 Atlas와 local Mongo에 데이터가 분산되어 있어서 어떤 쪽이 source of truth인지 불명확했고, 서비스 복구나 운영 점검 시 혼선이 있었습니다.

그래서 Atlas 데이터를 EKS ReplicaSet으로 merge/upsert하고, backend/auth/ocr/worker가 모두 같은 ReplicaSet을 바라보도록 정리했습니다.  
이 작업의 핵심은 단순 이전이 아니라 `데이터 기준점 통일`이었습니다.

---

### Q6. 실시간 가격에서 왜 Redis `last_good`까지 두었나요?

### A.

외부 API 실패나 토큰 만료가 발생했을 때 바로 0원이나 빈 응답이 내려가면 사용자 경험이 크게 깨집니다.  
그래서 구조를 이렇게 가져갔습니다.

- 1차: Redis 현재 캐시
- 2차: `last_good` 백업 캐시
- 3차: 외부 API 직접 호출

즉, 시세 데이터는 "항상 최신값만"이 아니라 "최대한 유효한 값"을 우선 보여주도록 설계했습니다.

---

### Q7. MongoDB와 Elasticsearch 정합성은 어떻게 맞췄나요?

### A.

MongoDB는 원문 저장소, Elasticsearch는 검색 인덱스라 역할이 다르기 때문에 완전히 같은 개수만 보는 것은 위험할 수 있습니다.  
그래도 운영상 정합성 점검은 필요해서 다음을 수행했습니다.

- `elastic-consumer`를 상시 기동해 색인 지연 최소화
- backfill로 부족한 문서 재적재
- Admin/Data 탭에서 Mongo 뉴스 건수와 ES indexed docs를 같이 확인

즉, 1:1 개수 강박보다는 `검색 품질에 문제 없는 수준으로 지속 동기화`하는 방향으로 운영했습니다.

---

## 4-3. 실시간 시세 / 뉴스 / 검색 파이프라인

### Q8. 실시간 시세를 그냥 API로 바로 호출하면 되지, 왜 Kafka까지 썼나요?

### A.

직접 호출만으로는 외부 API 속도와 내부 저장/가공 로직이 강하게 결합됩니다.  
Kafka를 넣으면 Producer와 Consumer를 분리할 수 있어서 다음 장점이 있습니다.

- 외부 API 응답 속도와 내부 처리 속도 분리
- price cache 업데이트와 candle 집계를 서로 분리
- 뉴스 저장과 검색 인덱싱도 서로 독립적으로 운영 가능
- Kafka lag 기준 KEDA 오토스케일링 가능

즉, Kafka는 단순 큐가 아니라 확장성과 장애 격리를 위한 핵심 계층입니다.

---

### Q9. 외부 API rate limit 나면 어떻게 하나요?

### A.

rate limit이나 외부 API 실패를 전제로 설계했습니다.

시세 경로 기준으로는:

- 1차: Redis 현재 캐시
- 2차: `last_good` 백업 캐시
- 3차: 외부 API 직접 호출

또 KIS는 토큰 만료 코드가 오면 자동 재발급하고, Upbit/KIS는 가능하면 실시간 feed를 먼저 사용합니다.  
즉, 페이지를 열 때마다 외부 API에 직접 의존하지 않도록 설계했습니다.

---

### Q10. Redis가 죽으면 시세 API는 어떻게 되나요?

### A.

Redis가 죽으면 캐시와 `last_good` 경로는 못 쓰게 됩니다.  
그 경우에는 외부 API 직접 호출로 내려가고, 외부 API도 실패하면 error 응답을 주게 됩니다.

다만 보안/과금 민감 엔드포인트인 chat, login, register, admin_ai는 Redis 미연결 시 오히려 fail-closed로 막도록 설계했습니다.  
즉, 모든 기능을 같은 방식으로 degrade하지 않고, 민감도에 따라 다르게 처리했습니다.

---

### Q11. 왜 Elasticsearch를 썼나요? MongoDB text search나 OpenSearch/Vector DB도 있지 않나요?

### A.

우리 요구사항은 단순 벡터 검색이 아니라 `키워드 정확도 + 의미 유사도`를 같이 보는 것이었습니다.  
Elasticsearch는 BM25와 dense vector를 한 인덱스에서 함께 운영할 수 있어서, 뉴스 검색/RAG에 적합했습니다.

MongoDB는 원문 저장소와 fallback으로 두고, 검색 최적화는 Elasticsearch에 맡기는 방식으로 역할을 분리했습니다.  
프로젝트 범위에서 별도 vector DB를 추가하기보다, 기존 검색 인덱스 위에 하이브리드 검색을 붙이는 게 더 현실적이었습니다.

---

## 4-4. Bedrock / AI / RAG

### Q12. 왜 OpenAI API나 self-hosted 모델이 아니라 Bedrock을 썼나요?

### A.

프로젝트의 인프라가 AWS 중심으로 전환되었고, 운영 입장에서 Bedrock이 더 안정적이었습니다.

- 별도 GPU 서버 운영이 필요 없음
- AWS Secret, 네트워크, IAM과 통합하기 쉬움
- 모델 전환/운영 표준화가 수월함

즉, 성능만이 아니라 운영 비용과 안정성을 함께 고려한 선택입니다.

---

### Q13. RAG에서 왜 BM25 + kNN을 같이 썼나요?

### A.

금융/뉴스 질의는 정확한 종목명, 티커, 키워드가 중요합니다.  
벡터 검색만 쓰면 "의미는 비슷하지만 종목이 다른 문서"가 나올 수 있고, BM25만 쓰면 표현이 다를 때 놓칠 수 있습니다.

그래서:

- BM25로 정확한 키워드 매칭 확보
- kNN으로 의미 유사도 보완

이렇게 하이브리드 검색을 썼습니다.

---

### Q14. ES가 실패하면 AI는 어떻게 되나요?

### A.

뉴스 원문은 MongoDB에도 저장되어 있어서 MongoDB fallback으로 내려갑니다.  
즉, ES 검색 실패가 곧 AI 기능 전체 장애로 이어지지 않도록 했습니다.

또 Bedrock 자체가 실패하면 완전 중단 대신 fallback 응답 구조도 두었습니다.  
핵심은 `한 계층 실패가 전체 응답 중단으로 바로 번지지 않게 하는 것`입니다.

---

### Q15. AI 답변이 엉뚱하게 나오면 어떻게 보완했나요?

### A.

실제로 TQQQ 같은 질문이 BTC 쪽으로 새는 문제가 있었고, 이걸 계기로 질문 의도 분석을 보강했습니다.

- 명시적 종목/ETF 질문이면 포트폴리오 키워드 주입 제한
- ETF/종목 alias 인식
- 최근 14일 뉴스 우선 검색
- 시세 컨텍스트를 함께 조립

즉, 프롬프트만 손본 게 아니라 조회 로직 자체를 고쳤습니다.

---

### Q16. AI 응답의 최신성은 어떻게 보장하나요?

### A.

완전한 실시간 보장은 어렵지만, 구조적으로 최신성을 높이려 했습니다.

- 뉴스는 수집기 -> Kafka -> MongoDB/Elasticsearch로 적재
- 질의 시 최근 14일 뉴스 우선
- 시세는 Upbit/KIS 실시간 feed 및 캐시 사용

즉, 정적 지식 기반이 아니라 운영 데이터와 최신 뉴스 기반 응답 구조입니다.  
다만 발표에서는 "완전한 실시간"보다는 "최신 데이터 반영형 구조"라고 표현하는 게 더 정확합니다.

---

## 4-5. Admin 모니터링 / LGTM / 로그 / 트레이스

### Q17. 왜 Grafana만 쓰지 않고 `/admin`을 따로 만들었나요?

### A.

Grafana는 원본 데이터 탐색에는 좋지만, 서비스 운영자가 매일 보는 화면으로는 불편할 수 있습니다.  
우리는 Kubernetes 상태, 뉴스/시세 파이프라인 상태, 백업 상태, 로그, 트레이스, AI 진단을 한 화면에서 보고 싶었습니다.

그래서 LGTM은 데이터 수집/저장 계층으로 쓰고, `/admin`은 운영 의사결정을 위한 서비스 맞춤 콘솔로 만들었습니다.

---

### Q18. 왜 LGTM을 썼나요?

### A.

메트릭, 로그, 트레이스를 각각 따로 붙이는 대신 Grafana 생태계로 통합하고 싶었습니다.

- 메트릭: Mimir
- 로그: Loki
- 트레이스: Tempo
- 수집: Alloy

이 조합은 Kubernetes 기반 운영 모니터링에 잘 맞고, Grafana Explore와 연동하기도 좋았습니다.

---

### Q19. 로그는 치명적인 로그와 일반 로그를 구분할 수 있나요?

### A.

네, 현재 `/admin/logs`에서는 규칙 기반으로 severity를 나누고 있습니다.

기준은:

- HTTP status code
- 로그 level
- traceback/exception/timeout/db error 같은 패턴
- trace 연결 여부

그래서 `CRITICAL / WARN / INFO`로 분류하고, pod별 top severity와 trace-linked count도 계산합니다.  
다만 완전한 incident engine은 아니고, 운영 노이즈를 줄이기 위한 1차 분류 체계라고 설명하는 게 정확합니다.

---

### Q20. 로그와 트레이스를 연결할 수 있나요?

### A.

현재는 일정 부분 가능합니다.

- `main.py`에서 trace-aware logging으로 `trace_id`, `span_id`를 로그에 남깁니다.
- `/admin/logs` 응답에 `trace_id`, `trace_url`을 포함합니다.
- `/admin/traces`에서는 Tempo/Grafana 링크를 제공합니다.

즉, 새로 적재되는 요청 로그는 trace로 따라갈 수 있습니다.  
다만 과거 로그나 모든 요청이 완벽하게 end-to-end 연결된 상태는 아니어서, 이 부분은 계속 개선 중이라고 말하는 게 솔직합니다.

---

### Q21. Kibana는 왜 안 넣었나요?

### A.

현재 운영 모니터링의 중심은 Kibana가 아니라 LGTM입니다.  
Elasticsearch는 주로 뉴스 검색/RAG 인덱스 역할이고, 운영 로그는 Loki가 담당합니다.

그래서 운영 설명에서는 Kibana보다 `Grafana + Loki + Tempo + Mimir + /admin`이 더 정확한 구조입니다.  
Kibana는 있더라도 검색 인덱스 탐색용 보조 도구에 가깝습니다.

---

## 4-6. AWS 마이그레이션 / 안정화 / 운영

### Q22. 왜 AWS로 옮겼나요?

### A.

초기에는 VM 기반으로 구축했지만, 서비스가 커질수록 배포 표준화, 네트워크 분리, GitOps, 운영 자동화가 중요해졌습니다.  
그래서 AWS EKS 기반으로 옮기면서 배포/확장/운영을 표준화하려고 했습니다.

다만 "옮겼다"보다 중요한 건 옮긴 뒤 서비스가 살아 있어야 한다는 점이라, 실제로는 auth 배포, proxy 라우팅, secret sync, Mongo cutover, target group 복구 같은 안정화 작업에 더 많은 시간이 들어갔습니다.

---

### Q23. 마이그레이션 후 가장 어려웠던 점은 뭐였나요?

### A.

코드보다 운영 경계 이슈가 더 어려웠습니다.

- auth 서비스는 분리됐지만 배포가 안 되어 라우팅만 살아 있는 상태
- ALB target group drift
- Kyverno webhook 네트워크 이슈
- Mongo source of truth 분산
- frontend proxy 경로 누락

즉, 인프라 이전은 리소스 생성보다 `서비스 경로 정합성 맞추기`가 더 어려웠습니다.

---

### Q24. full down 운영은 설득력이 약하지 않나요? 그냥 끄는 거 아닌가요?

### A.

단순히 끄는 것으로만 설명하면 약할 수 있습니다.  
그래서 저는 이걸 `운영 최적화`로 설명합니다.

- 먼저 미사용 prod 리소스 제거
- staging only 구조로 통합
- 그 위에 미사용 시간 full down/up 운영 자동화

즉, 구조 통합이 먼저이고 full down은 그 위의 운영 정책입니다.  
비용 절감은 "꺼서 아꼈다"가 아니라, `불필요한 구조를 정리하고 운영 전략을 바꿨다`라고 설명하는 것이 맞습니다.

---

### Q25. 이 구조에서 가장 아쉬운 점은 무엇인가요?

### A.

운영과 서비스는 많이 정리됐지만 아직 보완할 점도 분명합니다.

- SLO, 외부 synthetic monitoring 부재
- 로그와 trace의 완전한 상관관계는 미완성
- ALB 외부 target(Sonar)처럼 아직 수동성이 남은 부분 존재
- 프론트 일부는 당시 원본 소스가 아닌 산출물 패치로 우회 복구한 적도 있음

즉, 완성형이라고 포장하기보다 실제 운영 중 생긴 기술 부채를 알고 있고, 다음 개선 방향까지 말할 수 있어야 합니다.

---

## 5. 실무자 관점에서 들으면 좋은 대답 방식

질문이 들어오면 아래 포맷으로 답하면 좋다.

### 5-1. 기술 선택 질문

`이 기술이 최고라서가 아니라, 우리 요구사항과 팀 상황에 맞아서 선택했습니다.`

예시:

`FastAPI가 무조건 최고라기보다, 저희 프로젝트는 AI/OCR/외부 API 연동이 많아서 Python 생태계와 비동기 I/O가 잘 맞았습니다. 대신 서비스 분리와 운영 보강을 같이 해서 단순 프로젝트 수준에 머무르지 않도록 했습니다.`

### 5-2. 장애/트러블슈팅 질문

`문제 -> 원인 -> 조치 -> 검증` 순서로 답한다.

예시:

`Admin KPI가 N/A였을 때 단순히 화면 문제로 보지 않고, Mimir 경로, exporter annotation, label 정합성까지 확인했습니다. 이후 query fallback과 scrape annotation을 보강하고 rollout으로 검증해서 정상 복구했습니다.`

### 5-3. 운영 질문

`평상시 구조`와 `장애 시 fallback`을 같이 말한다.

예시:

`평상시에는 Redis 현재 캐시를 우선 사용하고, 외부 API 실패 시에는 last_good 백업 캐시로 떨어집니다. 그래도 없으면 에러를 주지만, 최소한 rate limit이나 일시 장애 때문에 바로 0원이나 빈 응답이 되지 않도록 설계했습니다.`

---

## 6. 마지막으로 꼭 외워둘 핵심 문장

### 한 줄 자기 파트 소개

`저는 TUTUM에서 백엔드 API, 실시간 데이터 파이프라인, Bedrock 기반 AI 응답 구조, 관리자 모니터링 대시보드, 그리고 AWS EKS 전환 이후 서비스 안정화 작업을 주로 맡았습니다.`

### 기술 선택 철학

`기술을 예쁘게 쌓는 것보다, 실제 사용자 기능과 운영 안정성을 같이 만족하는 방향으로 선택했습니다.`

### 운영 관점 강조

`저는 기능 구현만 한 것이 아니라, 장애가 났을 때 어디를 보고 어떻게 복구할지까지 고려해서 구조를 만들려고 했습니다.`

---

## 7. 근거로 참고한 대표 문서 / dev log

- `docs/presentations/2026-03-18_tutum_project_summary_for_portfolio.md`
- `docs/plans/backend/CHATBOT_RAG_PIPELINE_ARCHITECTURE_2026-03-17.md`
- `docs/plans/backend/KAFKA_PIPELINE_ARCHITECTURE_2026-03-17.md`
- `docs/plans/infra/AWS_STAGING_TOPOLOGY_ARCHITECTURE_2026-03-16.md`
- `docs/presentations/2026-03-04_admin-monitoring-dashboard.md`
- `docs/presentations/2026-03-18_lgtm_admin_monitoring_presentation_guide.md`
- `docs/dev_logs/3월_첫째주/2026-03-03_admin_metrics_pipeline_recovery.md`
- `docs/dev_logs/3월_첫째주/2026-03-05_admin_access_guard_and_auth_ratelimit.md`
- `docs/dev_logs/3월_첫째주/2026-03-06_backup_fix_monitoring_bedrock_upgrade.md`
- `docs/dev_logs/3월_둘째주/2026-03-11_auth_service_eks_deploy.md`
- `docs/dev_logs/3월_둘째주/2026-03-11_tutum_my_frontend_proxy_and_alb_recovery.md`
- `docs/dev_logs/3월_둘째주/2026-03-12_bedrock_sonnet_46_runtime_switch.md`
- `docs/dev_logs/3월_둘째주/2026-03-12_mongodb_atlas_to_eks_replicaset_cutover.md`
- `docs/dev_logs/3월_둘째주/2026-03-13_finops_cost_reduction_staging_only_strategy.md`
- `docs/dev_logs/3월_둘째주/2026-03-14_ai_chat_rag_relevance_and_session_persistence.md`

---

## 8. 최종 체크리스트

- [x] 담당 구현 파트 상세 정리
- [x] 이해하기 쉬운 구조 설명 정리
- [x] 예상 질문과 모범 답안 정리
- [x] dev log / 코드 / 아키텍처 문서 근거 반영
- [x] 발표 후 질의응답 대비용 md 파일 작성 완료
