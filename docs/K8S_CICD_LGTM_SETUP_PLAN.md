# K8s 클러스터 + CI/CD + LGTM 구축 실행 계획서

> 작성일: 2026-02-13
> 작성자: jun
> 목적: K8s 클러스터 구축 후 CI/CD 파이프라인과 LGTM 모니터링 스택을 최우선으로 구성
> 참조 문서: `docs/K8S_MIGRATION_PLAN.md`, `docs/K8S_TECH_STACK.md`, `VM_SETUP_GUIDE.md`

---

## 전체 로드맵 (3단계)

```
Phase 1: K8s 클러스터 기본 구축
  → kubeadm + Calico + MetalLB + Istio 기본 뼈대

Phase 2: CI/CD 파이프라인 구축
  → gitlab.com (SaaS) + SonarCloud + GitLab Container Registry + ArgoCD (K8s 내 GitLab Runner)

Phase 3: LGTM 모니터링 스택 구축
  → Monitoring VM(Loki/Grafana/Tempo/Mimir) + K8s Alloy DaemonSet
```

---

## Phase 1: K8s 클러스터 기본 구축

### 1-1. VM 준비 (K8s 노드)

K8s 클러스터용 VM을 준비합니다.

**K8s 클러스터 VM 구성:**

| VM | 역할 | RAM | CPU | 디스크 | IP (예시) |
|----|------|-----|-----|--------|-----------|
| k8s-master | Control Plane | 4 GB | 2 코어 | 50 GB | 192.168.56.20 |
| k8s-worker1 | Worker Node | 8 GB | 4 코어 | 80 GB | 192.168.56.21 |
| k8s-worker2 | Worker Node | 8 GB | 4 코어 | 80 GB | 192.168.56.22 |
| k8s-worker3 | Worker Node (Data) | 8 GB | 4 코어 | 100 GB | 192.168.56.23 |
| monitoring | LGTM Stack (Phase 3) | 4 GB | 4 코어 | 200 GB | 192.168.56.30 |

> **네트워크**: 기존과 동일한 VirtualBox Host-Only 네트워크 (192.168.56.0/24) 사용
> **OS**: Ubuntu 22.04 LTS Server

**VM이 부족한 경우 최소 구성 (3노드):**

| VM | 역할 | RAM | CPU | IP |
|----|------|-----|-----|------|
| k8s-master | Control Plane + Worker | 4 GB | 2 코어 | 192.168.56.20 |
| k8s-worker1 | Worker (App + Data) | 12 GB | 4 코어 | 192.168.56.21 |
| monitoring | LGTM Stack | 4 GB | 4 코어 | 192.168.56.30 |

> 최소 구성 시 master에 `kubectl taint nodes --all node-role.kubernetes.io/control-plane-` 실행하여 워크로드 스케줄링 허용

### 1-1-1. VirtualBox VM 생성 (수동, GUI 필요)

아래 방식으로 진행합니다.

**각 VM마다 반복:**

```
1. VirtualBox → "새로 만들기" 클릭
   - 이름: k8s-master  (또는 k8s-worker1, k8s-worker2, k8s-worker3, monitoring)
   - 종류: Linux
   - 버전: Ubuntu (64-bit)

2. 메모리: 위 표 참고

3. 하드 디스크: VDI, 동적 할당, 위 표 참고

4. 설정 → 시스템 → 프로세서: 위 표 참고

5. 설정 → 네트워크
   - 어댑터 1: NAT (기본, 인터넷용)
   - 어댑터 2 활성화: "호스트 전용 어댑터" → VirtualBox Host-Only Ethernet Adapter

6. 설정 → 저장소 → 광학 드라이브에 ubuntu-22.04 ISO 삽입

7. 시작 → Ubuntu Server 설치
   - 사용자: clouddx
   - 비밀번호: tutum
   - OpenSSH server: ✅ 반드시 체크
```

### 1-1-2. VirtualBox NAT 포트포워딩 설정 (SSH 접속용)

**방법 1: VirtualBox GUI**
```
각 VM → 설정 → 네트워크 → 어댑터 1 (NAT) → 고급 → 포트 포워딩

규칙 추가 (호스트 IP는 반드시 비워둘 것 — 127.0.0.1 입력 시 외부 접속 불가):
┌──────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ 이름          │ 프로토콜  │ 호스트 IP │ 호스트 포트│ 게스트 IP │ 게스트 포트│
├──────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ k8s-master   │ TCP      │ (비워둠) │ 2220     │          │ 22       │
│ k8s-worker1  │ TCP      │ (비워둠) │ 2221     │          │ 22       │
│ k8s-worker2  │ TCP      │ (비워둠) │ 2222     │          │ 22       │
│ k8s-worker3  │ TCP      │ (비워둠) │ 2223     │          │ 22       │
│ monitoring   │ TCP      │ (비워둠) │ 2230     │          │ 22       │
└──────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

**방법 2: VBoxManage CLI (서버 PC PowerShell에서, VM 꺼진 상태)**
```powershell
# VM 이름은 VirtualBox에서 설정한 이름과 정확히 일치해야 함 (VBoxManage list vms 로 확인)
VBoxManage modifyvm "clouddx-master" --natpf1 "ssh,tcp,,2220,,22"
VBoxManage modifyvm "clouddx-worker1" --natpf1 "ssh,tcp,,2221,,22"
VBoxManage modifyvm "clouddx-worker2" --natpf1 "ssh,tcp,,2222,,22"
VBoxManage modifyvm "clouddx-worker3" --natpf1 "ssh,tcp,,2223,,22"
VBoxManage modifyvm "clouddx-monitoring" --natpf1 "ssh,tcp,,2230,,22"
```

**방법 2-1: VM이 켜진 상태에서**
```powershell
VBoxManage controlvm "clouddx-master" natpf1 "ssh,tcp,,2220,,22"
VBoxManage controlvm "clouddx-worker1" natpf1 "ssh,tcp,,2221,,22"
VBoxManage controlvm "clouddx-worker2" natpf1 "ssh,tcp,,2222,,22"
VBoxManage controlvm "clouddx-worker3" natpf1 "ssh,tcp,,2223,,22"
VBoxManage controlvm "clouddx-monitoring" natpf1 "ssh,tcp,,2230,,22"
```

> K8s용: master=2220, worker1=2221, worker2=2222, worker3=2223, monitoring=2230

**서버 PC Windows 방화벽 (PowerShell 관리자 권한):**
```powershell
netsh advfirewall firewall add rule name="K8s SSH Master" dir=in action=allow protocol=TCP localport=2220
netsh advfirewall firewall add rule name="K8s SSH Worker1" dir=in action=allow protocol=TCP localport=2221
netsh advfirewall firewall add rule name="K8s SSH Worker2" dir=in action=allow protocol=TCP localport=2222
netsh advfirewall firewall add rule name="K8s SSH Worker3" dir=in action=allow protocol=TCP localport=2223
netsh advfirewall firewall add rule name="K8s SSH Monitoring" dir=in action=allow protocol=TCP localport=2230
```

> NAT 포트포워딩만으로는 외부 접속 불가. 서버 PC의 Windows 방화벽에서 해당 포트를 열어야 함

**접속 방법 (외부 PC에서):**
```bash
ssh -p 2220 clouddx@192.168.0.28  # k8s-master
ssh -p 2221 clouddx@192.168.0.28  # k8s-worker1
ssh -p 2222 clouddx@192.168.0.28  # k8s-worker2
ssh -p 2223 clouddx@192.168.0.28  # k8s-worker3
ssh -p 2230 clouddx@192.168.0.28  # k8s-monitoring
```

### 1-1-3. 고정 IP 설정 (각 VM에서 실행)

```bash
# 네트워크 인터페이스 확인
ip a
# enp0s3 = NAT (인터넷)
# enp0s8 = Host-Only (고정 IP 설정 대상)
```

**k8s-master:**
```bash
sudo tee /etc/netplan/99-host-only.yaml <<EOF
network:
  version: 2
  ethernets:
    enp0s8:
      addresses:
        - 192.168.56.20/24
