# CloudDX Infrastructure

프로젝트의 인프라 구성 및 배포 관련 리소스를 관리하는 디렉토리입니다.

## 🏗️ 구성 요소 (Components)

### 1. Harbor (Container Registry)
- **경로**: `harbor/`
- **용도**: 프라이빗 도커 이미지 저장소.
- **설정**: Helm Chart 값 설정 파일(`values.yaml`) 등을 포함할 예정입니다.

### 2. Kibana (Logging & Monitoring)
- **경로**: `kibana/`
- **용도**: Elasticsearch에 저장된 로그 데이터를 시각화하는 대시보드.
- **설정**: 대시보드 JSON 템플릿 및 설정 파일.

### 3. Kubernetes (K8s) Resources (예정)
- 현재 로컬 개발 환경(`docker-compose.yml`)을 사용 중이며, 추후 운영 배포를 위한 K8s 매니페스트(`namespace`, `deployment`, `service`, `ingress`)가 이곳에 추가될 예정입니다.

## 📅 로드맵
- [ ] AWS EKS / On-premise K8s 클러스터 연동
- [ ] ArgoCD를 이용한 GitOps 파이프라인 구축
- [ ] Prometheus + Grafana 모니터링 스택 구성
