#!/usr/bin/env bash
set -euo pipefail

echo "[artist] running shell-hosted mode tests"
npm run verify:client:deps
npm run test:client:embedded-shell