EOF
sudo netplan apply
```

**k8s-worker1:**
```bash
sudo tee /etc/netplan/99-host-only.yaml <<EOF
network:
  version: 2
  ethernets:
    enp0s8:
      addresses:
        - 192.168.56.21/24
EOF
sudo netplan apply
```

**k8s-worker2:**
```bash
sudo tee /etc/netplan/99-host-only.yaml <<EOF
network:
  version: 2
  ethernets:
    enp0s8:
      addresses:
        - 192.168.56.22/24
EOF
sudo netplan apply
```

**k8s-worker3:**
```bash
sudo tee /etc/netplan/99-host-only.yaml <<EOF
network:
  version: 2
  ethernets:
    enp0s8:
      addresses:
        - 192.168.56.23/24
EOF
sudo netplan apply
```

**monitoring:**
```bash
sudo tee /etc/netplan/99-host-only.yaml <<EOF
network:
  version: 2
  ethernets:
    enp0s8:
      addresses:
        - 192.168.56.30/24
EOF
sudo netplan apply
```

### 1-1-4. SSH 접속 확인

**Windows PowerShell/Terminal에서:**
```powershell
# Host-Only 네트워크로 직접 접속
ssh clouddx@192.168.56.20   # k8s-master
ssh clouddx@192.168.56.21   # k8s-worker1
ssh clouddx@192.168.56.22   # k8s-worker2
ssh clouddx@192.168.56.23   # k8s-worker3
ssh clouddx@192.168.56.30   # monitoring

# 또는 NAT 포트포워딩으로 접속
ssh -p 2220 clouddx@127.0.0.1   # k8s-master
ssh -p 2221 clouddx@127.0.0.1   # k8s-worker1
ssh -p 2222 clouddx@127.0.0.1   # k8s-worker2
ssh -p 2223 clouddx@127.0.0.1   # k8s-worker3
ssh -p 2230 clouddx@127.0.0.1   # monitoring

```

**편의를 위한 SSH config 추가 (`C:\Users\CloudDX\.ssh\config`):**
```
# === K8s VM ===
Host k8s-master
    HostName 192.168.56.20
    User clouddx
    Port 22

Host k8s-worker1
    HostName 192.168.56.21
    User clouddx
    Port 22

Host k8s-worker2
    HostName 192.168.56.22
    User clouddx
    Port 22

Host k8s-worker3
    HostName 192.168.56.23
    User clouddx
    Port 22

Host monitoring
    HostName 192.168.56.30
    User clouddx
    Port 22

```

이후 `ssh k8s-master`, `ssh k8s-worker1`, `ssh k8s-worker3`, `ssh monitoring` 으로 간편 접속.

### 1-1-5. UFW 방화벽 설정

**모든 K8s VM 공통:**
```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
```

**k8s-master 추가 규칙:**
```bash
# K8s API Server
sudo ufw allow 6443/tcp

# etcd
sudo ufw allow from 192.168.56.0/24 to any port 2379:2380 proto tcp

# kubelet API
sudo ufw allow from 192.168.56.0/24 to any port 10250 proto tcp

# kube-scheduler
sudo ufw allow from 192.168.56.0/24 to any port 10259 proto tcp

# kube-controller-manager
sudo ufw allow from 192.168.56.0/24 to any port 10257 proto tcp

# Calico BGP (CNI)
sudo ufw allow from 192.168.56.0/24 to any port 179 proto tcp

# Calico VXLAN
sudo ufw allow from 192.168.56.0/24 to any port 4789 proto udp

# ArgoCD NodePort
sudo ufw allow 30443/tcp

# MetalLB (memberlist)
sudo ufw allow from 192.168.56.0/24 to any port 7946 proto tcp
sudo ufw allow from 192.168.56.0/24 to any port 7946 proto udp
```

**k8s-worker1, k8s-worker2, k8s-worker3 추가 규칙:**
```bash
# kubelet API
sudo ufw allow from 192.168.56.0/24 to any port 10250 proto tcp

# NodePort 서비스 범위
sudo ufw allow 30000:32767/tcp

# Calico BGP (CNI)
sudo ufw allow from 192.168.56.0/24 to any port 179 proto tcp

# Calico VXLAN
sudo ufw allow from 192.168.56.0/24 to any port 4789 proto udp

# Istio Envoy Sidecar (앱 간 통신)
sudo ufw allow from 10.244.0.0/16 to any  # Pod CIDR

# MetalLB (memberlist)
sudo ufw allow from 192.168.56.0/24 to any port 7946 proto tcp
sudo ufw allow from 192.168.56.0/24 to any port 7946 proto udp

# GitLab Container Registry (registry.gitlab.com) + gitlab.com + sonarcloud.io 접근
# HTTPS(443)이므로 insecure registry 설정 불필요
sudo ufw allow out to any port 443 proto tcp
```

**monitoring VM 추가 규칙:**
```bash
# Grafana (웹 대시보드)
sudo ufw allow 3000/tcp

# Loki (로그 수신 - Alloy에서 push)
sudo ufw allow from 192.168.56.0/24 to any port 3100 proto tcp

# Tempo (트레이스 수신 - Alloy에서 push)
sudo ufw allow from 192.168.56.0/24 to any port 4317 proto tcp   # OTLP gRPC
sudo ufw allow from 192.168.56.0/24 to any port 4318 proto tcp   # OTLP HTTP
sudo ufw allow from 192.168.56.0/24 to any port 3200 proto tcp   # Tempo API

# Mimir (메트릭 수신 - Alloy에서 push)
sudo ufw allow from 192.168.56.0/24 to any port 9009 proto tcp

# InfluxDB (k6 결과)
sudo ufw allow from 192.168.56.0/24 to any port 8086 proto tcp

# Kibana (ES UI)
sudo ufw allow 5601/tcp

# Kiali (Istio UI)
sudo ufw allow 20001/tcp
```

**방화벽 상태 확인:**
```bash
sudo ufw status verbose
```

### 1-1-6. VM 간 통신 확인

```bash
# k8s-master에서
ping 192.168.56.21   # → k8s-worker1
ping 192.168.56.22   # → k8s-worker2
ping 192.168.56.23   # → k8s-worker3
ping 192.168.56.30   # → monitoring

