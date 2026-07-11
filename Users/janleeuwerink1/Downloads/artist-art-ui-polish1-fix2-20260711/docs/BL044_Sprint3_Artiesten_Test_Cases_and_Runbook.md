# BL-044 Sprint 3 — Artiesten testcases en runbook

## Geautomatiseerd
- `npm run test:client:shell`
- `npm run test:client:theme-contract`
- `npm run test:client:embedded-shell`
- `npm run test:unit`

## macOS bash scripts
- `scripts/test-client-shell.sh`
- `scripts/test-client-artiesten.sh`
- `scripts/test-artist-shell-mode.sh`
- `scripts/test-all-unit.sh`
- `scripts/test-all.sh`

## Handmatige validatie
1. Start Artiesten lokaal.
2. Open de app standalone en controleer dat CRUD blijft werken.
3. Open dezelfde app via shellstarter in de nieuwe shell-hosted route.
4. Controleer dat de module in de shell zichtbaar is, zonder losse eigen outer shell.
5. Controleer dat het actieve shell theme correct doorwerkt.
