# ART-013B-1-Fix-1 — Centrale `.env`-loading voor databasecommando's

## Probleem
De eerste ART-013B-1-oplevering gebruikte afwijkende variabelen `POSTGRES_CONTAINER`, `POSTGRES_DB` en `POSTGRES_USER`. Daardoor stopte de preflight ondanks dat de reguliere applicatieconfiguratie al in `.env` aanwezig was.

## Oplossing
Alle ART-013B-1 databasecommando's gebruiken nu dezelfde projectbrede configuratie als de rest van de Artiesten-app:

- `.env` in de applicatieroot wordt automatisch geladen;
- `ARTIST_DB_CONTAINER` bepaalt de PostgreSQL-container;
- `ARTIST_DB_USER` bepaalt de databasegebruiker;
- `ARTIST_DB_NAME` bepaalt de database;
- `ARTIST_DB_TEST_ALLOWED` en `ARTIST_DB_ENVIRONMENT` worden vóór de testguards uit `.env` geladen.

De gedeelde implementatie staat in `scripts/lib/art013b1-db.sh`.

## Gevolg
Voor preflight, migratie, verificatie en database-integratietest hoeven geen nieuwe `POSTGRES_*`-variabelen te worden toegevoegd. De bestaande `.env` blijft leidend.
