# ART-012D-4-Fix-2 — Migration dependency guard

## Probleem

`npm run db:migrate:art012d4:fix1` faalde wanneer de ART-012D-4-basismigratie nog niet was uitgevoerd:

```text
ERROR: relation "public.artist_name_proposals" does not exist
```

## Oplossing

Het migratiescript `scripts/db-migrate-art012d4-fix1-docker.sh` controleert nu eerst of `public.artist_name_proposals` bestaat via `to_regclass(...)`.

Als de tabel ontbreekt, voert het script automatisch eerst de ART-012D-4-basismigratie uit en daarna de Fix-1 hardening-migratie.

## Impact

Geen functionele wijziging in de applicatie. Alleen de migratierun is robuuster en minder afhankelijk van handmatige volgorde.
