#!/bin/bash
# SSL 인증서 발급 (Let's Encrypt)
# 실행 전: 가비아 DNS A레코드가 이 EC2 IP를 가리키고 있어야 함

DOMAIN="kyungyoon.cloud"

sudo mkdir -p /var/www/certbot

# 임시 nginx로 인증 (포트 80 필요)
sudo certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email admin@kyungyoon.cloud \
  -d ${DOMAIN} \
  -d www.${DOMAIN}

echo "SSL 인증서 발급 완료: /etc/letsencrypt/live/${DOMAIN}/"
echo "이제 docker compose up -d 실행하세요"
