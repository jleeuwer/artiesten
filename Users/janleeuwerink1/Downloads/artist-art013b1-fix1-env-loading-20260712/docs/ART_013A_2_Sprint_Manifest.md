# ART-013A-2 — Sprintmanifest

## Status

Geïmplementeerd op 2026-07-11; gereed voor functionele database-acceptatie in de lokale Docker/PostgreSQL-omgeving.

## Nieuwe code

- `scripts/lib/art013a2-db.sh`
- `scripts/musician-preflight.sh`
- `scripts/musician-verify.sh`
- `scripts/db-test-art013a2-docker.sh`
- `scripts/sql/20260711_art013a2_preflight.sql`
- `scripts/sql/20260711_art013a2_data_preflight.sql`
- `scripts/sql/20260711_art013a2_backfill_preview.sql`
- `scripts/sql/20260711_art013a2_backfill_execute.sql`
- `scripts/sql/20260711_art013a2_verify.sql`
- `scripts/sql/20260711_art013a2_integration_test.sql`

## Gewijzigde code

- `scripts/sql/20260609_art013a1_musician_backfill_from_person_artists.sql`
- `scripts/db-migrate-art013a1-docker.sh`
- `scripts/backfill-musicians-from-person-artists.sh`
- `package.json`
- `package-lock.json`
- `.env.example`

## Automatische tests

- `tests/art013a2DatabaseHardening.contract.test.mjs`
- `tests/art013a2FunctionalCases.contract.test.mjs`
- transactionele PostgreSQL-test via `npm run test:art013a2:db`

## Documentatie

- functioneel/technisch ontwerp bijgewerkt naar geïmplementeerde status;
- 65 functionele testcases behouden en aan automatiseringslagen gekoppeld;
- runbook, backlog, projectnotities, README en release notes bijgewerkt.

## Acceptatie die lokaal nog moet plaatsvinden

Omdat deze opleveromgeving geen Docker CLI bevat, moet de database-integratietest lokaal worden uitgevoerd met:

```bash
ARTIST_DB_TEST_ALLOWED=true npm run test:art013a2:db
```
