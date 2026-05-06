#!/usr/bin/env bash
# 헤이보카 홍보 사이트 배포 — 서버에서 git pull → 컨테이너 재빌드
# 사용: ./deploy.sh
set -euo pipefail

SSH_KEY="$HOME/.ssh/ghmate_server"
SSH_HOST="ghmate@ghmate.iptime.org"
SSH_PORT=222
SERVER_PATH="/srv/projects/heyvoca_landing"

echo "==> 헤이보카 랜딩 배포 시작"

ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_HOST" bash -c "'
  set -e
  cd $SERVER_PATH
  echo \"--- git pull ---\"
  git pull
  echo \"--- docker compose up --build -d ---\"
  docker compose -p heyvoca_landing -f docker-compose.yml up --build -d landing
  echo \"--- nginx_proxy reload ---\"
  docker exec nginx_proxy nginx -t && docker exec nginx_proxy nginx -s reload
  echo \"--- 컨테이너 상태 ---\"
  docker ps --filter name=heyvoca_landing
'"

echo "==> 배포 완료: https://heyvoca.ghmate.com"