# monitoring에서
ping 192.168.56.20   # → k8s-master
ping 192.168.56.21   # → k8s-worker1
```

> **여기까지 완료되면 SSH 접속 정보를 알려주세요.**
> 이후 1-2부터 (containerd, kubeadm, K8s 클러스터 구축 등) 전부 SSH로 원격 작업 가능합니다.

---

### 1-2. 모든 K8s 노드 공통 설정

**각 K8s 노드(master, worker1, worker2, worker3)에서 실행:**

```bash
# ─── 1) swap 비활성화 (K8s 필수) ───
sudo swapoff -a
sudo sed -i '/ swap / s/^/#/' /etc/fstab

# ─── 2) 커널 모듈 로드 ───
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF
sudo modprobe overlay
sudo modprobe br_netfilter

# ─── 3) 커널 파라미터 설정 ───
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sudo sysctl --system

# ─── 4) containerd 설치 ───
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg

# Docker 공식 GPG 키 & 레포 추가
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y containerd.io

# containerd 기본 설정 생성 + SystemdCgroup 활성화
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl restart containerd
sudo systemctl enable containerd

# ─── 5) kubeadm, kubelet, kubectl 설치 ───
# K8s 공식 패키지 레포 추가 (v1.29 기준, 설치 시점 최신 안정 버전 확인)
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

# ─── 6) /etc/hosts 설정 ───
# (GitLab Container Registry는 registry.gitlab.com으로 HTTPS 접근하므로 insecure registry 설정 불필요)
cat <<EOF | sudo tee -a /etc/hosts
192.168.56.20 k8s-master
192.168.56.21 k8s-worker1
192.168.56.22 k8s-worker2
192.168.56.23 k8s-worker3
192.168.56.30 monitoring.tutum.local
EOF
```

### 1-3. Master 노드 초기화

**k8s-master(192.168.56.20)에서만 실행:**

```bash
# ─── kubeadm init ───
sudo kubeadm init \
  --apiserver-advertise-address=192.168.56.20 \
  --pod-network-cidr=10.244.0.0/16 \
  --service-cidr=10.96.0.0/12 \
  --control-plane-endpoint=192.168.56.20:6443

# ─── kubeconfig 설정 ───
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# ─── join 명령어 메모 ───
# 출력된 kubeadm join 명령어를 복사해둘 것!
# 예: kubeadm join 192.168.56.20:6443 --token xxxx --discovery-token-ca-cert-hash sha256:xxxx
```

### 1-4. Worker 노드 조인

**각 worker 노드(worker1, worker2, worker3)에서 실행:**

```bash
# master init 시 출력된 join 명령어 실행
sudo kubeadm join 192.168.56.20:6443 \
  --token <TOKEN> \
  --discovery-token-ca-cert-hash sha256:<HASH>
```

**master에서 노드 확인:**

```bash
kubectl get nodes
# 모든 노드가 NotReady 상태 → CNI 설치 후 Ready로 전환됨
```

### 1-5. Calico CNI 설치

**k8s-master에서 실행:**

```bash
# Calico operator 설치
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/tigera-operator.yaml

# Calico 커스텀 리소스 (pod CIDR 매칭)
cat <<EOF | kubectl apply -f -
apiVersion: operator.tigera.io/v1
kind: Installation
metadata:
  name: default
spec:
  calicoNetwork:
    ipPools:
    - cidr: 10.244.0.0/16
      encapsulation: VXLANCrossSubnet
      natOutgoing: Enabled
      nodeSelector: all()
EOF

# 설치 확인 (모든 노드 Ready까지 1~3분 소요)
watch kubectl get nodes
# NAME          STATUS   ROLES           AGE   VERSION
# k8s-master    Ready    control-plane   5m    v1.29.x
# k8s-worker1   Ready    <none>          3m    v1.29.x
# k8s-worker2   Ready    <none>          3m    v1.29.x
```

### 1-6. MetalLB 설치 (Bare-Metal LoadBalancer)

```bash
# MetalLB 설치
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.3/config/manifests/metallb-native.yaml

# MetalLB가 준비될 때까지 대기
kubectl wait --namespace metallb-system \
  --for=condition=ready pod \
  --selector=app=metallb \
  --timeout=120s

# IP 풀 설정 (Istio Ingress Gateway용)
cat <<EOF | kubectl apply -f -
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: tutum-pool
  namespace: metallb-system
spec:
  addresses:
    - 192.168.56.100-192.168.56.110
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: tutum-l2
  namespace: metallb-system
spec:
  ipAddressPools:
    - tutum-pool
EOF
```

> MetalLB가 192.168.56.100~110 범위에서 LoadBalancer IP를 할당합니다.
> Istio Ingress Gateway가 이 IP 중 하나를 받아 외부 트래픽을 수신합니다.

### 1-7. 네임스페이스 생성

```bash
# 애플리케이션 네임스페이스
kubectl create namespace tutum-app
kubectl create namespace tutum-data
kubectl create namespace tutum-storage

# 인프라 네임스페이스
kubectl create namespace monitoring
kubectl create namespace argocd
kubectl create namespace kyverno

# 네임스페이스 레이블 (NetworkPolicy용)
kubectl label namespace tutum-app name=tutum-app
kubectl label namespace tutum-data name=tutum-data
kubectl label namespace tutum-storage name=tutum-storage
kubectl label namespace monitoring name=monitoring

# Istio 사이드카 주입 설정
kubectl label namespace tutum-app istio-injection=enabled
kubectl label namespace tutum-data istio-injection=disabled
```

### 1-8. Istio 서비스 메시 설치

```bash
# istioctl 다운로드
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.21.0 sh -
sudo mv istio-1.21.0/bin/istioctl /usr/local/bin/

# Istio 설치 (default 프로파일 = istiod + ingress gateway)
istioctl install --set profile=default -y

# 설치 확인
kubectl get pods -n istio-system
# NAME                                    READY   STATUS
# istio-ingressgateway-xxxxx              1/1     Running
# istiod-xxxxx                            1/1     Running

# Istio Ingress Gateway에 MetalLB IP 할당 확인
kubectl get svc -n istio-system istio-ingressgateway
# EXTERNAL-IP 에 192.168.56.10x 가 보여야 함
```

### 1-9. Istio Gateway + VirtualService 기본 설정

```bash
cat <<'EOF' | kubectl apply -f -
# Istio Gateway - 외부 트래픽 진입
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: tutum-gateway
  namespace: tutum-app
spec:
  selector:
    istio: ingressgateway
  servers:
    - port:
        number: 80
        name: http
        protocol: HTTP
      hosts:
        - "*"
---
# mTLS 강제 적용
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: tutum-app
spec:
  mtls:
    mode: STRICT
EOF
```

### 1-10. Phase 1 완료 검증

```bash
# 전체 상태 확인 체크리스트
echo "=== 1. 노드 상태 ==="
kubectl get nodes -o wide

echo "=== 2. 시스템 Pod 상태 ==="
kubectl get pods -n kube-system
kubectl get pods -n calico-system
kubectl get pods -n istio-system
kubectl get pods -n metallb-system

echo "=== 3. 네임스페이스 ==="
kubectl get namespaces

echo "=== 4. MetalLB IP 할당 ==="
kubectl get svc -n istio-system istio-ingressgateway

echo "=== 5. Istio Gateway ==="
kubectl get gateway -n tutum-app

