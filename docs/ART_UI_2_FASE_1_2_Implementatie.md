# ART-UI-2 Fase 1/2 — Implementatie

Datum: 14 juli 2026

## Gerealiseerde codewijzigingen

- Het hoofd-detailpaneel `.artist-relation-panel` gebruikt geen vaste maximale hoogte en geen verticale `overflow` meer.
- Relatietabellen gebruiken uitsluitend horizontale overflow wanneer de tabel breder is dan de viewport.
- Discogs-resultaten groeien verticaal mee met de pagina en houden alleen horizontale tabeloverflow.
- De Discogs-imagegrid heeft geen eigen maximale hoogte of interne verticale scrollbar meer.
- De bestaande Edit-modal behoudt een eigen scrollbare modal-body.
- De detail-Offcanvas blijft door React-Bootstrap als zelfstandige overlay scrollbaar.
- Development-only scrollmarkering blijft beschikbaar via `VITE_ARTIST_UI_SCROLL_DEBUG=true`.
- Nieuw script `scripts/audit-art-ui2-scroll.mjs` bewaakt automatisch dat verticale detailscrollers niet terugkeren.

## Geen databasewijziging

ART-UI-2 wijzigt uitsluitend frontendstructuur en CSS. Er zijn geen PostgreSQL-tabellen, kolommen, constraints, API-routes of payloads gewijzigd. Daarom is geen Docker/PostgreSQL-migratiescript aanwezig of nodig.

## Uitvoerbare commando's

```bash
mkdir -p logs &&
npm run ui:scroll:audit 2>&1 |
tee "logs/art-ui2-scroll-audit-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs &&
npm run test:art-ui-2:phase12 2>&1 |
tee "logs/art-ui2-phase12-tests-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs &&
npm run build 2>&1 |
tee "logs/art-ui2-build-$(date +%Y%m%d-%H%M%S).log"
```
