#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/art013b1-db.sh
source "${SCRIPT_DIR}/lib/art013b1-db.sh"
art013b1_load_env
art013b1_require_docker
art013b1_psql "$@"