echo "=== 6. 인터넷 접근 테스트 (GitLab CR용) ==="
curl -s https://registry.gitlab.com/v2/ && echo "GitLab Container Registry 접근 OK" || echo "인터넷 접근 실패"
```

**Phase 1 완료 기준:**
- [ ] 모든 노드 `Ready` 상태
- [ ] Calico Pod 전부 `Running`
- [ ] Istio istiod + ingressgateway `Running`
- [ ] MetalLB가 Ingress Gateway에 External IP 할당
- [ ] 네임스페이스 6개 생성 완료 (tutum-app, tutum-data, tutum-storage, monitoring, argocd, kyverno)
- [ ] 인터넷 접근 가능 (GitLab Container Registry: registry.gitlab.com)

---

## Phase 2: CI/CD 파이프라인 구축

> **중요**: CI/CD는 **gitlab.com (SaaS)** + **SonarCloud** + **GitLab Container Registry**를 사용합니다.
> 자체 CI/CD VM은 사용하지 않습니다. GitLab Runner만 K8s 클러스터 내에 Helm chart로 설치합니다.
> 기존 Docker Compose 3-tier VM(node1~3)은 K8s 마이그레이션 후 폐기 대상이므로 절대 사용하지 않습니다.

### 2-0. 사전 준비 (gitlab.com + SonarCloud 계정 설정)

**2-0-1. gitlab.com 설정 (웹 브라우저에서):**
```
1. https://gitlab.com 에서 무료 가입 (또는 GitHub/Google 계정 연동)

2. 그룹 생성: "tutum-project"
   → gitlab.com → Groups → New group → Group name: tutum-project

3. 프로젝트 2개 생성:
   - tutum-project/tutum-app (메인 소스코드)
   - tutum-project/k8s-manifests (GitOps 레포)
   → 각 그룹 페이지 → New project → Create blank project

4. Container Registry 활성화 확인:
   → tutum-app → Settings → General → Visibility → Container registry: Enabled (기본값)
```

**2-0-2. SonarCloud 설정 (웹 브라우저에서):**
```
1. https://sonarcloud.io 에서 가입 (GitLab 계정 연동 추천)

2. Organization 생성: "tutum-project"

3. 프로젝트 2개 생성:
   - tutum-backend (Python)
   - tutum-frontend (TypeScript/JavaScript)

4. My Account → Security → Generate Tokens
   → 생성된 토큰을 나중에 GitLab CI Variables에 SONAR_TOKEN으로 등록

5. Quality Gates 설정 (Organization Settings → Quality Gates):
   - Coverage >= 60%
   - Duplications < 5%
   - New Bugs = 0
   - New Vulnerabilities = 0
   - Code Smells: A등급
```

### 2-1. 코드 Push (로컬 → gitlab.com)

**개발 PC(Windows)에서 실행:**

```bash
# 메인 소스코드 push
cd C:\Users\CloudDX\Desktop\clouddx-project
git remote add gitlab https://gitlab.com/tutum-project/tutum-app.git
git push -u gitlab --all

# k8s-manifests 레포 생성 + push (별도 디렉토리에서)
mkdir k8s-manifests && cd k8s-manifests
git init
git remote add origin https://gitlab.com/tutum-project/k8s-manifests.git
# (2-7에서 디렉토리 구조 작성 후 push)
```

> gitlab.com 접속: `https://gitlab.com/tutum-project`
> Container Registry: `registry.gitlab.com/tutum-project/tutum-app`

### 2-2. GitLab Runner 설치 (K8s 클러스터 내 Helm chart)

GitLab Runner를 K8s 클러스터에 설치하면 CI/CD 실행 시간 제한 없이 사용 가능합니다.

**k8s-master에서 실행:**

```bash
# Helm repo 추가
helm repo add gitlab https://charts.gitlab.io
helm repo update

# Runner namespace 생성
kubectl create namespace gitlab-runner

# Runner Helm values 작성
cat <<'EOF' > gitlab-runner-values.yaml
gitlabUrl: https://gitlab.com
runnerToken: "<RUNNER_TOKEN>"  # gitlab.com → tutum-project → Settings → CI/CD → Runners → New group runner 에서 토큰 확인

rbac:
  create: true

runners:
  config: |
    [[runners]]
      [runners.kubernetes]
        namespace = "gitlab-runner"
        image = "docker:24-dind"
        privileged = true
        [[runners.kubernetes.volumes.empty_dir]]
          name = "docker-certs"
          mount_path = "/certs/client"
          medium = "Memory"
  tags: "k8s,tutum"
  name: "tutum-k8s-runner"

resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 1Gi
EOF

# Runner 설치
helm install gitlab-runner gitlab/gitlab-runner \
  -n gitlab-runner \
  -f gitlab-runner-values.yaml

# 설치 확인
kubectl get pods -n gitlab-runner
```

> Runner 등록 확인: gitlab.com → tutum-project → Settings → CI/CD → Runners 에서 Online 상태 확인
> Runner는 K8s 내에서 실행되므로 별도 VM 불필요

### 2-3. CI/CD Variables 설정 (gitlab.com 웹 UI)

gitlab.com → tutum-project/tutum-app → Settings → CI/CD → Variables:

```
SONAR_TOKEN        = (SonarCloud에서 발급한 토큰)
SONAR_HOST_URL     = https://sonarcloud.io
COSIGN_PASSWORD    = (Cosign 키 비밀번호)
COSIGN_KEY         = (Cosign private key, File 타입)
DEPLOY_TOKEN       = (k8s-manifests 레포 접근용 Project Access Token)
```

> **참고**: GitLab Container Registry 인증은 CI/CD 내장 변수 `$CI_REGISTRY`, `$CI_REGISTRY_USER`, `$CI_REGISTRY_PASSWORD`로 자동 처리됩니다.
> Harbor 관련 변수(HARBOR_*)는 더 이상 필요 없습니다.

### 2-4. Trivy (CI pipeline 컨테이너 - 변경 없음)

Trivy는 CI Runner에서 직접 실행하므로 별도 설치가 필요 없습니다.
`.gitlab-ci.yml`에서 `aquasec/trivy` 이미지를 사용합니다.

```yaml
# .gitlab-ci.yml의 security 스테이지
trivy:backend:
  stage: security
  image:
    name: aquasec/trivy:0.50.0
    entrypoint: [""]
  script:
    - trivy image --exit-code 1 --severity CRITICAL,HIGH --no-progress
        $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  needs: ["build:backend"]

trivy:frontend:
  stage: security
  image:
    name: aquasec/trivy:0.50.0
    entrypoint: [""]
  script:
    - trivy image --exit-code 1 --severity CRITICAL,HIGH --no-progress
        $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  needs: ["build:frontend"]
```

### 2-5. Cosign 이미지 서명 설정

**k8s-master 또는 개발 PC에서 키 쌍 생성:**
```bash
# Cosign 설치 (Linux)
curl -sSL -o cosign https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64
sudo mv cosign /usr/local/bin/
sudo chmod +x /usr/local/bin/cosign

# 키 쌍 생성
cosign generate-key-pair
# → cosign.key (private, GitLab CI Variables에 COSIGN_KEY File 타입으로 등록)
# → cosign.pub (public, K8s Kyverno 정책에 사용)
```

