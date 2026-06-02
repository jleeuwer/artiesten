# Release Notes — ART-015C-1 Transactionele artist merge

## Inhoud

Deze release implementeert de uitvoering van artist merge na de ART-015B impactscan.

## Belangrijkste wijzigingen

- Nieuw endpoint: `POST /api/artists/merge/execute`.
- Merge-service met één database-transactie.
- Redundante artiest wordt gemarkeerd als merged/deleted, niet hard deleted.
- Updates voor afgesproken merge-scope:
  - `file_details`
  - `artiesten_spelling`
  - `hitlijsten`
  - `staging_hitlijsten`
  - `import_scan_items`
  - reset van `file_details_version_group_validations`
- Audit/history:
  - `artist_merge_history`
  - `admin_audit_log`
- Shellstarter-alert via `alerts`.
- UI: redenveld, expliciete bevestiging en merge-resultaat in de impactscan-offcanvas.

## Migratie

Draai in Docker PostgreSQL:

```bash
npm run db:migrate:art015c
```

Deze gebruikt:

```text
scripts/sql/20260525_art015c_artist_merge_execution.sql
```

## Tests

```bash
npm run test:art015c
npm run test:unit
npm run test:sprint4
```

## Buiten scope

- Mailverzending.
- Albums.
- Discogs artist-linking.
- Periodieke Python duplicate scanner met staging.
