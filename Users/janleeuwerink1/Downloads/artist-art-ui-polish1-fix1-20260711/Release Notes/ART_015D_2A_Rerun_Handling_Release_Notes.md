# ART-015D-2A — Scanner rerun handling + datamodel-hardening

## Doel

Voorkomen dat periodieke duplicate scans dubbele open review-candidates aanmaken wanneer eerdere scanresultaten nog open of deels verwerkt zijn.

## Toegevoegd

- Migratie `scripts/sql/20260526_art015d2a_duplicate_scanner_rerun_hardening.sql`.
- Docker-proof script `scripts/db-migrate-art015d2a-docker.sh`.
- Package scripts:
  - `npm run db:migrate:art015d2a`
  - `npm run test:art015d2a`
- Candidatevelden:
  - `artist_key_low`
  - `artist_key_high`
  - `first_seen_at`
  - `last_seen_at`
  - `first_seen_scan_run_id`
  - `last_seen_scan_run_id`
  - `times_seen`
- Scan-run statistieken:
  - `candidates_found`
  - `candidates_inserted`
  - `candidates_updated_existing`
  - `candidates_skipped_reviewed`

## Gewijzigd

De scanner werkt bestaande open candidates bij in plaats van nieuwe duplicaten te maken. Reviewed/ignored/merged paren worden overgeslagen.

## Validatie

```bash
python3 -m py_compile scripts/artist_duplicate_scanner.py
npm run test:art015d2a
npm run test:art015d
npm run test:packaging
npm run test:unit
npm run test:sprint4
```
