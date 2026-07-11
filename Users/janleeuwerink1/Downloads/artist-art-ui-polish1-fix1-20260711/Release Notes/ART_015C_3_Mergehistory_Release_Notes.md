# Release Notes — ART-015C-3 Mergehistorie en samengevoegde artiesten

## Inhoud

- Filter voor actieve, inclusief samengevoegde en alleen samengevoegde artiesten.
- Badge **Samengevoegd** in de artiestenlijst.
- Weergave van leidende/canonical artiest bij samengevoegde records.
- Knop **Open leidende artiest** in het relatiepaneel.
- Read-only kaart **Mergehistorie** in het relatiepaneel.
- Ontdubbelen, Edit en Trash uitgeschakeld voor samengevoegde artiesten.
- Nieuw endpoint `GET /api/artists/merge/history`.
- `GET /api/artists/:id/relations` retourneert nu `mergeHistory`.

## Migratie

Geen nieuwe migratie nodig. ART-015C-3 gebruikt de migratie uit ART-015C-1:

```bash
npm run db:migrate:art015c
```

## Validatie

```bash
npm run test:art015c3
npm run test:art015c
npm run test:unit
```
