# Node1 빌드 & 배포 스크립트

Node1의 제한된 디스크 공간(12GB)을 효율적으로 관리하면서 Docker 이미지를 빌드하고 Harbor에 배포하기 위한 스크립트 모음입니다.

## 📁 스크립트 목록

### 1. `cleanup-docker.sh` - Docker 디스크 정리

불필요한 Docker 리소스를 삭제하여 디스크 공간을 확보합니다.

**실행 방법:**
```bash
cd ~/clouddx-project
chmod +x scripts/cleanup-docker.sh
./scripts/cleanup-docker.sh
```

**수행 작업:**
- 중지된 컨테이너 삭제
- 사용하지 않는 이미지 삭제
- 사용하지 않는 볼륨 삭제
- 사용하지 않는 네트워크 삭제
- 빌드 캐시 완전 삭제

**예상 효과:** 2-5GB 디스크 공간 확보

---

### 2. `build-and-push.sh` - 빌드 → Harbor Push → 로컬 삭제

디스크 공간을 절약하면서 이미지를 빌드하고 Harbor에 배포하는 자동화 스크립트입니다.

**실행 방법:**
```bash
cd ~/clouddx-project

# 실행 권한 부여 (최초 1회)
chmod +x scripts/build-and-push.sh

# latest 태그로 빌드
./scripts/build-and-push.sh

# 특정 태그로 빌드 (예: v1.0.0)
./scripts/build-and-push.sh v1.0.0
```

**워크플로우:**
```
각 서비스별로:
1. 🔨 Docker 빌드
2. 📤 Harbor에 Push
3. 🗑️ 로컬 이미지 삭제 (디스크 절약!)
4. 🧹 빌드 캐시 정리

순서: Frontend → Backend → Workers
```

**장점:**
- ✅ 디스크 공간 절약: 로컬에 이미지를 남기지 않음
- ✅ Harbor 중앙 관리: 모든 이미지가 Harbor에만 저장됨
- ✅ 자동화: 한 번의 명령으로 모든 서비스 빌드+배포

**주의사항:**
- Git 최신 상태 자동 확인
- 커밋되지 않은 변경사항이 있으면 경고 표시
- Harbor 로그인 필요: `docker login 192.168.56.12:8080`

---

## 🚀 빌드 & 배포 워크플로우

### Step 1: 코드 변경 및 커밋
```bash
# 로컬 PC 또는 Node1에서
git add .
git commit -m "feat: add new feature"
git push origin develop
```

### Step 2: Node1에서 빌드 & Harbor Push
```bash
# Node1 SSH 접속
ssh clouddx@192.168.56.11

# 프로젝트 디렉토리로 이동
cd ~/clouddx-project

# 최신 코드 가져오기
git pull origin develop

# 디스크 공간 부족 시 (선택)
./scripts/cleanup-docker.sh

# 빌드 & Harbor Push (로컬 이미지는 자동 삭제됨)
./scripts/build-and-push.sh
```

### Step 3: 배포 노드에서 Pull & 실행
```bash
# Node1 또는 Node3에서
docker pull 192.168.56.12:8080/tutum/frontend:latest
docker pull 192.168.56.12:8080/tutum/backend:latest
docker pull 192.168.56.12:8080/tutum/workers:latest

# docker-compose로 실행
docker compose up -d
```

---

## 📊 디스크 관리 전략

### 현재 Node1 상황
- **총 용량**: 12GB
- **일반적 사용량**: 9-11GB
- **여유 공간**: 1-3GB (부족!)

### 새로운 전략 (이 스크립트 적용 후)
```
로컬 PC:  개발 & 테스트
    ↓ (git push)
Node1:    빌드 전용 (이미지 보관 X)
    ↓ (harbor push)
Harbor:   이미지 저장소 (중앙 관리)
    ↓ (docker pull)
Node1/3:  운영 환경
```

**장점:**
- Node1 디스크 압박 해소
- 모든 이미지를 Harbor에서 중앙 관리
- 필요할 때만 pull하여 사용

---

## 🛠️ 트러블슈팅

### 문제: "no space left on device" 에러
```bash
# 즉시 정리 실행
./scripts/cleanup-docker.sh

# 또는 수동으로
docker system prune -af
docker builder prune -af
```

### 문제: Harbor 로그인 실패
```bash
# Harbor 로그인 (Node1에서)
docker login 192.168.56.12:8080
# Username: admin
# Password: Harbor12345
```

### 문제: Git pull 실패 (인증)
```bash
# SSH key가 설정되어 있는지 확인
ssh -T git@github.com

# 설정이 안되어 있다면
ssh-keygen -t ed25519
cat ~/.ssh/id_ed25519.pub
# → GitHub에 Deploy key로 등록
```

---

## 📝 다음 개선 사항

1. **VM 디스크 확장** (근본 해결)
   - 12GB → 30-50GB 권장

2. **멀티 스테이지 빌드** (이미지 크기 감소)
   - Dockerfile 최적화

3. **CI/CD 파이프라인**
   - GitHub Actions → 자동 빌드 & Harbor Push

4. **배포 스크립트**
   - `deploy-node1.sh`, `deploy-node3.sh` 추가

---

## 🔗 관련 문서

- [DEPLOYMENT_PLAN.md](../docs/DEPLOYMENT_PLAN.md) - 전체 배포 계획
- [2026-02-16_harbor_push_and_node1_setup.md](../docs/work-plans/2026-02-16_harbor_push_and_node1_setup.md) - Harbor 구축 작업 계획
