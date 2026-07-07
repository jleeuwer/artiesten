# Release notes — ART-012D-3 Canonical rename spelling-aware design

Datum: 2026-06-07

## Type

Functioneel/technisch ontwerp, nog geen code-implementatie.

## Toegevoegd

- Ontwerp voor spelling-aware canonical rename op basis van Discogs naamvoorstellen.
- Testcases/runbook voor toekomstige implementatie.
- Contracttest voor documentatieborging.

## Belangrijkste besluit

Discogs-koppelen blijft gescheiden van canonical rename. Een Discogs artist name mag nooit automatisch `artist.ar_artist_name` overschrijven. Canonical rename moet via `artiesten_spelling`, conflictcontrole, transactie en audit lopen.

## Geen migratie

Deze sprint bevat geen SQL-migratie en geen muterende canonical-rename code.
