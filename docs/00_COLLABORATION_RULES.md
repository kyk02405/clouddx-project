# TUTUM Collaboration Rules (AntiGravity Reference)

Purpose: Keep the team unblocked, avoid “works on my machine”, and make integration reproducible via Git + Docker Compose.  
Scope: On-prem phase (VM1/VM2/VM3 topology) + local/VM docker-compose integration.

---

## 0. Principles (Non-negotiable)

1. **Everything must be reproducible from Git**

   - If it’s not in Git, it doesn’t exist.

2. **Never edit code inside containers**

   - No `docker exec` + `vim/nano` editing.
   - All changes must follow:
     - local code → commit → build → run

3. **One integration owner**

   - Integration is owned by **D (Infra/Integration)** using `docker-compose`.

4. **Single source of truth for integration**
   - `docker-compose.yml`, `.env.example`, and smoke scripts must live in the repo.

---

## 1. Team Ownership (Clear boundaries)

### A — Backend Core (Auth + Portfolio CRUD)

- Owns: `backend/api-core/**`
- Delivers: `/auth/*`, `/portfolio/*`, MongoDB writes

### B — Data Pipeline (Crawler + News/Prices API)

- Owns: `backend/data-api/**`
- Delivers: `/news/*`, `/prices/*`, crawler scripts, DB upserts

### C — OCR + Import Pipeline (Upload → OCR → Draft → Confirm)

- Owns: `backend/ocr-api/**`
- Delivers: `/import/*`, MinIO upload, Kafka job pipeline, holdings confirm

### D — Infra & Integration (Compose + Kafka/Mongo/MinIO + Smoke tests)

- Owns: `infra/**` (or `docker-compose.yml`, `.env.example`, `scripts/**`)
- Delivers: reproducible boot, topic scripts, smoke tests, integration notes

---

## 2. Required Interface Contract (Hard rules)

### 2.1 Ports (fixed)

- `api-core` : **8000**
- `data-api` : **8001**
- `ocr-api` : **8002**

### 2.2 Environment variables (fixed names)

- `MONGO_URI`
- `KAFKA_BROKERS`
- `MINIO_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BUCKET`

Optional:

- `REDIS_URL`

### 2.3 Required endpoints (fixed paths)

All services must include:

- `GET /health`

#### api-core

- `POST /auth/signup`
- `POST /auth/login`
- `POST /portfolio/assets`
- `GET  /portfolio/assets`
- `DELETE /portfolio/assets`

#### data-api

- `GET /news`
- `GET /news/search?q=...`
- (optional) `GET /prices`, `GET /prices/{symbol}`

#### ocr-api

- `POST /import/ocr`
- `GET  /import/draft/{import_id}`
- `POST /import/confirm`

---

## 3. Kafka Rules (Minimum viable eventing)

### 3.1 Topics

- `asset.import.request` (MVP priority #1)
- `news.ingest` (optional MVP priority #2)

### 3.2 Message schema (must be JSON)

#### asset.import.request

```json
{
  "import_id": "uuid",
  "user_id": "demo-user",
  "object_key": "bucket/path/to/file.png",
  "type": "OCR_IMAGE"
}
```

## 4. Storage Rules

### 4.1 MongoDB (MVP Collections)

For the weekend MVP, MongoDB must use consistent collection names across all services.

Required collections:

- `users`

  - user accounts (email, password hash)

- `holdings`

  - portfolio holdings (crypto, stock, custom assets)

- `custom_assets`

  - manually added assets without API support

- `news_items`

  - crawled and normalized news feed

- `imports`

  - OCR upload/import metadata

- `draft_assets`
  - OCR extracted draft results before confirmation

Optional (later phases):

- `portfolio_insights`
  - AI/B edrock-generated insights stored for UI display

---

### 4.2 MinIO (File Storage)

MinIO is used as an on-prem object storage layer for uploads.

Rules:

- Bucket name must come from:

  - `MINIO_BUCKET` (default: `uploads`)

- Recommended object key format:
  {user_id}/{import_id}/{filename}

Example: demo-user/123e4567/image.png

MinIO is required for:

- OCR screenshot uploads
- CSV import files (optional)

---

### 4.3 Redis (Optional)

Redis is optional for the MVP.

If enabled, it can be used for:

- Hot cache keys (latest prices)
- Session/token blacklist (later)
- Pub/Sub broadcasting (future)

Rule:

- Do not block MVP progress on Redis integration.

---

---

## 5. Bedrock Rule (AI)

### Core Rule

**Frontend must never call Amazon Bedrock directly.**

All AI calls must happen server-side only.

Reason:

- Security (no API keys exposed)
- Cost control
- Retry + monitoring on backend
- Centralized governance

### Correct Architecture

1. User triggers an event (portfolio update, OCR confirm)
2. Worker/service calls Bedrock
3. AI output is stored in DB
4. Frontend reads stored insights only

### MVP Scope

For weekend MVP:

- Bedrock integration can remain a skeleton
- Only store placeholder insight results in MongoDB

Example collection:

- `portfolio_insights`

---

---

## 6. Git & Branch Rules

### 6.1 Branch Strategy

- `main`

  - stable, demo-ready only

- `develop`

  - integration branch for all merged work

- `feature/*`
  - individual development branches

Example:

MinIO is required for:

- OCR screenshot uploads
- CSV import files (optional)

---

### 4.3 Redis (Optional)

Redis is optional for the MVP.

If enabled, it can be used for:

- Hot cache keys (latest prices)
- Session/token blacklist (later)
- Pub/Sub broadcasting (future)

Rule:

- Do not block MVP progress on Redis integration.

---

---

## 5. Bedrock Rule (AI)

### Core Rule

**Frontend must never call Amazon Bedrock directly.**

All AI calls must happen server-side only.

Reason:

- Security (no API keys exposed)
- Cost control
- Retry + monitoring on backend
- Centralized governance

### Correct Architecture

1. User triggers an event (portfolio update, OCR confirm)
2. Worker/service calls Bedrock
3. AI output is stored in DB
4. Frontend reads stored insights only

### MVP Scope

For weekend MVP:

- Bedrock integration can remain a skeleton
- Only store placeholder insight results in MongoDB

Example collection:

- `portfolio_insights`

---

---

## 6. Git & Branch Rules

### 6.1 Branch Strategy

- `main`

  - stable, demo-ready only

- `develop`

  - integration branch for all merged work

- `feature/*`
  - individual development branches

Example:

feature/auth-signup
feature/news-crawler
feature/ocr-import

---

### 6.2 Pull Request Rules

- No direct push to `main`
- All work must go:

feature/\* → PR → develop

- Integration owner (D) merges after Compose validation

---

### 6.3 Commit Discipline

Rules:

- Small scoped commits
- Always explain what changed and why

Bad:

- "fix stuff"

Good:

- "add signup endpoint + Mongo user insert"
- "implement OCR draft confirm pipeline"

---

---

## 7. Docker & Compose Rules (Critical)

### 7.1 Forbidden

Strictly forbidden:

- Editing code inside containers
- Temporary fixes without committing
- Committing `.env` with secrets
- Undocumented local-only scripts

---

### 7.2 Required

Every service must provide:

- `Dockerfile`
- `requirements.txt`
- `GET /health`

Integration must always run via:

```bash
docker compose up -d
```

### 7.3 Required Repository Files

- The following must exist:

docker-compose.yml
.env.example
infra/scripts/

Scripts should include:

create-topics.sh
smoke-test.sh

### 7.4 Logging Rule

- All services must log to stdout/stderr only:

* No hidden local logs
* Docker logs must show all errors

Example:

docker logs tutum-ocr-api
