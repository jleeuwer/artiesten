# Release Notes — ART-012E-4-Fix-6 Nederlandse datumweergave

Datum: 2026-06-08

## Samenvatting

Deze fix wijzigt de schermweergave van geboorte- en sterfdatums naar Nederlands formaat `dd-mm-jjjj`.

## Wijzigingen

- `fmtDate()` in `ArtistPageContent.jsx` formatteert ISO-datums als `dd-mm-jjjj`.
- De artiestentabel toont geboortedatum nu als Nederlandse datum.
- De details/offcanvas toont geboorte- en sterfdatum nu als Nederlandse datum.
- Het edit-formulier blijft `YYYY-MM-DD` gebruiken voor native HTML date inputs.

## Database

Geen databasewijziging.

## Tests

Toegevoegd:

```bash
mkdir -p logs && npm run test:art012e4fix6 2>&1 | tee "logs/test-art012e4fix6-$(date +%Y%m%d-%H%M%S).log"
```

Regressie:

```bash
mkdir -p logs && npm run test:art012e4 2>&1 | tee "logs/test-art012e4-fix6-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run test:art012 2>&1 | tee "logs/test-art012-art012e4-fix6-regression-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run test:packaging 2>&1 | tee "logs/test-packaging-art012e4-fix6-$(date +%Y%m%d-%H%M%S).log"
```
