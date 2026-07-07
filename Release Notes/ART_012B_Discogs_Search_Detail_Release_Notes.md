# Release Notes — ART-012B Discogs artist search/detail basisimplementatie

## Inhoud

- Discogs configstatus endpoint toegevoegd.
- Discogs artist search endpoint toegevoegd.
- Discogs artist detail endpoint toegevoegd.
- Frontendkaart **Discogs artist enrichment** toegevoegd aan het relatiepaneel.
- Migratie toegevoegd voor voorbereidende enrichmenttabellen:
  - `artist_external_reference`
  - `artist_enrichment_cache`
  - `artist_external_image`
- Docker-proof migratiescript toegevoegd.
- Tests en documentatie bijgewerkt.

## Belangrijke beperking

ART-012B is inspect-only. Discogs-data wordt nog niet gekoppeld/toegepast op de lokale artist.

## Migratie

```bash
npm run db:migrate:art012b
```

## Validatie

```bash
npm run test:art012b
npm run test:art012
npm run test:packaging
```
