# BL-044 Sprint 4 addendum — Trash hard delete en embedded bottom spacing

## Aanleiding
Na aanvullende validatie bleven twee punten open:

1. een resterende witte strook onder de embedded tabel/paginering
2. `Delete forever` in Trash werkte niet correct en gedroeg zich als restore/soft delete

## Root cause

### 1. Bottom spacing
- embedded page surface hield nog een kleine bottom padding
- de child app stuurde nog een relatief royale height buffer terug naar de shell host

### 2. Hard delete
- in `routes/artistRoutes.js` stond de generieke route `DELETE /:id` boven de specifiekere route `DELETE /:id/hard`
- daardoor werd `/api/artists/:id/hard` door Express gematcht als `/:id` en dus als soft delete afgehandeld

## Doorgevoerde fix
- `DELETE /:id/hard` boven `DELETE /:id` geplaatst
- embedded bottom spacing verder teruggebracht
- embedded height buffer verlaagd
- regressietest toegevoegd voor route ordering

## Verwacht resultaat
- `Delete forever` roept nu de juiste hard delete flow aan
- resterende onderste whitespace in embedded mode is verder geminimaliseerd
