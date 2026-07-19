#!/usr/bin/env bash
set -euo pipefail

# Post-deployment databaseverify voor de UI-only sprint.
# Verifieert bereikbaarheid en bevestigt dat geen nieuwe sprinttabellen of
# kolommen nodig zijn.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/art-ui-detail-scroll-db-preflight-docker.sh"

echo "[ART-UI-DETAIL-SCROLL] Verify geslaagd: bestaande database blijft ongewijzigd."
