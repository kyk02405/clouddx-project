#!/bin/bash
# ============================================
# TUTUM EC2 초기 설정 스크립트
# Ubuntu 22.04 기준
# ============================================
set -euo pipefail

echo "[1/5] 시스템 업데이트"
sudo apt-get update -y && sudo apt-get upgrade -y

echo "[2/5] Docker 설치"
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER

echo "[3/5] Certbot 설치 (SSL)"
sudo apt-get install -y certbot

echo "[4/5] 프로젝트 클론"
git clone https://github.com/kyk02405/clouddx-project.git ~/tutum
cd ~/tutum/deploy

echo "[5/5] 환경변수 설정"
cp .env.example .env
echo ""
echo "==================================="
echo "설정 완료!"
echo "다음 단계:"
echo "  1. nano ~/tutum/deploy/.env  (환경변수 입력)"
echo "  2. ./ssl.sh                  (SSL 인증서 발급)"
echo "  3. docker compose up -d      (서비스 시작)"
echo "==================================="
