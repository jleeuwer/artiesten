# Release notes — ART-012B-Prep Discogs env-standaardisatie

## Type

Ontwerp-/configuratiehardening, geen functionele Discogs API-implementatie.

## Inhoud

- Discogs-envnamen gestandaardiseerd voor de Artiesten-app.
- `.env.example` gebruikt voortaan de standaardnamen:
  - `DISCOGS_USER_TOKEN`
  - `DISCOGS_USER_AGENT`
  - `DISCOGS_BASE_URL`
  - `DISCOGS_CACHE_TTL_SECONDS=21600`
  - `DISCOGS_REQUEST_TIMEOUT_MS=10000`
- Legacy namen uit Importeren Songs zijn gedocumenteerd als fallback/migratiepad:
  - `DISCOGS_API_TOKEN`
  - `DISCOGS_API_BASE_URL`
  - `DISCOGS_ENABLED`
- Nieuwe config-helper toegevoegd:
  - `config/discogsConfig.js`
- Nieuwe contracttest toegevoegd:
  - `tests/art012bPrepDiscogsEnvStandardization.contract.test.mjs`

## Besluit

De lokale artist key blijft leidend. Discogs-configuratie wordt alleen gebruikt om externe Discogs-data op te halen. Discogs ID's vervangen nooit lokale artist keys.

## SQL

Geen nieuwe SQL-migratie.
