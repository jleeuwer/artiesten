# ART-012D-3A — Canonical rename preview

## Type

Implementatiesprint zonder database-migratie.

## Inhoud

- Nieuw endpoint `POST /api/artists/:id/discogs/spelling-proposals/canonical-preview`.
- Nieuwe backendfunctie `Artist.getDiscogsCanonicalRenamePreview`.
- Nieuwe UI-actie **Preview canonical** in Discogs naamvoorstellen.
- Preview toont huidige naam, voorgestelde naam, blokkades, waarschuwingen en transactioneel plan.
- Er worden geen wijzigingen uitgevoerd op `artist` of `artiesten_spelling`.

## Validatie

- `npm run test:art012d3a`
- `npm run test:art012d`
- `npm run test:art012`
- `npm run test:packaging`
