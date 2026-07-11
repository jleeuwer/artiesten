# Release Notes — ART-015D-3C Stale reviewqueue signalering

## Toegevoegd

- Stale reviewqueue-configuratie in `.env.example`.
- Scanner-alerts worden verrijkt met open/stale reviewqueue-statistieken.
- Reviewqueue API retourneert stale velden per candidate.
- Reviewqueue UI toont badge **Te lang open** en een waarschuwing bij stale candidates.
- Nieuwe test `tests/art015d3cStaleReviewqueue.contract.test.mjs`.

## Migratie

Geen nieuwe SQL-migratie nodig.

## Validatie

Draai:

```bash
npm run test:art015d3c
npm run test:art015d
npm run test:packaging
```
