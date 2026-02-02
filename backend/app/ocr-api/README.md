# OCR API Service

## 개요

OCR API는 이미지에서 텍스트를 추출하여 자산 정보를 자동으로 인식하는 서비스입니다.

- **포트**: 8002
- **주요 기능**: 스크린샷 업로드 → OCR 처리 → 자산 Draft 생성 → 사용자 확인 후 포트폴리오 반영

---

## Google Vision API 인증 설정

OCR 기능은 **Google Vision API**를 사용하며, 두 가지 인증 방식을 지원합니다.

### ✅ 방법 1: API Key 방식 (권장)

**가장 간단하고 안전한 방법**입니다. 조직 정책(Organization Policy)에서 서비스 계정 키 생성이 제한된 환경에서도 사용 가능합니다.

#### 1) GCP Console에서 API Key 생성

1. [Google Cloud Console - API & Services - Credentials](https://console.cloud.google.com/apis/credentials) 접속
2. **Create Credentials** → **API Key** 선택
3. 생성된 API Key 복사
4. (권장) **Edit API Key** → **API restrictions** → **Restrict key** → **Cloud Vision API** 선택

#### 2) 환경변수 설정

```bash
# .env 파일 또는 docker-compose.yml에 추가
GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### 3) 장점

- ✅ 서비스 계정 JSON 파일 불필요
- ✅ Organization Policy 제약 회피 가능
- ✅ 키 관리 간편 (환경변수만 설정)
- ✅ 로컬/컨테이너 환경 모두 동일하게 동작

---

### 🔧 방법 2: Service Account JSON 방식 (옵션)

조직 보안 정책이나 특정 요구사항에 따라 서비스 계정 키를 사용해야 하는 경우에만 사용하세요.

> ⚠️ **주의**: 많은 조직에서 Organization Policy로 인해 서비스 계정 키 생성이 제한될 수 있습니다.

#### 1) 서비스 계정 키 생성 (가능한 경우)

1. [Google Cloud Console - IAM & Admin - Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts) 접속
2. 서비스 계정 선택 또는 생성
3. **Keys** 탭 → **Add Key** → **Create new key** → **JSON** 선택
4. 다운로드된 JSON 파일을 `secrets/gcp_sa.json`에 저장

#### 2) 환경변수 설정

```bash
# .env 파일 또는 docker-compose.yml에 추가
GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/gcp_sa.json
```

#### 3) Docker Compose 볼륨 마운트

```yaml
services:
  ocr-api:
    volumes:
      - ./secrets:/app/secrets:ro
```

---

## 인증 방식 자동 선택 로직

코드는 다음 우선순위로 자동 선택합니다:

1. **GOOGLE_API_KEY**가 설정되어 있으면 → API Key 방식 사용
2. **GOOGLE_APPLICATION_CREDENTIALS**가 설정되어 있으면 → Service Account JSON 방식 사용
3. **둘 다 없으면** → 에러 발생 (명확한 안내 메시지 출력)

---

## 환경변수 전체 목록

### 필수

- `MONGO_URI`: MongoDB 연결 문자열
- `KAFKA_BROKERS`: Kafka 브로커 주소 (예: `kafka:9092`)
- `MINIO_ENDPOINT`: MinIO 엔드포인트
- `MINIO_ACCESS_KEY`: MinIO Access Key
- `MINIO_SECRET_KEY`: MinIO Secret Key
- `MINIO_BUCKET`: MinIO 버킷 이름 (기본: `uploads`)

### OCR 인증 (둘 중 하나 필수)

- `GOOGLE_API_KEY`: Google Vision API Key (권장)
- `GOOGLE_APPLICATION_CREDENTIALS`: 서비스 계정 JSON 경로 (옵션)

---

## 로컬 개발 환경 설정 예시

### .env 파일 (API Key 방식)

```bash
MONGO_URI=mongodb://localhost:27017/tutum
KAFKA_BROKERS=localhost:9092
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=uploads

# OCR 인증 (API Key 권장)
GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Docker Compose 통합

```yaml
services:
  ocr-api:
    build: ./backend/app/ocr-api
    ports:
      - "8002:8002"
    environment:
      - MONGO_URI=${MONGO_URI}
      - KAFKA_BROKERS=${KAFKA_BROKERS}
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET=${MINIO_BUCKET}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    depends_on:
      - mongo
      - kafka
      - minio
```

---

## 트러블슈팅

### 1. "Google Vision API 인증 설정이 필요합니다" 에러

**원인**: `GOOGLE_API_KEY`와 `GOOGLE_APPLICATION_CREDENTIALS` 둘 다 설정되지 않음

**해결**:

```bash
# API Key 방식 (권장)
export GOOGLE_API_KEY=your-api-key-here

# 또는 Service Account 방식
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcp_sa.json
```

### 2. Organization Policy 제약으로 서비스 계정 키 생성 불가

**원인**: GCP 조직 정책에서 `iam.disableServiceAccountKeyCreation` 제약 활성화

**해결**: **API Key 방식**을 사용하세요 (방법 1 참고)

### 3. "Vision API error: ..." 에러

**원인**:

- API Key가 유효하지 않음
- Cloud Vision API가 프로젝트에서 활성화되지 않음
- API Key 제한 설정 문제

**해결**:

1. [API Library](https://console.cloud.google.com/apis/library/vision.googleapis.com)에서 Cloud Vision API 활성화
2. API Key가 올바른지 확인
3. API Key 제한 설정 확인 (Cloud Vision API 허용 여부)

---

## API 엔드포인트

### Health Check

```bash
GET /health
```

### OCR 업로드

```bash
POST /import/ocr
Content-Type: multipart/form-data

- file: 이미지 파일 (PNG, JPG 등)
- user_id: 사용자 ID
```

### Draft 조회

```bash
GET /import/draft/{import_id}
```

### Draft 확인 (포트폴리오 반영)

```bash
POST /import/confirm
{
  "import_id": "uuid",
  "user_id": "demo-user",
  "items": [...]
}
```

---

## 참고 문서

- [Google Cloud Vision API 문서](https://cloud.google.com/vision/docs)
- [API Key 인증 가이드](https://cloud.google.com/docs/authentication/api-keys)
- [Organization Policy 제약](https://cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints)
