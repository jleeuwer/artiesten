# ART-012D-4-VAL-1 — Testresultaten

Datum: 11-07-2026

## Automatisch uitgevoerd

- `npm run test:art012d4:val1:contract`: **90/90 geslaagd**.
- `npm run test:art012d4`: **98/98 geslaagd** inclusief historische ART-012D-4 regressies.
- `npm run test:art012d3a`: **6/6 geslaagd** inclusief canonical rename execution.
- `npm run test:packaging`: **6/6 geslaagd**.
- `npm run build`: **geslaagd**, productie-output bijgewerkt in `public/app`.
- JavaScript syntaxcontrole model, controller en client API: **geslaagd**.

## Lokaal uit te voeren met Docker/PostgreSQL

```bash
mkdir -p logs && npm run name-proposals:preflight 2>&1 | tee "logs/art012d4-val1-preflight-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run db:migrate:art012d4:val1 2>&1 | tee "logs/art012d4-val1-migration-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && ARTIST_DB_TEST_ALLOWED=true npm run test:art012d4:val1:db 2>&1 | tee "logs/art012d4-val1-dbtest-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run name-proposals:verify 2>&1 | tee "logs/art012d4-val1-verify-$(date +%Y%m%d-%H%M%S).log"
```

De database-integratietest is niet tegen de database van de gebruiker uitgevoerd vanuit de opleveromgeving.
