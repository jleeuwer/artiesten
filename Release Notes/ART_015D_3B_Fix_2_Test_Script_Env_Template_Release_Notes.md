# ART-015D-3B-Fix-2 — Test script en env-template hardening

## Aanleiding

`tests/art015d3bSchedulerScripts.contract.test.mjs` controleerde `test:art015d3b` te strikt op exact één testbestand. Na ART-015D-3B-Fix-1 bevat `test:art015d3b` terecht meerdere ART-015D-3B tests, waardoor de test onterecht faalde.

Daarnaast moet `.env.example` structureel de duplicate scanner- en alertvariabelen bevatten.

## Aangepast

- De ART-015D-3B scheduler contracttest controleert nu dat `test:art015d3b` de scheduler-test bevat, zonder te verbieden dat extra ART-015D-3B tests worden meegenomen.
- `.env.example` bevat expliciet:
  - `ARTIST_DUPLICATE_ALERT_ENABLED=true`
  - `ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD=25`
  - `ARTIST_DUPLICATE_MIN_SCORE=82`
  - `ARTIST_DUPLICATE_MAX_CANDIDATES=500`

## Migratie

Geen nieuwe SQL-migratie nodig.
