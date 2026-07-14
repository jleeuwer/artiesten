# ART-015D-3B-Fix-1 — Env example refresh voor scanner alerts

## Aanleiding
Bij testen kan `.env.example` in een bestaande projectdirectory nog een oudere inhoud bevatten, zonder de duplicate-scanner alertvariabelen van ART-015D-3A.
Daardoor faalt `tests/art015d3aScannerAlertHardening.contract.test.mjs` op `ARTIST_DUPLICATE_ALERT_ENABLED=true`.

## Oplossing
- `.env.example` bevat opnieuw alle runtime-, Docker-, scanner- en alertvariabelen.
- Nieuw script `scripts/env-refresh-example.sh` kan de canonical `.env.example` opnieuw genereren.
- Nieuw npm-script: `npm run env:refresh-example`.
- Extra contracttest borgt dat `.env.example` en het refresh-script de alertvariabelen bevatten.

## Lokale herstelstap
Als je over een bestaande directory hebt uitgepakt en de test faalt, draai:

```bash
npm run env:refresh-example
npm run test:art015d3a
```
