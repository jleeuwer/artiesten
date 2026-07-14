# ART-013A-3 — Testresultaten

Datum: 2026-07-12

## Uitgevoerd

- ART-013A-3 contract- en traceabilitytests: **107/107 geslaagd**.
- Bestaande ART-013A regressies: **23/23 geslaagd**.
- Bestaande ART-013B-1 regressies: **96/96 geslaagd**.
- Packagingtests: **6/6 geslaagd**.
- Volledige `npm run test:unit`: **geslaagd**.
- Vite/React productiebuild: **geslaagd**; output bijgewerkt in `public/app`.

## Lokaal uit te voeren

De PostgreSQL-integratietest kon in de releaseomgeving niet tegen de lokale projectdatabase worden uitgevoerd. Het meegeleverde script gebruikt de Docker-container uit de centrale `.env`, draait transactioneel en controleert na rollback `leftovers=0`.

```bash
mkdir -p logs && ARTIST_DB_TEST_ALLOWED=true npm run test:art013a3:db 2>&1 | tee "logs/art013a3-dbtest-$(date +%Y%m%d-%H%M%S).log"
```
