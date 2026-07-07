# ART-UI-Date-1 — Datepicker teruggebracht bij Nederlandse datum-invoer

Datum: 2026-06-09

## Aanleiding

Na ART-012E-4-Fix-7 waren de datumvelden in het artist edit-scherm handmatig bruikbaar als `dd-mm-jjjj`, maar de datepicker-ondersteuning was in de praktijk niet betrouwbaar zichtbaar/bruikbaar.

## Oplossing

De zichtbare invoer blijft Nederlands:

```text
dd-mm-jjjj
```

Bijvoorbeeld:

```text
12-03-1947
```

Daarnaast is de native datepicker opnieuw klikbaar gemaakt via het kalendericoon. Technisch gebeurt dit met een transparant native `input type="date"` over het kalenderknopgebied, zodat ook browsers zonder `showPicker()` ondersteuning de datepicker kunnen openen.

## Belangrijk

- Database/API blijven `YYYY-MM-DD` gebruiken.
- Tabel/details blijven `dd-mm-jjjj` tonen.
- Handmatig typen blijft mogelijk.
- Geen database-migratie nodig.

## Tests

Gerichte test:

```bash
mkdir -p logs && npm run test:art012e4fix7 2>&1 | tee "logs/test-art012e4fix7-artuidate1-$(date +%Y%m%d-%H%M%S).log"
```

Regressie:

```bash
mkdir -p logs && npm run test:art012e4 2>&1 | tee "logs/test-art012e4-artuidate1-$(date +%Y%m%d-%H%M%S).log"
```
