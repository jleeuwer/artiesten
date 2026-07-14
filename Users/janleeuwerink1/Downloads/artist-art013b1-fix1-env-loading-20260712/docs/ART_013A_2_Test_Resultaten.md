# ART-013A-2 — Testresultaten oplevering

Datum: 2026-07-11

## Uitgevoerd

### ART-013A regressie- en sprinttests

```text
npm run test:art013a
23 tests, 23 geslaagd, 0 mislukt
```

### ART-013A-2 contracttests

```text
npm run test:art013a2:contract
11 tests, 11 geslaagd, 0 mislukt
```

### Packagingtests

```text
npm run test:packaging
6 tests, 6 geslaagd, 0 mislukt
```

### Volledige bestaande applicatiesuite en build

```text
npm run test:all
Geslaagd, inclusief client build.
```

## Niet uitgevoerd in de opleveromgeving

```text
ARTIST_DB_TEST_ALLOWED=true npm run test:art013a2:db
```

Deze omgeving bevat geen Docker CLI en heeft daarom geen toegang tot de lokale PostgreSQL-container. Het database-testscript is wel aanwezig, heeft een expliciete productieguard, draait transactioneel en controleert na rollback op achtergebleven testrecords.

## Lokale acceptatie

Voer in de projectdirectory uit:

```bash
mkdir -p logs && npm run musician:preflight 2>&1 | tee "logs/art013a2-preflight-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && ARTIST_DB_TEST_ALLOWED=true npm run test:art013a2:db 2>&1 | tee "logs/art013a2-dbtest-$(date +%Y%m%d-%H%M%S).log"
```
