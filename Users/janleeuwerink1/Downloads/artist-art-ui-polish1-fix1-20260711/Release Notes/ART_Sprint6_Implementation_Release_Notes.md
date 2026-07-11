# ART Sprint 6 — Implementatie release notes

Datum: 2026-05-19

## Inhoud

Deze release implementeert voor de Artiesten-app:

- artiestgewicht op basis van unieke titels in `file_details`, exclusief `fd_action = Delete`;
- sortering op favoriet, gewicht en artiestnaam;
- favoriet markeren/verwijderen;
- filter `Alleen favorieten`;
- read-only relatiepaneel onderaan met `file_details`, artiestenspellingen en hitlijsten;
- backend endpoints voor favorieten en relaties;
- database-migratie voor `artist.ar_is_favorite`;
- extra automatische contracttests.

## Migratie

Voer uit vóór functioneel testen. Voor de Docker PostgreSQL configuratie:

```bash
ARTIST_DB_CONTAINER=my-postgresdb npm run db:migrate:sprint6
```

Equivalent rechtstreeks commando:

```bash
docker exec -i my-postgresdb psql -U postgres -d musicdb < scripts/sql/20260519_artists_sprint6_favorites.sql
```

Een lokaal `psql "$DATABASE_URL" ...` voorbeeld is bewust niet de primaire instructie, omdat de gebruikelijke ontwikkelomgeving PostgreSQL in Docker draait.

## Validatie uitgevoerd

```bash
npm run test:sprint6
npm run test:sprint4
npm run test:unit
```

Alle bovenstaande tests zijn groen uitgevoerd in de opleveromgeving.

## Niet inbegrepen

- `node_modules`;
- `client/node_modules`;
- `.env`;
- logs;
- lokale MacOS metadata.

## Vervolg

Aanbevolen vervolg: ART Sprint 7 ontwerp voor artiesten ontdubbelen/samenvoegen, inclusief impactscan en audit/history.

## Sprint 6 Fix — 2026-05-19

Deze fix verwerkt twee testbevindingen:

- Artiestgewicht telt nu unieke titels: `count(distinct lower(trim(fd_tag_title)))`, exclusief records met `fd_action = Delete`.
- De lijst toont daarnaast `Versies` als aparte teller voor niet-verwijderde `file_details` records.
- Na selectie van een artiest scrollt/focust de UI naar het relatiepaneel onderaan.
- Het relatiepaneel heeft een knop `Terug naar artiestenlijst`.
- Het edit-scherm bevat compacte read-only infopanelen met dezelfde relatie-informatie. Deze panelen zijn informatief; bewerken gebeurt via de betreffende app in Shellstarter.

## Sprint 6 Fix — env-template standaardisatie — 2026-05-19

Deze fix vereenvoudigt de env-template aanpak:

- `.env.example` is de enige officiële voorbeeldconfiguratie.
- `.sample.env` en `.env.sample` worden niet meer gebruikt of meegeleverd.
- `tests/packaging.contract.test.mjs` controleert nu alleen `.env.example` als verplichte template.
- De packaging-test controleert ook dat `.sample.env` en `.env.sample` niet aanwezig zijn.
- `scripts/make-release-zip.sh` faalt als `.env.example` ontbreekt of leeg is.
- Het release-script sluit `.sample.env` en `.env.sample` expliciet uit om terugval naar oude template-namen te voorkomen.
- README/runbook gebruiken uitsluitend: `cp .env.example .env`.