```yaml
# .gitlab-ci.yml의 sign 스테이지
cosign:backend:
  stage: sign
  image: bitnami/cosign:latest
  script:
    - echo "$COSIGN_KEY" > /tmp/cosign.key
    - cosign sign --key /tmp/cosign.key --yes
        $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  needs: ["trivy:backend"]

cosign:frontend:
  stage: sign
  image: bitnami/cosign:latest
  script:
    - echo "$COSIGN_KEY" > /tmp/cosign.key
    - cosign sign --key /tmp/cosign.key --yes
        $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  needs: ["trivy:frontend"]
```

### 2-6. ArgoCD 설치 (K8s 클러스터 내)

```bash
# k8s-master에서 실행

# ArgoCD 설치
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/v2.10.0/manifests/install.yaml

# ArgoCD 서버 외부 접근 설정 (NodePort)
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "nodePort": 30443}]}}'

# 초기 admin 비밀번호 확인
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo

# ArgoCD CLI 설치
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/download/v2.10.0/argocd-linux-amd64
sudo mv argocd /usr/local/bin/
sudo chmod +x /usr/local/bin/argocd

# ArgoCD 로그인
argocd login 192.168.56.20:30443 --insecure --username admin --password <위에서_확인한_비밀번호>

# gitlab.com 레포 등록 (Deploy Token 사용)
argocd repo add https://gitlab.com/tutum-project/k8s-manifests.git \
  --username <DEPLOY_TOKEN_NAME> \
  --password <DEPLOY_TOKEN>
```

> ArgoCD 접속: `https://192.168.56.20:30443`
> ID: admin / PW: 위에서 확인한 비밀번호
> GitLab URL: `https://gitlab.com/tutum-project/k8s-manifests.git` (인터넷 경유)

### 2-7. K8s 매니페스트 레포 생성 (GitOps)

**디렉토리 구조:**

```
k8s-manifests/
├── base/
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── backend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── workers/
│       ├── price-producer.yaml
│       ├── news-producer.yaml
│       ├── indexer-consumer.yaml
│       └── price-consumer.yaml
├── overlays/
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   └── replicas-patch.yaml
│   └── production/
│       ├── kustomization.yaml
│       └── replicas-patch.yaml
└── argocd/
    ├── staging-app.yaml
    └── production-app.yaml
```

**base/frontend/deployment.yaml 예시:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: tutum-app
  labels:
    app: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      imagePullSecrets:
        - name: gitlab-registry-secret
      containers:
        - name: frontend
          image: registry.gitlab.com/tutum-project/tutum-app/frontend:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
```

**imagePullSecrets 설정 (K8s가 GitLab Container Registry에서 이미지 pull):**

```bash
# GitLab에서 Deploy Token 생성 (read_registry scope):
# gitlab.com → tutum-project/tutum-app → Settings → Repository → Deploy tokens
# → Name: k8s-pull, Scopes: read_registry

# K8s Secret 생성 (각 namespace에서)
kubectl create secret docker-registry gitlab-registry-secret \
  --docker-server=registry.gitlab.com \
  --docker-username=<DEPLOY_TOKEN_NAME> \
  --docker-password=<DEPLOY_TOKEN> \
  -n tutum-app

kubectl create secret docker-registry gitlab-registry-secret \
  --docker-server=registry.gitlab.com \
  --docker-username=<DEPLOY_TOKEN_NAME> \
  --docker-password=<DEPLOY_TOKEN> \
  -n tutum-data
```

**ArgoCD Application 등록:**

```yaml
# argocd/staging-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: tutum-staging
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://gitlab.com/tutum-project/k8s-manifests.git
    targetRevision: main
    path: overlays/staging
  destination:
    server: https://kubernetes.default.svc
    namespace: tutum-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

```bash
kubectl apply -f argocd/staging-app.yaml
```

### 2-8. Kyverno 설치 + Cosign 정책

```bash
# Kyverno 설치
kubectl apply -f https://github.com/kyverno/kyverno/releases/download/v1.11.4/install.yaml

# Cosign public key를 K8s Secret으로 등록
kubectl create secret generic cosign-pub-key \
  -n kyverno \
  --from-file=cosign.pub=cosign.pub

# 미서명 이미지 차단 정책
cat <<'EOF' | kubectl apply -f -
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signature
spec:
  validationFailureAction: Enforce
  background: false
  rules:
    - name: verify-cosign-signature
      match:
        any:
          - resources:
              kinds:
                - Pod
              namespaces:
                - tutum-app
      verifyImages:
        - imageReferences:
            - "registry.gitlab.com/tutum-project/*"
          attestors:
            - entries:
                - keys:
                    publicKeys: |-
                      -----BEGIN PUBLIC KEY-----
                      <cosign.pub 내용 붙여넣기>
                      -----END PUBLIC KEY-----
EOF
```

### 2-9. 전체 CI/CD 파이프라인 (.gitlab-ci.yml)

이 파일은 프로젝트 루트에 위치합니다.

