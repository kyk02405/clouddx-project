# TUTUM AI `포트폴리오 분석해줘` 처리 흐름

작성일: 2026-03-19

## 1. 목적

이 문서는 사용자가 TUTUM AI 채팅창에 `포트폴리오 분석해줘`라고 입력했을 때,
프론트엔드부터 백엔드, 데이터 조회, RAG 검색, Bedrock 응답 생성, SSE 스트리밍까지
실제로 어떤 순서로 처리되는지 코드 기준으로 정리한 문서이다.

## 2. 한 줄 요약

사용자 질문이 들어오면 백엔드는 먼저 `사용자 포트폴리오(MariaDB -> MongoDB fallback)`를 조회하고,
관련 뉴스는 `Elasticsearch(BM25 + kNN) -> MongoDB fallback`으로 수집한 뒤,
필요한 가격 문맥과 함께 Bedrock Claude에 전달하여 답변을 스트리밍한다.

## 3. 전체 흐름

```mermaid
flowchart LR
    A[사용자 질문\n포트폴리오 분석해줘] --> B[Frontend AI Chat]
    B --> C[/api/proxy/api/v1/chat]
    C --> D[Backend /api/v1/chat]
    D --> E[인증 + Rate Limit]
    E --> F[chat_service.chat_stream]
    F --> G[포트폴리오 조회\nMariaDB 우선]
    G --> H[MongoDB fallback]
    F --> I[질문/포트폴리오 키워드 추출]
    I --> J[관련 뉴스 검색\nElasticsearch BM25 + kNN]
    J --> K[MongoDB news fallback]
    F --> L[가격 문맥 조회\nUpbit / KIS]
    G --> M[포트폴리오 컨텍스트]
    J --> N[뉴스 컨텍스트]
    L --> O[가격 컨텍스트]
    M --> P[Bedrock Claude]
    N --> P
    O --> P
    A --> P
    P --> Q[SSE stream 응답]
    Q --> B
```

## 4. 단계별 상세 처리

### 4-1. 프론트 요청

사용자가 AI 채팅창에서 `포트폴리오 분석해줘`를 입력하면 프론트는
`/api/proxy/api/v1/chat`으로 `POST` 요청을 보낸다.

- 요청 방식: `text/event-stream`
- 인증: `Authorization: Bearer <token>`
- 프론트 훅: `frontend/frontend/hooks/useChat.ts`
- 프록시: `frontend/frontend/app/api/proxy/[...path]/route.ts`

프론트는 SSE 이벤트를 읽으면서 답변을 실시간으로 화면에 붙인다.

### 4-2. 프록시 -> 백엔드 라우터

Next.js 프록시는 요청을 실제 백엔드 `/api/v1/chat`으로 전달한다.

백엔드 라우터에서는 먼저 아래를 수행한다.

- 로그인 사용자 확인
- chat API rate limit 확인
- SSE 응답 스트림 생성

관련 코드:

- `backend/app/routers/chat.py`

### 4-3. 질의 의도 판단

실제 처리의 중심은 `chat_service.chat_stream()`이다.

여기서 먼저 이 질문이 `포트폴리오 분석 의도`인지 판단한다.
코드상 `PORTFOLIO_QUERY_HINTS`에는 아래와 같은 표현이 포함된다.

- `포트폴리오`
- `내 포트폴리오`
- `내 자산`
- `비중`
- `리밸런싱`

즉 `포트폴리오 분석해줘`는 일반 종목 질문이 아니라
`포트폴리오 기반 분석 질문`으로 분류된다.

관련 코드:

- `backend/app/services/chat_service.py`

### 4-4. 사용자 포트폴리오 조회

이 질문은 내 보유 자산을 기준으로 분석해야 하므로,
우선 사용자 포트폴리오를 조회한다.

조회 순서는 다음과 같다.

1. `MariaDB(RDS)`에서 `get_user_portfolios(user_id)`
2. 실패 시 `MongoDB assets` 컬렉션 fallback

이때 반환되는 데이터는 대략 아래와 같은 구조로 정리된다.

- 자산명
- 심볼
- 자산 유형(`crypto`, `stock`, `etf`)
- 수량
- 평균 매수가
- 현재가
- 통화

관련 코드:

- `backend/app/services/chat_service.py` `_fetch_portfolio()`
- `backend/app/mariadb.py` `get_user_portfolios()`

### 4-5. 키워드 추출

`포트폴리오 분석해줘`는 특정 종목만 묻는 질문이 아니므로,
질문 키워드만 쓰지 않고 `보유 자산 키워드`도 함께 검색에 반영한다.

즉 다음 두 종류의 키워드가 합쳐진다.

- 질문 본문 키워드
- 포트폴리오 상위 보유 자산 키워드

예를 들어 사용자가 BTC, AAPL, MSFT를 보유 중이면
이 심볼/자산명이 뉴스 검색 키워드에 보강될 수 있다.

관련 코드:

- `backend/app/services/chat_service.py`
- `_should_include_portfolio_keywords()`
- `_extract_keywords()`

### 4-6. 가격 문맥 조회

질문에서 특정 종목/ETF/코인 심볼이 추출되면
현재가 문맥도 함께 붙인다.

- 코인: `Upbit`
- 주식/ETF: `KIS`

다만 `포트폴리오 분석해줘`처럼 일반적인 질문은
포트폴리오와 뉴스 문맥이 중심이고,
가격 문맥은 추출된 심볼 여부에 따라 일부 보강되는 구조다.

