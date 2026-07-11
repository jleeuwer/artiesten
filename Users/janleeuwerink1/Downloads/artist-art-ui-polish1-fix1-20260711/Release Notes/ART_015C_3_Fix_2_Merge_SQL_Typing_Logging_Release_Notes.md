# ART-015C-3-Fix-2 — Merge SQL typing en logging

## Aanleiding

Bij het uitvoeren van een artist merge kon PostgreSQL de fout geven:

```text
could not determine data type of parameter $1
```

De transactie werd correct teruggedraaid, maar de foutdiagnose was onvoldoende.

## Wijzigingen

- Expliciete PostgreSQL parametercasts toegevoegd in merge execution SQL.
- Structured merge logging toegevoegd:
  - `artist_merge.start`
  - `artist_merge.commit`
  - `artist_merge.rollback`
  - en tussenliggende merge-stappen.
- Logger respecteert nu `LOG_LEVEL` uit `.env`.
- API retourneert bij merge rollback:
  - veilige melding;
  - `mergeStep`;
  - `transaction: rolled_back`.
- Frontend toont de stapnaam in de foutmelding.
- Nieuwe contracttest: `tests/art015c3Fix2MergeLogging.contract.test.mjs`.

## Validatie

```bash
npm run test:art015c3:fix2
npm run test:art015c
npm run test:packaging
npm run test:unit
npm run test:sprint4
```
