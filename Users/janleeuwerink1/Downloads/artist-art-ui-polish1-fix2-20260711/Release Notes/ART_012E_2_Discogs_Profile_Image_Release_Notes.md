# Release Notes — ART-012E-2 Discogs profielfoto

Datum: 2026-06-08

## Samenvatting

ART-012E-2 voegt de mogelijkheid toe om één van de uit Discogs opgehaalde artist images te kiezen als primaire profielfoto voor de lokale artiest.

## Toegevoegd

- Nieuwe migratie `20260608_art012e2_discogs_profile_image.sql`.
- Nieuw package script `db:migrate:art012e2`.
- Nieuw package script `test:art012e2`.
- Backend endpoints:
  - `GET /api/artists/:id/discogs/images`
  - `POST /api/artists/:id/discogs/images/:imageId/primary`
- `getRelations` retourneert nu `discogsImages` en `primaryDiscogsImage`.
- Frontend sectie **Profielfoto uit Discogs images**.
- Compacte profielfoto in het relatiepaneel.
- Contracttest `tests/art012e2DiscogsProfileImage.contract.test.mjs`.

## Technische hardening

- Per artist kan maximaal één image `is_primary = true` hebben via partial unique index.
- Bestaande meervoudige primaire images worden vóór de index genormaliseerd.
- De selectie schrijft optioneel auditlog `discogs_primary_image_selected`.

## Niet inbegrepen

- Lokale image-cache download.
- Enrichment proposals.
- Datumextractie of profielteksttoepassing.