관련 코드:

- `backend/app/services/chat_service.py` `_fetch_prices()`

### 4-7. 뉴스 RAG 검색

관련 뉴스는 다음 우선순위로 찾는다.

1. `Elasticsearch` 우선 검색
2. 실패하거나 결과가 비면 `MongoDB news` fallback

Elasticsearch에서는 최근 14일 문서를 우선 조회한다.

검색 방식은 하이브리드다.

- `BM25`: 종목명, 키워드, 제목/본문 단어 매칭
- `kNN`: Titan 쿼리 임베딩 기반 의미 검색

코드상 비중은 다음과 같다.

- BM25: `0.6`
- kNN: `0.4`

즉 정확한 키워드 매칭과 의미 기반 검색을 같이 쓰는 구조다.

관련 코드:

- `backend/app/services/chat_service.py`
- `_fetch_news_es()`
- `_generate_query_embedding()`
- `_build_es_body()`
- `_fetch_news()`

### 4-8. 컨텍스트 조립

조회가 끝나면 백엔드는 Bedrock에 보낼 컨텍스트를 3개 블록으로 만든다.

#### 포트폴리오 컨텍스트

- 보유 자산 목록
- 평균가
- 현재가
- 자산별 수익률
- 총 투자금
- 총 평가금
- 총 수익률

#### 가격 컨텍스트

- 코인/주식/ETF 현재가
- 등락률

#### 뉴스 컨텍스트

- 관련 뉴스 제목
- 발행일
- 출처
- 잘라낸 본문 요약

관련 코드:

- `backend/app/services/chat_service.py`
- `_build_portfolio_context()`
- `_build_price_context()`
- `_build_news_context()`

### 4-9. Bedrock 전달

최종적으로 아래 정보가 하나의 사용자 메시지로 조립되어 Bedrock Claude에 전달된다.

- `[PORTFOLIO]`
- `[PRICE DATA]`
- `[NEWS]`
- 사용자의 원문 질문 `포트폴리오 분석해줘`

즉 LLM이 그냥 질문만 보고 답하는 게 아니라,
내 보유 자산과 관련 뉴스, 가격 데이터를 같이 보고 답하게 된다.

관련 코드:

- `backend/app/services/chat_service.py` `chat_stream()`

### 4-10. SSE 스트리밍 응답

Bedrock 응답은 SSE로 스트리밍되어 프론트에 전달된다.

프론트가 받는 주요 이벤트는 다음과 같다.

- `start`: 대화/메시지 ID 시작 정보
- `sources`: 이번 답변에 사용한 근거 목록
- `delta`: 토큰 단위 본문
- `done`: 응답 완료
- `error`: 처리 실패

프론트는 `delta` 이벤트를 이어 붙여 최종 답변을 화면에 보여준다.

관련 코드:

- `backend/app/routers/chat.py`
- `backend/app/services/chat_service.py`
- `frontend/frontend/hooks/useChat.ts`

## 5. 이 흐름에서 중요한 분기

### 5-1. 왜 포트폴리오 키워드가 섞이는가

`포트폴리오 분석해줘`는 포트폴리오 의도 질의라서,
명시적 종목 질문보다 보유 자산 키워드가 적극적으로 검색에 반영된다.

반대로 `TQQQ 사도 돼?`처럼 특정 종목 질문이면
포트폴리오 키워드 개입을 줄여서 질문 대상 자산 중심으로 검색한다.

### 5-2. 왜 MariaDB와 MongoDB를 둘 다 보는가

현재 기본 사용자 포트폴리오는 `MariaDB(RDS)`가 정본이고,
장애 또는 전환 상황에 대비해 `MongoDB assets` fallback 경로가 남아 있다.

### 5-3. 왜 Elasticsearch와 MongoDB를 둘 다 보는가

- `Elasticsearch`: 빠른 검색, BM25, 벡터 검색
- `MongoDB`: 뉴스 원문 저장소, 검색 실패 시 fallback

즉 ES는 검색용, MongoDB는 원문/보조 저장소 역할이다.

## 6. 실패 시 동작

### 포트폴리오 조회 실패

- MariaDB 실패 -> MongoDB fallback
- 둘 다 실패 -> 포트폴리오 없이 분석 진행

### 뉴스 검색 실패

- Elasticsearch 실패 -> MongoDB fallback

### Bedrock 실패

- Bedrock 호출 실패 시 mock response fallback 로직이 존재

## 7. 발표용 짧은 설명

`사용자가 포트폴리오 분석을 요청하면, 백엔드는 먼저 MariaDB 기준으로 사용자의 보유 자산을 조회하고 실패 시 MongoDB를 fallback으로 사용합니다. 이후 보유 자산 키워드로 관련 뉴스와 일부 시세 정보를 수집하고, 뉴스는 Elasticsearch의 BM25+kNN 하이브리드 검색을 우선 사용한 뒤 필요하면 MongoDB 원문을 fallback으로 조회합니다. 이렇게 만든 포트폴리오, 시세, 뉴스 컨텍스트를 Bedrock Claude에 전달하고, 결과는 SSE로 프론트에 스트리밍해 보여주는 구조입니다.`

## 8. 관련 코드

- `frontend/frontend/hooks/useChat.ts`
- `frontend/frontend/app/api/proxy/[...path]/route.ts`
- `backend/app/routers/chat.py`
- `backend/app/services/chat_service.py`
- `backend/app/mariadb.py`
