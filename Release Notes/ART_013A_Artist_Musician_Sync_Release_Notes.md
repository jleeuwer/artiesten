# Release Notes — ART-013A Artist → Musician sync

## Samenvatting

ART-013A voegt databasegestuurde one-way synchronisatie toe van `artist` naar `musician` voor bestaande gekoppelde persoonsartiesten.

## Opgeleverd

- PostgreSQL functie `public.fn_artist_sync_to_musician()`.
- PostgreSQL trigger `trg_artist_sync_to_musician` op `public.artist`.
- Migratiescript `npm run db:migrate:art013a`.
- Contracttest `npm run test:art013a`.
- Documentatie en runbook.

## Ontwerpbesluiten

- Synchronisatie is alleen `artist → musician`.
- Er is nooit bidirectionele synchronisatie.
- Sync gebeurt alleen bij update van een bestaande artist.
- Sync gebeurt alleen voor `ar_artist_type = 'person'`.
- Sync gebeurt alleen als de gekoppelde musician al bestaat.
- Er worden geen musicians automatisch aangemaakt.
- Delete, merge en deactiveren van artist synchroniseren niets naar musician.
- Musician blijft bestaan omdat bandrelaties via `musician_in_band` historisch geldig kunnen blijven.

## Velden

Gesynchroniseerd:

- naam;
- geboortedatum, als artistwaarde gevuld is;
- sterfdatum;
- website.

Niet gesynchroniseerd:

- notes;
- favoriet-status;
- Discogs-data;
- delete/merge-status.

## Migratie

```bash
mkdir -p logs && npm run db:migrate:art013a 2>&1 | tee "logs/db-migrate-art013a-$(date +%Y%m%d-%H%M%S).log"
```

## Test

```bash
mkdir -p logs && npm run test:art013a 2>&1 | tee "logs/test-art013a-$(date +%Y%m%d-%H%M%S).log"
```


ART-013A ontwerpnotitie: er is geen automatische aanmaak van musician-records.
