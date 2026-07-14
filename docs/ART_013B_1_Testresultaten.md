# ART-013B-1 testresultaten

Datum: 2026-07-12

## Uitgevoerd

- `npm run test:art013b1`: 94/94 geslaagd.
- `npm run test:packaging`: 6/6 geslaagd.
- `npm run build`: geslaagd; Vite productiebuild bijgewerkt in `public/app`.

## Lokaal uit te voeren

De transactionele PostgreSQL-integratietest vereist de lokale Docker-database:

```bash
mkdir -p logs && ARTIST_DB_TEST_ALLOWED=true npm run test:art013b1:db 2>&1 | tee "logs/art013b1-dbtest-$(date +%Y%m%d-%H%M%S).log"
```

De test maakt tijdelijke artist-, musician- en musician_in_band-records aan, controleert create/update/delete, voert `ROLLBACK` uit en verwacht `leftovers=0`.
