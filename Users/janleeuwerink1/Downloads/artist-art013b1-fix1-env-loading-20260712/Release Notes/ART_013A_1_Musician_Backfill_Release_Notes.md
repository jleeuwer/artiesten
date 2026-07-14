# Release Notes — ART-013A-1 Musician backfill

Datum: 2026-06-09

## Samenvatting

ART-013A-1 voegt een idempotent onderhoudsscript toe om de `musician`-tabel te vullen vanuit bestaande `person` artists. Dit maakt de eerder gebouwde ART-013A one-way `artist → musician` sync praktisch bruikbaar wanneer de `musician`-tabel nog leeg is.

## Toegevoegd

- Migratie:
  - `scripts/sql/20260609_art013a1_musician_backfill_from_person_artists.sql`
  - `scripts/db-migrate-art013a1-docker.sh`
- Backfill-script:
  - `scripts/backfill-musicians-from-person-artists.sh`
- Package scripts:
  - `npm run db:migrate:art013a1`
  - `npm run musician:backfill:preview`
  - `npm run musician:backfill`
  - `npm run test:art013a1`
- Tests:
  - `tests/art013a1MusicianBackfill.contract.test.mjs`
- Documentatie:
  - `docs/ART_013A_1_Musician_Backfill.md`
  - `docs/ART_013A_1_Testcases_en_Runbook.md`

## Databasewijzigingen

- `musician.mu_musician_dateofbirth` wordt nullable gemaakt.
- Partial unique index op `musician(ar_artist_key)` waar `ar_artist_key is not null`.

## Gedrag

- Preview toont kandidaten.
- Execute voegt alleen ontbrekende musicians toe.
- Script is idempotent en kan periodiek opnieuw worden uitgevoerd.
- Alleen `artist.ar_artist_type = 'person'` wordt meegenomen.
- Bestaande musicians worden niet overschreven.
- Er worden geen musicians verwijderd.

## Niet gewijzigd

- ART-013A blijft one-way `artist → musician`.
- Geen bidirectionele sync.
- Geen automatische aanmaak via trigger.
- Geen delete- of merge-sync.
- Geen UI-wijzigingen.