```yaml
# .gitlab-ci.yml (최종본 - gitlab.com + SonarCloud + GitLab Container Registry)
stages:
  - lint
  - test
  - scan
  - build
  - security
  - sign
  - deploy

variables:
  SONAR_HOST_URL: "https://sonarcloud.io"

# ── Lint ──
lint:backend:
  stage: lint
  image: python:3.11-slim
  script:
    - pip install ruff
    - cd backend && ruff check .
  rules:
    - changes: [backend/**/*]

lint:frontend:
  stage: lint
  image: node:20-alpine
  script:
    - cd frontend && npm ci && npm run lint
  rules:
    - changes: [frontend/**/*]

# ── Test ──
test:backend:
  stage: test
  image: python:3.11-slim
  services:
    - redis:7-alpine
    - mongo:7
  variables:
    REDIS_URL: "redis://redis:6379"
    MONGODB_URL: "mongodb://mongo:27017"
    MONGODB_DB_NAME: "tutum_test"
  script:
    - cd backend && pip install -r requirements.txt
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
    - changes: [frontend/**/*]

# ── SonarCloud Scan ──
sonarcloud:backend:
  stage: scan
  image:
    name: sonarsource/sonar-scanner-cli:latest
    entrypoint: [""]
  script:
    - sonar-scanner
        -Dsonar.projectKey=tutum-project_tutum-backend
        -Dsonar.organization=tutum-project
        -Dsonar.sources=backend/app
        -Dsonar.host.url=$SONAR_HOST_URL
        -Dsonar.token=$SONAR_TOKEN
        -Dsonar.python.version=3.11
        -Dsonar.qualitygate.wait=true

sonarcloud:frontend:
  stage: scan
  image:
    name: sonarsource/sonar-scanner-cli:latest
    entrypoint: [""]
  script:
    - sonar-scanner
        -Dsonar.projectKey=tutum-project_tutum-frontend
        -Dsonar.organization=tutum-project
        -Dsonar.sources=frontend/app,frontend/components,frontend/lib
        -Dsonar.host.url=$SONAR_HOST_URL
        -Dsonar.token=$SONAR_TOKEN
        -Dsonar.qualitygate.wait=true

# ── Build (GitLab Container Registry) ──
.build_template: &build_template
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY

build:backend:
  <<: *build_template
  script:
    - docker build -t $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHORT_SHA backend/
    - docker push $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes: [backend/**/*]

build:frontend:
  <<: *build_template
  script:
    - docker build -t $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHORT_SHA frontend/
    - docker push $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes: [frontend/**/*]

build:workers:
  <<: *build_template
  script:
    - docker build -t $CI_REGISTRY_IMAGE/workers:$CI_COMMIT_SHORT_SHA backend/workers/
    - docker push $CI_REGISTRY_IMAGE/workers:$CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes: [backend/workers/**/*]

# ── Security (Trivy) ──
trivy:backend:
  stage: security
  image:
    name: aquasec/trivy:0.50.0
    entrypoint: [""]
  script:
    - trivy image --exit-code 1 --severity CRITICAL,HIGH --no-progress
        $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHORT_SHA
  needs: ["build:backend"]
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

trivy:frontend:
  stage: security
  image:
    name: aquasec/trivy:0.50.0
    entrypoint: [""]
  script:
    - trivy image --exit-code 1 --severity CRITICAL,HIGH --no-progress
        $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHORT_SHA
  needs: ["build:frontend"]
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

# ── Sign (Cosign) ──
cosign:backend:
  stage: sign
  image: bitnami/cosign:latest
  script:
    - echo "$COSIGN_KEY" > /tmp/cosign.key
    - cosign sign --key /tmp/cosign.key --yes
        $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHORT_SHA
  needs: ["trivy:backend"]
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

cosign:frontend:
  stage: sign
  image: bitnami/cosign:latest
  script:
    - echo "$COSIGN_KEY" > /tmp/cosign.key
    - cosign sign --key /tmp/cosign.key --yes
        $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHORT_SHA
  needs: ["trivy:frontend"]
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

# ── Deploy (ArgoCD) ──
deploy:staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache git
  script:
    - git clone https://$DEPLOY_TOKEN@gitlab.com/tutum-project/k8s-manifests.git
    - cd k8s-manifests/overlays/staging
    - |
      sed -i "s|image: .*backend:.*|image: $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHORT_SHA|g" kustomization.yaml
      sed -i "s|image: .*frontend:.*|image: $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHORT_SHA|g" kustomization.yaml
    - git add . && git commit -m "deploy: staging $CI_COMMIT_SHORT_SHA" && git push
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
    - git clone https://$DEPLOY_TOKEN@gitlab.com/tutum-project/k8s-manifests.git
    - cd k8s-manifests/overlays/production
    - |
      sed -i "s|image: .*backend:.*|image: $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHORT_SHA|g" kustomization.yaml
      sed -i "s|image: .*frontend:.*|image: $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHORT_SHA|g" kustomization.yaml
    - git add . && git commit -m "deploy: production $CI_COMMIT_SHORT_SHA" && git push
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
  environment:
    name: production
```

### 2-10. Phase 2 완료 검증

**gitlab.com 웹 UI에서:**
```
1. gitlab.com → tutum-project/tutum-app → CI/CD → Pipelines → Run pipeline
   → 모든 스테이지(lint → test → scan → build → security → sign → deploy) 통과 확인

2. gitlab.com → tutum-project/tutum-app → Packages & Registries → Container Registry
   → backend, frontend 이미지가 push되어 있는지 확인

3. SonarCloud (sonarcloud.io) → tutum-project
   → 코드 분석 결과 확인, Quality Gate 통과 여부
```

**k8s-master에서 실행:**
```bash
# 1. GitLab Runner 상태
kubectl get pods -n gitlab-runner

# 2. ArgoCD 상태
kubectl get pods -n argocd
argocd app list

# 3. Kyverno 상태
kubectl get pods -n kyverno

# 4. GitLab Container Registry 이미지 pull 테스트
crictl pull registry.gitlab.com/tutum-project/tutum-app/backend:latest 2>&1 || echo "이미지 없으면 정상 에러"
```

**Phase 2 완료 기준:**
- [ ] gitlab.com에 tutum-project 그룹 + 프로젝트 2개(tutum-app, k8s-manifests) 생성 완료
- [ ] 코드 push 완료 (`git push gitlab --all`)
- [ ] SonarCloud 프로젝트 2개(backend/frontend) 생성 + Quality Gate 설정
- [ ] GitLab Runner가 K8s 클러스터에서 Running 상태
- [ ] CI Variables 등록 완료 (SONAR_TOKEN, COSIGN_KEY, COSIGN_PASSWORD, DEPLOY_TOKEN)
- [ ] Cosign 키 쌍 생성 + public key Kyverno 정책 적용
- [ ] ArgoCD 설치 + gitlab.com 레포 연동 + Application(staging) 생성
- [ ] imagePullSecrets 설정 (K8s → GitLab Container Registry)
- [ ] Kyverno 미서명 이미지 차단 정책 적용
- [ ] 테스트 파이프라인 전체 스테이지 통과 (최소 lint → build → push)
- [ ] `k8s-manifests` 레포 생성 + base/overlays 구조 작성

---

## Phase 3: LGTM 모니터링 스택 구축

### 3-1. Monitoring VM 준비

**monitoring VM(192.168.56.30) 기본 설정:**

```bash
# Docker 설치 (VM_SETUP_GUIDE.md 참조)
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker

# /etc/hosts 설정
cat <<EOF | sudo tee -a /etc/hosts
192.168.56.20 k8s-master
192.168.56.21 k8s-worker1
192.168.56.22 k8s-worker2
192.168.56.23 k8s-worker3
EOF

# 디렉토리 구조 생성
sudo mkdir -p /opt/monitoring/{loki,tempo,mimir,grafana/provisioning/datasources,grafana/provisioning/dashboards}
```

### 3-2. LGTM Docker Compose 배포

```bash
cat <<'EOF' > /opt/monitoring/docker-compose.yml
services:
  # ── Loki (로그 저장) ──
  loki:
    image: grafana/loki:3.0.0
    ports:
      - "3100:3100"
    volumes:
      - ./loki/config.yml:/etc/loki/config.yml
      - loki_data:/loki
    command: -config.file=/etc/loki/config.yml
    restart: unless-stopped

  # ── Tempo (트레이스 저장) ──
  tempo:
    image: grafana/tempo:2.4.0
    ports:
      - "4317:4317"    # OTLP gRPC (Alloy → Tempo)
      - "4318:4318"    # OTLP HTTP
      - "3200:3200"    # Tempo API (Grafana 쿼리용)
    volumes:
      - ./tempo/config.yml:/etc/tempo/config.yml
      - tempo_data:/var/tempo
    command: -config.file=/etc/tempo/config.yml
    restart: unless-stopped

  # ── Mimir (메트릭 저장) ──
  mimir:
    image: grafana/mimir:2.12.0
    ports:
      - "9009:9009"
    volumes:
      - ./mimir/config.yml:/etc/mimir/config.yml
      - mimir_data:/data
    command:
      - -config.file=/etc/mimir/config.yml
    restart: unless-stopped

  # ── Grafana (대시보드) ──
  grafana:
    image: grafana/grafana:11.0.0
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=tutum2026!
      - GF_USERS_ALLOW_SIGN_UP=false
    depends_on:
      - loki
      - tempo
      - mimir
    restart: unless-stopped

  # ── InfluxDB (k6 부하테스트 결과 저장) ──
  influxdb:
    image: influxdb:2.7
    ports:
      - "8086:8086"
    volumes:
      - influxdb_data:/var/lib/influxdb2
    environment:
      - DOCKER_INFLUXDB_INIT_MODE=setup
      - DOCKER_INFLUXDB_INIT_USERNAME=admin
      - DOCKER_INFLUXDB_INIT_PASSWORD=tutum2026!
      - DOCKER_INFLUXDB_INIT_ORG=tutum
      - DOCKER_INFLUXDB_INIT_BUCKET=k6
    restart: unless-stopped

volumes:
  loki_data:
  tempo_data:
  mimir_data:
  grafana_data:
  influxdb_data:
EOF
```

