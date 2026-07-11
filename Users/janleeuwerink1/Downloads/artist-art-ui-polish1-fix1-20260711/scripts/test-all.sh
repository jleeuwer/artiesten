#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run verify:client:deps

echo "[artist] running full validation"
npm run test:all
