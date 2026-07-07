# Release notes — ART-012C Discogs artist koppelen

## Inhoud

Deze release voegt de eerste accept-/koppelfunctie toe voor Discogs artist enrichment.

## Toegevoegd

- `POST /api/artists/:id/discogs/link`
- Backendfunctie `linkDiscogsArtist`
- Frontendknop **Koppel Discogs artist** in de Discogs detailkaart
- Weergave van gekoppelde Discogs-referenties in het relatiepaneel
- Opslag in:
  - `artist_external_reference`
  - `artist_enrichment_cache`
  - `artist_external_image`
- Test `tests/art012cDiscogsLink.contract.test.mjs`

## Belangrijk

- Lokale `artist.ar_artist_key` blijft leidend.
- Discogs ID vervangt nooit de lokale artist key.
- Artistnaam wordt niet automatisch overschreven.
- Images worden alleen als metadata/URL opgeslagen, niet als binaire data in PostgreSQL.

## Migratie

Geen nieuwe migratie bovenop ART-012B. Zorg dat ART-012B is toegepast:

```bash
npm run db:migrate:art012b
```