### 3-3. LGTM 설정 파일 작성

**Loki 설정:**

```bash
cat <<'EOF' > /opt/monitoring/loki/config.yml
auth_enabled: false

server:
  http_listen_port: 3100

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

limits_config:
  retention_period: 30d
  ingestion_rate_mb: 10
  ingestion_burst_size_mb: 20

compactor:
  working_directory: /loki/compactor
  retention_enabled: true
EOF
```

**Tempo 설정:**

```bash
cat <<'EOF' > /opt/monitoring/tempo/config.yml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: "0.0.0.0:4317"
        http:
          endpoint: "0.0.0.0:4318"

storage:
  trace:
    backend: local
    local:
      path: /var/tempo/traces
    wal:
      path: /var/tempo/wal

metrics_generator:
  registry:
    external_labels:
      source: tempo
      cluster: tutum
  storage:
    path: /var/tempo/generator/wal
    remote_write:
      - url: http://mimir:9009/api/v1/push
        send_exemplars: true

overrides:
  defaults:
    metrics_generator:
      processors: [service-graphs, span-metrics]
EOF
```

**Mimir 설정:**

```bash
cat <<'EOF' > /opt/monitoring/mimir/config.yml
multitenancy_enabled: false

server:
  http_listen_port: 9009

blocks_storage:
  backend: filesystem
  filesystem:
    dir: /data/blocks
  tsdb:
    dir: /data/tsdb
  bucket_store:
    sync_dir: /data/bucket-sync

compactor:
  data_dir: /data/compactor

distributor:
  ring:
    kvstore:
      store: memberlist

ingester:
  ring:
    kvstore:
      store: memberlist
    replication_factor: 1

store_gateway:
  sharding_ring:
    replication_factor: 1

limits:
  max_global_series_per_user: 500000
  ingestion_rate: 10000
  ingestion_burst_size: 200000

ruler_storage:
  backend: filesystem
  filesystem:
    dir: /data/rules
EOF
```

**Grafana 데이터소스 자동 프로비저닝:**

```bash
cat <<'EOF' > /opt/monitoring/grafana/provisioning/datasources/datasources.yml
apiVersion: 1
datasources:
  - name: Mimir
    type: prometheus
    access: proxy
    url: http://mimir:9009/prometheus
    isDefault: true
    jsonData:
      httpMethod: POST

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    jsonData:
      derivedFields:
        - datasourceUid: tempo
          matcherRegex: "traceID=(\\w+)"
          name: TraceID
          url: "$${__value.raw}"

  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    uid: tempo
    jsonData:
      tracesToLogs:
        datasourceUid: loki
        tags: ["service.name"]
      nodeGraph:
        enabled: true

  - name: InfluxDB
    type: influxdb
    access: proxy
    url: http://influxdb:8086
    jsonData:
      version: Flux
      organization: tutum
      defaultBucket: k6
    secureJsonData:
      token: "${INFLUXDB_TOKEN}"
EOF
```

### 3-4. LGTM 스택 시작

```bash
cd /opt/monitoring
docker compose up -d

# 상태 확인
docker compose ps
# 모든 컨테이너 healthy/running 확인

# 각 서비스 접근 테스트
curl -s http://localhost:3100/ready     # Loki
curl -s http://localhost:3200/ready     # Tempo
curl -s http://localhost:9009/ready     # Mimir
curl -s http://localhost:3000/api/health # Grafana
```

> Grafana 접속: `http://192.168.56.30:3000`
> ID: admin / PW: tutum2026!

### 3-5. Grafana Alloy 설치 (K8s 클러스터 내 DaemonSet)

**k8s-master에서 실행:**

```bash
# Alloy ConfigMap 작성
cat <<'EOF' > alloy-config.alloy
// ============================================
// 1. Kubernetes 서비스 디스커버리
// ============================================
discovery.kubernetes "pods" {
  role = "pod"
}

discovery.kubernetes "nodes" {
  role = "node"
}

// ============================================
// 2. Metrics → Mimir (192.168.56.30:9009)
// ============================================
prometheus.scrape "k8s_pods" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [prometheus.remote_write.mimir.receiver]
  scrape_interval = "30s"
}

prometheus.scrape "node_metrics" {
  targets    = discovery.kubernetes.nodes.targets
  forward_to = [prometheus.remote_write.mimir.receiver]
  scrape_interval = "30s"
}

prometheus.remote_write "mimir" {
  endpoint {
    url = "http://192.168.56.30:9009/api/v1/push"
  }
}

// ============================================
// 3. Logs → Loki (192.168.56.30:3100)
// ============================================
loki.source.kubernetes "k8s_logs" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [loki.write.default.receiver]
}

loki.write "default" {
  endpoint {
    url = "http://192.168.56.30:3100/loki/api/v1/push"
  }
}

// ============================================
// 4. Traces → Tempo (192.168.56.30:4317)
// ============================================
otelcol.receiver.otlp "default" {
  grpc { endpoint = "0.0.0.0:4317" }
  http { endpoint = "0.0.0.0:4318" }
  output {
    traces = [otelcol.exporter.otlp.tempo.input]
  }
}

otelcol.exporter.otlp "tempo" {
  client {
    endpoint = "192.168.56.30:4317"
    tls { insecure = true }
  }
}
EOF

# Helm으로 Alloy 설치
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

kubectl create configmap alloy-config \
  --from-file=config.alloy=alloy-config.alloy \
  -n monitoring

helm install alloy grafana/alloy \
  --namespace monitoring \
  --set alloy.configMap.create=false \
  --set alloy.configMap.name=alloy-config \
  --set alloy.configMap.key=config.alloy

# DaemonSet 확인 (모든 노드에 1개씩 실행되어야 함)
kubectl get pods -n monitoring -o wide
```

### 3-6. Grafana 대시보드 구성

Grafana UI에서 아래 대시보드를 Import 합니다:

| 대시보드 | Grafana ID | 데이터소스 | 용도 |
|---------|------------|----------|------|
| Kubernetes Cluster | 15520 | Mimir | 클러스터 전체 상태 |
| Node Exporter | 1860 | Mimir | 노드별 CPU/Memory/Disk |
| Kubernetes Pods | 15760 | Mimir | Pod별 리소스 사용량 |
| Istio Mesh | 7639 | Mimir | 서비스 메시 트래픽 |
| Loki Logs | 13639 | Loki | 로그 탐색 |

