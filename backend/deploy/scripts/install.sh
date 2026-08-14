#!/usr/bin/env bash

set -Eeuo pipefail

: "${DEPLOYMENT_ID:?DEPLOYMENT_ID is required}"

readonly BASE_DIR="/opt/gachi-gacha/backend"
readonly STAGING_JAR="${BASE_DIR}/staging/app.jar"
readonly RELEASE_DIR="${BASE_DIR}/releases/${DEPLOYMENT_ID}"
readonly CURRENT_LINK="${BASE_DIR}/current"

echo "[install] Installing deployment ${DEPLOYMENT_ID}"

if [[ ! -f "${STAGING_JAR}" ]]; then
  echo "[install] JAR file not found: ${STAGING_JAR}" >&2
  exit 1
fi

install \
  -d \
  -o root \
  -g gachigacha \
  -m 750 \
  "${RELEASE_DIR}"

install \
  -o root \
  -g gachigacha \
  -m 640 \
  "${STAGING_JAR}" \
  "${RELEASE_DIR}/app.jar"

ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"

rm -f "${STAGING_JAR}"

echo "[install] Current release: ${RELEASE_DIR}"
