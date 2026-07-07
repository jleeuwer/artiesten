# ART-012E-4-Fix-6 — Nederlandse datumweergave

Datum: 2026-06-08

## Doel

Geboorte- en sterfdatum worden in de Artiesten-app op schermen getoond in Nederlands formaat `dd-mm-jjjj`, terwijl de database en API intern blijven werken met `YYYY-MM-DD`.

## Scope

In scope:

- `ArtistPageContent.jsx` toont ISO-datums via `fmtDate()` als `dd-mm-jjjj`.
- De artiestentabel gebruikt dezelfde display formatter voor geboortedatum.
- De details/offcanvas gebruikt dezelfde display formatter voor geboorte- en sterfdatum.
- Het edit-formulier blijft `YYYY-MM-DD` gebruiken, omdat native HTML `input type="date"` dit formaat vereist.

Niet in scope:

- Databasewijziging.
- API contractwijziging.
- Conversie van inputvelden naar Nederlands formaat.

## Technisch ontwerp

De frontend helper `fmtDate(v)` herkent waarden die beginnen met `YYYY-MM-DD` en toont ze als `DD-MM-YYYY`.

Voorbeeld:

```text
2016-01-10 -> 10-01-2016
```

Als een waarde niet als ISO-datum herkenbaar is, valt de helper terug op de oude korte stringweergave.

## Test

Nieuw contract:

```bash
mkdir -p logs && npm run test:art012e4fix6 2>&1 | tee "logs/test-art012e4fix6-$(date +%Y%m%d-%H%M%S).log"
```

Regressie:

```bash
mkdir -p logs && npm run test:art012e4 2>&1 | tee "logs/test-art012e4-fix6-$(date +%Y%m%d-%H%M%S).log"
```
