# ART-UI-POLISH-1 — Implementation release notes

Datum: 2026-07-11

## Opgeleverd

- Compacte profielkolom links in de artiestenlijst.
- 32×32 primaire Discogs-thumbnail met lazy loading en vaste dimensies.
- Veilige fallback-avatar bij ontbrekende of defecte externe image.
- Overleden-indicator `bi-hourglass-bottom` bij gevulde `ar_artist_passing`.
- Tooltip en aria-label `Artiest overleden`.
- Directe lokale refresh na selectie van een andere primaire image.
- Geen nieuwe databasemigratie: bestaande list query levert de primary image via `LEFT JOIN LATERAL ... LIMIT 1`.
- Nieuwe automatische contracttests en traceability voor alle 48 functionele testcases.

## Testcommando

```bash
mkdir -p logs && npm run test:art-ui-polish1 2>&1 | tee "logs/art-ui-polish1-$(date +%Y%m%d-%H%M%S).log"
```
