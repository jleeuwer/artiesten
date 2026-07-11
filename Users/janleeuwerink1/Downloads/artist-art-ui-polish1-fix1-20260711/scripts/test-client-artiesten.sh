#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run verify:client:deps

echo "[artist] running theme contract tests"
npm run test:client:theme-contract

npm run test:client:embedded-shell
