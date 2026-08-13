#!/usr/bin/env bash

set -Eeuo pipefail

readonly SERVICE_NAME="gachigacha-backend.service"
readonly HEALTH_URL="http://localhost:8080/api/v1/stores"
readonly MAX_ATTEMPTS=25
readonly WAIT_SECONDS=4

echo "[validate] Checking ${HEALTH_URL}"

for ((attempt = 1; attempt <= MAX_ATTEMPTS; attempt++)); do
  if curl \
    --fail \
    --silent \
    --output /dev/null \
    --max-time 3 \
    "${HEALTH_URL}"; then
    echo "[validate] Health check succeeded"
    exit 0
  fi

  echo "[validate] Attempt ${attempt}/${MAX_ATTEMPTS} failed"
  sleep "${WAIT_SECONDS}"
done

echo "[validate] Health check failed" >&2
journalctl -u "${SERVICE_NAME}" -n 100 --no-pager >&2
exit 1
