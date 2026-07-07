# ART-012E-4-Fix-2 — Date apply persistence

Datum: 2026-06-08

## Aanleiding
Bij het toepassen van Discogs verrijkingsvoorstellen voor geboorte-/sterfdatum werd de lokale `artist`-tabel niet zichtbaar/betrouwbaar bijgewerkt. De voorstelwaarde had het juiste PostgreSQL `date`-formaat (`YYYY-MM-DD`), maar de backendvergelijking na de `UPDATE ... RETURNING` vergeleek een JavaScript `Date` object als tekst, waardoor de validatie kon falen en de transactie werd teruggedraaid.

## Oplossing
`formatLocalDateValue` herkent nu expliciet JavaScript `Date` objecten en normaliseert die naar `YYYY-MM-DD` via `toISOString().slice(0, 10)` voordat de applied-value check wordt uitgevoerd.

## Impact
- Toepassen van exacte datums zoals `2016-01-10` werkt nu correct op `artist.ar_artist_dateofbirth` en `artist.ar_artist_passing`.
- Bestaande bescherming tegen onvolledige datums blijft behouden.
- Geen database-migratie nodig.
