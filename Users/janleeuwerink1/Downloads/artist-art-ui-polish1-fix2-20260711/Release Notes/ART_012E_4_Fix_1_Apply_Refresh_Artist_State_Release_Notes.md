# ART-012E-4-Fix-1 — Apply refresh artist-state

Datum: 2026-06-08

## Aanleiding

Na het toepassen van een Discogs verrijkingsvoorstel was niet direct zichtbaar dat de lokale artist-data was aangepast. `Negeer` werkte wel, maar apply gaf onvoldoende directe UI-feedback.

## Oplossing

- De frontend gebruikt nu de actuele `artist` uit de apply-response om direct de lokale clientstate te patchen.
- De artiestentabel, geselecteerde artiest, relatie-inzicht, active/edit context en detailcontext worden bijgewerkt waar van toepassing.
- Daarna worden relaties en lijst nogmaals stil ververst.
- Bij profieltekst wordt expliciet gemeld dat de data in `artist_external_profile` wordt opgeslagen en de lokale `artist`-tabel niet wijzigt.

## Test

Gebruik:

```bash
mkdir -p logs && npm run test:art012e4 2>&1 | tee "logs/test-art012e4-fix1-$(date +%Y%m%d-%H%M%S).log"
```
