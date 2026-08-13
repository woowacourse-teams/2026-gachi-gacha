#!/usr/bin/env bash

set -Eeuo pipefail

readonly SERVICE_NAME="gachigacha-backend.service"

echo "[stop] Checking ${SERVICE_NAME}"

if systemctl is-active --quiet "${SERVICE_NAME}"; then
  echo "[stop] Stopping ${SERVICE_NAME}"
  systemctl stop "${SERVICE_NAME}"
else
  echo "[stop] Service is already inactive"
fi
