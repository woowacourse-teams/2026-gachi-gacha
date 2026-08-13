#!/usr/bin/env bash

set -Eeuo pipefail

readonly SERVICE_NAME="gachigacha-backend.service"
readonly STAGING_DIR="/opt/gachi-gacha/backend/staging"

echo "[prepare] Preparing deployment directory"

# 최초 CodeDeploy 배포에서는 ApplicationStop이 실행되지 않을 수 있으므로
# 여기에서도 서비스를 안전하게 중지한다.
if systemctl is-active --quiet "${SERVICE_NAME}"; then
  echo "[prepare] Stopping ${SERVICE_NAME}"
  systemctl stop "${SERVICE_NAME}"
fi

install \
  -d \
  -o root \
  -g gachigacha \
  -m 750 \
  "${STAGING_DIR}"

rm -f "${STAGING_DIR}/app.jar"

echo "[prepare] Deployment directory is ready"
