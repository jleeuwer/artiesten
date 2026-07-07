# Release Notes — ART-012A Discogs artist enrichment ontwerp

Datum: 2026-06-06

## Inhoud

Deze release werkt ART-012 functioneel en technisch uit als ontwerp-/documentatiesprint.

Toegevoegd:

- `docs/ART_012_Discogs_Artist_Enrichment_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_012_Testcases_en_Runbook.md`
- `tests/art012Documentation.contract.test.mjs`

Bijgewerkt:

- `Readme.md`
- `docs/BACKLOG.md`
- `docs/PROJECT_NOTES.md`
- `package.json`

## Belangrijkste ontwerpbesluiten

- `artist.ar_artist_key` blijft de primaire lokale sleutel.
- Discogs artist ID wordt niet gebruikt als vervanging voor lokale keys.
- Discogs artist ID wordt alleen gebruikt als externe lookup key en metadatareferentie.
- Voorkeursdatamodel is een aparte externe referentie/cache:
  - `artist_external_reference`
  - `artist_enrichment_cache`
- Lokale artistvelden worden niet automatisch overschreven.
- Discogs-data kan later reviewbare verrijkingsvoorstellen opleveren.
- ART-012 blijft Discogs-specifiek; Wikipedia/Wikidata/MusicBrainz komen onder ART-017.

## Migratie

Geen nieuwe SQL-migratie in deze ontwerpsprint.

## Test

```bash
npm run test:art012
```
