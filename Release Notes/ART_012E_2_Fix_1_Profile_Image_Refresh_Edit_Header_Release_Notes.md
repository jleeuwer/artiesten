# ART-012E-2-Fix-1 — Profielfoto refresh en edit-header

Datum: 2026-06-08

## Aanleiding

Bij het kiezen van een andere Discogs-profielfoto werd de profielfoto in het paneel **Relatie-inzicht** pas zichtbaar na handmatige refresh. Daarnaast was in het edit-scherm nog geen profielheader met profielfoto zichtbaar, terwijl de gebruiker daar dezelfde context als in **Relatie-inzicht** verwachtte.

## Oplossing

- Na **Maak profielfoto** wordt de lokale UI-state direct bijgewerkt.
- Daarna wordt `loadRelations(..., { scrollToPanel: false })` aangeroepen zodat **Relatie-inzicht** direct de actuele primaire Discogs-afbeelding toont.
- Het edit-scherm toont nu bovenin een compacte **Artiestprofiel** header met:
  - primaire Discogs-profielfoto of fallback-icon;
  - artiestnaam;
  - Discogs gekoppeld-status;
  - artist type;
  - relatie-aantallen wanneer geladen.

## Test

Uitgevoerd:

```bash
mkdir -p logs && npm run test:art012e2 2>&1 | tee "logs/test-art012e2-fix1-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:art012 2>&1 | tee "logs/test-art012-art012e2-fix1-regression-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs && npm run test:packaging 2>&1 | tee "logs/test-packaging-art012e2-fix1-$(date +%Y%m%d-%H%M%S).log"
```
