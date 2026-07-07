# ART-015D-2A-Fix-2 — Candidate timestamps bij scanner inserts

## Aanleiding

Bij `npm run scan:duplicates` faalde de scanner na ART-015D-2A met:

```text
ERROR: null value in column "first_seen_at" of relation "artist_duplicate_candidates" violates not-null constraint
```

De rerun-hardening migratie maakt `first_seen_at` en `last_seen_at` verplicht, maar de scanner vulde deze velden nog niet bij nieuwe duplicate candidates.

## Fix

Nieuwe candidate inserts vullen nu expliciet:

- `first_seen_at = now()`
- `last_seen_at = now()`
- `first_seen_scan_run_id`
- `last_seen_scan_run_id`
- `times_seen = 1`

Er is geen nieuwe SQL-migratie nodig.

## Validatie

Draai lokaal:

```bash
npm run test:art015d2a:fix2
npm run scan:duplicates
```
