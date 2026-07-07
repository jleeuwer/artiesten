# Release Notes — ART-012D Discogs naamvoorstellen en artiestenspelling ontwerp

Datum: 2026-06-07

## Type release

Documentatie-/ontwerpsprint. Geen code-implementatie en geen SQL-migratie.

## Toegevoegd

- Functioneel/technisch ontwerp voor Discogs naamvoorstellen en `artiesten_spelling`.
- Testcases en runbook voor toekomstige implementatie.
- Contracttest voor ART-012D documentatie.
- Backlog en project notes bijgewerkt.

## Belangrijkste besluit

Discogs artist names zijn bronvoorstellen. Ze worden nooit rechtstreeks gebruikt om `artist.ar_artist_name` te overschrijven. Canonical name-wijzigingen moeten via een spelling-aware flow lopen die `artist` en `artiesten_spelling` consistent bijwerkt.

## Geen migratie

Deze sprint bevat geen database-migratie.
