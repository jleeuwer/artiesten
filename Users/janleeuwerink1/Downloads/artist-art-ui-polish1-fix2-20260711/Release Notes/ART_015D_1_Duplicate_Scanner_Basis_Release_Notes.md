# ART-015D-1 — Duplicate scanner basis release notes

## Inhoud

Deze release implementeert de basis voor de periodieke duplicate scanner onderhoudsvariant.

Toegevoegd:

- SQL stagingtabellen:
  - `artist_duplicate_scan_runs`
  - `artist_duplicate_candidates`
- Docker-proof migratiescript:
  - `npm run db:migrate:art015d1`
- Python scanner zonder externe Python database dependency:
  - `scripts/artist_duplicate_scanner.py`
- Scanner wrapper:
  - `npm run scan:duplicates`
- Dry-run optie:
  - `npm run scan:duplicates -- --dry-run --verbose`
- JSONL logging naar `logs/`.
- Shellstarter-alert na succesvolle scan, tenzij `--no-alert` wordt gebruikt.
- Contracttests voor ART-015D-1.

## Belangrijk

De scanner voert nooit automatisch een merge uit. Hij zet alleen candidates klaar voor review. De daadwerkelijke merge blijft via de bestaande ART-015B/ART-015C impactscan en transactionele mergeflow lopen.

## Migratie

```bash
npm run db:migrate:art015d1
```

## Test

```bash
npm run test:art015d1
npm run test:art015d
```
