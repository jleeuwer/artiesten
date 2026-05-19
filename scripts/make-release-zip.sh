#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="artist"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="${ROOT_DIR}/../${APP_NAME}-release-${STAMP}.zip"

cd "${ROOT_DIR}"

zip -qr "${OUT_FILE}" . \
  -x "node_modules/*" \
  -x "client/node_modules/*" \
  -x ".git/*" \
  -x ".env" \
  -x "config/config.js" \
  -x "logs/*" \
  -x "*.log" \
  -x ".DS_Store" \
  -x "*/.DS_Store" \
  -x "__MACOSX/*" \
  -x "*.zip" \
  -x "*.tar.gz" \
  -x "*.tgz"

echo "Created ${OUT_FILE}"
