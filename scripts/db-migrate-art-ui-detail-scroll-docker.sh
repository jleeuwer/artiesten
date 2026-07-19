#!/usr/bin/env bash
set -euo pipefail

# Intentionele no-op migratie voor ART-UI detail- en scrollhardening.
# De sprint wijzigt uitsluitend frontendgedrag en labels. Het script draait de
# Docker/PostgreSQL-preflight zodat deploymentpipelines een expliciete,
# herhaalbare migratiestap kunnen uitvoeren zonder een schemawijziging te faken.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/art-ui-detail-scroll-db-preflight-docker.sh"

echo "[ART-UI-DETAIL-SCROLL] Migratie afgerond: NO-OP (geen databaseobjecten gewijzigd)."
