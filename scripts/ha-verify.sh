#!/usr/bin/env bash
set -euo pipefail

declare -A TARGETS=(
  ["192.168.0.28"]="2220 2230"
  ["192.168.0.13"]="2221"
  ["192.168.0.98"]="2222"
  ["192.168.0.3"]="2223 2224"
  ["192.168.0.14"]="2225 2226"
)

echo "=== [1] NAT/SSH Connectivity Check ==="
for host in "${!TARGETS[@]}"; do
  for port in ${TARGETS[$host]}; do
    if timeout 2 bash -lc "cat < /dev/null >/dev/tcp/$host/$port" >/dev/null 2>&1; then
      echo "OPEN  ${host}:${port}"
    else
      echo "CLOSED ${host}:${port}"
    fi
  done
done

if [ "${1:-}" != "--skip-internal" ]; then
  echo
  echo "=== [2] Host-Only Internal Ping Check ==="
  for ip in 192.168.56.{20..31}; do
    if ping -c 1 -W 1 "$ip" >/dev/null 2>&1; then
      echo "OK ${ip}"
    else
      echo "FAIL ${ip}"
    fi
  done

  echo
  echo "=== [3] Kubernetes Health Check ==="
  kubectl get nodes -o wide
  kubectl get ns tutum-app tutum-data tutum-storage monitoring istio-system argocd kyverno
  kubectl get pods -n metallb-system --no-headers
  kubectl get pods -n istio-system --no-headers
  kubectl get svc -n istio-system istio-ingressgateway
fi
