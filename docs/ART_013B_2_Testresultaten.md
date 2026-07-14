# ART-013B-2 — Testresultaten

Datum: 2026-07-12

- ART-013B-2 contract-, UX- en traceabilitytests: **121/121 geslaagd**.
- ART-013A-3 regressies: **110/110 geslaagd**.
- ART-013B-1 regressies: **96/96 geslaagd**.
- Packagingtests: **6/6 geslaagd**.
- React/Vite-productiebuild: **geslaagd**.

De Docker/PostgreSQL-integratietest is aanwezig en transactioneel, maar is niet tegen de gebruikersdatabase uitgevoerd vanuit de opleveromgeving. Lokaal uitvoeren met `ARTIST_DB_TEST_ALLOWED=true npm run test:art013b2:db`.
