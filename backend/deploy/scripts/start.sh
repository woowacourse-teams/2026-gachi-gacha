#!/usr/bin/env bash

set -Eeuo pipefail

readonly SERVICE_NAME="gachigacha-backend.service"

echo "[start] Starting ${SERVICE_NAME}"

systemctl reset-failed "${SERVICE_NAME}" || true
systemctl start "${SERVICE_NAME}"

if ! systemctl is-active --quiet "${SERVICE_NAME}"; then
  echo "[start] Failed to start ${SERVICE_NAME}" >&2
  journalctl -u "${SERVICE_NAME}" -n 50 --no-pager >&2
  exit 1
fi

echo "[start] ${SERVICE_NAME} is active"
