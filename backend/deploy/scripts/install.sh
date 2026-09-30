#!/usr/bin/env bash

set -Eeuo pipefail

: "${DEPLOYMENT_ID:?DEPLOYMENT_ID is required}"

readonly BASE_DIR="/opt/gachi-gacha/backend"
readonly STAGING_JAR="${BASE_DIR}/staging/app.jar"
readonly RELEASE_DIR="${BASE_DIR}/releases/${DEPLOYMENT_ID}"
readonly CURRENT_LINK="${BASE_DIR}/current"
readonly KEEP_RELEASES="${KEEP_RELEASES:-3}"

prune_old_releases() {
  local current_target
  current_target="$(readlink -f "${CURRENT_LINK}")"

  find "${BASE_DIR}/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@\t%p\n' \
    | sort -rn \
    | tail -n +$((KEEP_RELEASES + 1)) \
    | cut -f2 \
    | while read -r old_release; do
        if [[ "$(readlink -f "${old_release}")" == "${current_target}" ]]; then
          continue
        fi
        echo "[install] Removing old release: ${old_release}"
        rm -rf "${old_release}"
      done
}

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

prune_old_releases || echo "[install] Release cleanup skipped"

rm -f "${STAGING_JAR}"

echo "[install] Current release: ${RELEASE_DIR}"