**커스텀 대시보드:**
- **CloudDX Overview**: Backend API 응답시간, 에러율, Kafka Lag, Redis 히트율
- **k6 Load Test**: 부하 테스트 결과 시각화 (InfluxDB 데이터소스)

### 3-7. 알림 규칙 설정

Grafana UI → Alerting → Alert rules 에서 설정:

```yaml
# 주요 알림 규칙
- BackendDown: up{job="backend"} == 0 (1분 지속 시 Critical)
- HighErrorRate: rate(http_5xx[5m]) > 5% (5분 지속 시 Critical)
- KafkaConsumerLag: kafka_consumer_group_lag > 1000 (10분 지속 시 Warning)
- RedisMemoryHigh: redis_memory_used > 80% (5분 지속 시 Warning)
- HighLatency: p95 응답시간 > 2초 (5분 지속 시 Warning)
- NodeDiskFull: disk_used > 85% (Warning)
```

### 3-8. Phase 3 완료 검증

```bash
# 1. Monitoring VM 서비스 상태
curl -s http://192.168.56.30:3100/ready && echo "Loki: OK"
curl -s http://192.168.56.30:3200/ready && echo "Tempo: OK"
curl -s http://192.168.56.30:9009/ready && echo "Mimir: OK"
curl -s http://192.168.56.30:3000/api/health && echo "Grafana: OK"

# 2. K8s Alloy DaemonSet 상태
kubectl get pods -n monitoring

# 3. Grafana에서 데이터 확인
# Grafana UI → Explore → Mimir → up 쿼리 → K8s 노드/Pod 메트릭이 보여야 함
# Grafana UI → Explore → Loki → {namespace="tutum-app"} → 앱 로그가 보여야 함

# 4. K8s → Monitoring VM 네트워크 확인
kubectl run test-curl --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s http://192.168.56.30:3100/ready
```

**Phase 3 완료 기준:**
- [ ] Monitoring VM에 Loki, Tempo, Mimir, Grafana, InfluxDB 전부 `running`
- [ ] Grafana 로그인 + 데이터소스 4개(Mimir, Loki, Tempo, InfluxDB) 연결 확인
- [ ] K8s Alloy DaemonSet이 모든 노드에서 `Running`
- [ ] Grafana에서 K8s 메트릭 조회 가능 (Mimir)
- [ ] Grafana에서 K8s 로그 조회 가능 (Loki)
- [ ] 기본 대시보드 5개 이상 Import 완료
- [ ] 알림 규칙 5개 이상 설정 완료

---

## 전체 완료 후 검증 시나리오

### E2E 테스트: 코드 Push → 자동 배포 → 모니터링

```
1. GitLab에 코드 push
   → GitLab CI 트리거

2. CI 파이프라인 실행
   → lint → test → sonarcloud → build → trivy → cosign → GitLab CR push

3. deploy 스테이지
   → k8s-manifests 레포의 이미지 태그 업데이트

4. ArgoCD Auto Sync
   → k8s-manifests 변경 감지 → K8s 클러스터에 새 버전 배포

5. Kyverno 검증
   → Cosign 서명 확인 → 통과 시 배포, 미서명 시 차단

6. 모니터링 확인
   → Grafana에서 새 Pod 메트릭/로그 확인
   → 배포 후 에러율 대시보드 모니터링
```

---

## 네트워크 포트 정리

| 서비스 | 호스트 | IP | 포트 | 접근 대상 |
|--------|--------|------|------|----------|
| **GitLab** | gitlab.com (SaaS) | - | 443 (HTTPS) | 브라우저, CI Runner, ArgoCD |
| **SonarCloud** | sonarcloud.io (SaaS) | - | 443 (HTTPS) | 브라우저, CI Runner |
| **GitLab Runner** | K8s 클러스터 (gitlab-runner ns) | - | - | gitlab.com에서 Job 수신 |
| **GitLab Container Registry** | registry.gitlab.com (SaaS) | - | 443 (HTTPS) | CI Runner, K8s |
| K8s API | k8s-master | 192.168.56.20 | 6443 | kubectl, ArgoCD |
| ArgoCD | k8s-master (NodePort) | 192.168.56.20 | 30443 | 브라우저 |
| Istio Gateway | MetalLB VIP | 192.168.56.100~110 | 80/443 | 사용자 |
| Grafana | monitoring VM | 192.168.56.30 | 3000 | 브라우저 |
| Loki | monitoring VM | 192.168.56.30 | 3100 | Alloy |
| Tempo | monitoring VM | 192.168.56.30 | 4317/3200 | Alloy |
| Mimir | monitoring VM | 192.168.56.30 | 9009 | Alloy |
| InfluxDB | monitoring VM | 192.168.56.30 | 8086 | k6, Grafana |

> **CI/CD 도구 접근 경로 정리:**
> - 브라우저 → GitLab: `https://gitlab.com/tutum-project` (인터넷)
> - 브라우저 → SonarCloud: `https://sonarcloud.io` (인터넷)
> - K8s Runner → GitLab/SonarCloud/Registry: 인터넷 경유 (HTTPS)
> - ArgoCD(K8s) → GitLab: `https://gitlab.com/tutum-project/k8s-manifests.git` (인터넷 경유)
> - K8s → GitLab Container Registry: `registry.gitlab.com` (인터넷 경유, imagePullSecrets 필요)

---

## 주의사항

1. **기존 Docker Compose 3-tier VM(node1~3, 192.168.56.11~13)은 K8s 마이그레이션 후 폐기 대상** — 절대 사용하지 않음
2. **CI/CD 전용 VM(192.168.56.40) 사용하지 않음** — gitlab.com (SaaS) + SonarCloud + GitLab Container Registry 사용
3. **GitLab Runner는 K8s 클러스터 내 Helm chart로 설치** — 별도 VM 불필요, CI/CD 실행 시간 무제한
4. **imagePullSecrets 필수** — K8s가 GitLab Container Registry(registry.gitlab.com)에서 이미지 pull하려면 Deploy Token + K8s Secret 필요
5. **K8s 노드에서 인터넷 접근 필수** — gitlab.com, registry.gitlab.com, sonarcloud.io 접근 (NAT 어댑터로 이미 가능)
6. **MariaDB는 외부 서버** — K8s에 포함하지 않음, 학원 온프레미스 서버에서 IP:Port 접속
7. **MongoDB Atlas → K8s StatefulSet 전환**은 이 계획 범위 밖 (데이터 레이어 마이그레이션은 별도 계획)
8. **KEDA, Karpenter는 이 계획 범위 밖** — K8s 클러스터 기본 뼈대 + CI/CD + LGTM에 집중
9. **Istio는 기본 설치만** — Gateway + mTLS까지만 설정, Canary/Blue-Green 배포 전략은 별도 계획
10. **K8s 버전**: 설치 시점 기준 최신 안정 버전 확인 (현재 기준 v1.29)

---

> 이 계획서는 다른 세션의 Claude가 읽고 그대로 실행할 수 있도록 작성되었습니다.
> 각 Phase는 독립적이나 순서대로 진행해야 합니다 (Phase 1 → 2 → 3).
> Phase 2의 ArgoCD와 Phase 3의 Alloy는 K8s 클러스터가 반드시 필요하므로 Phase 1 완료 후 진행합니다.
