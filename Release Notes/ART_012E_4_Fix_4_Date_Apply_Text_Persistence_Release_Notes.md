# ART-012E-4-Fix-4 — Date apply text persistence

Datum: 2026-06-08

## Aanleiding

Bij het toepassen van geboorte- of sterfdatum verscheen de melding:

```text
Artist date was not persisted after apply
```

De voorgestelde waarde had het juiste PostgreSQL-formaat `YYYY-MM-DD`, maar de backendcontrole gebruikte nog een JavaScript/driver-conversiepad dat in de praktijk niet betrouwbaar genoeg was voor `date`-velden.

## Oplossing

De apply-flow voor `ar_artist_dateofbirth` en `ar_artist_passing` controleert persistentie nu via PostgreSQL `date::text`:

- actuele waarde wordt gelezen als `ar_artist_dateofbirth::text` / `ar_artist_passing::text`;
- update gebruikt expliciet `$2::date`;
- verificatie leest opnieuw `${sqlField}::text AS persisted_date`;
- vergelijking gebeurt puur op `YYYY-MM-DD`.

## Migratie

Geen nieuwe database-migratie nodig.

## Test

Nieuw script:

```bash
mkdir -p logs && npm run test:art012e4fix4 2>&1 | tee "logs/test-art012e4fix4-$(date +%Y%m%d-%H%M%S).log"
```

`npm run test:art012e4` bevat deze regressietest ook.
