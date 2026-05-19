# Artiesten-app

De Artiesten-app is de Musicapp-beheerapp voor canonical artiestgegevens. De app draait zelfstandig als Node.js/Express + React/Vite applicatie en kan daarnaast embedded worden gebruikt binnen Shellstarter.

## Functionaliteit

- Overzicht van artiesten.
- Artiest toevoegen, wijzigen en bekijken.
- Soft delete naar trash.
- Restore vanuit trash.
- Hard delete met functionele beveiliging:
  - blokkeren als de artiest nog in `file_details` voorkomt;
  - gekoppelde `artiesten_spelling` records opruimen vóór definitief verwijderen.
- Embedded Shellstarter-modus met theme- en height-contract.

## Technische stack

- Backend: Node.js + Express.
- Frontend: React + Vite + React Bootstrap.
- Database: PostgreSQL.
- Logging: Winston.
- Tests: Node test runner.

## Directory-indeling

```text
.
├── client/                 # React/Vite frontend
├── config/                 # database en logging
├── controllers/            # backend controllers
├── docs/                   # sprintdocs, backlog en projectnotities
├── middleware/             # Express middleware
├── models/                 # database queries/model functies
├── public/app/             # productiebuild van de React-app
├── routes/                 # Express routes
├── scripts/                # test- en release-scripts
├── tests/                  # contract/unit tests
├── app.js
└── server.js
```

## Configuratie

Kopieer een voorbeeldbestand naar `.env`:

```bash
cp .sample.env .env
```

of:

```bash
cp .env.example .env
```

Minimale configuratie:

```env
NODE_ENV=development
PORT=3012
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/musicdb
CORS_ORIGIN=http://localhost:5173
VITE_ARTIST_APP_ENABLE_SHELL_MODE=true
VITE_ARTIST_APP_ALLOW_THEME_QUERY=true
VITE_ARTIST_APP_DEFAULT_THEME=slate
```

`.env` is lokaal en mag niet in release-ZIP's worden opgenomen. `.sample.env` en `.env.example` moeten juist wel worden meegeleverd.

## Installatie

Installeer root- en client-dependencies:

```bash
npm run install:all
```

Dit voert uit:

```bash
npm install
npm --prefix client install
```

## Ontwikkelen

Start backend:

```bash
npm run dev
```

Start client in een tweede terminal:

```bash
npm run client:dev
```

De backend draait standaard op de poort uit `.env`, bij voorkeur `3012`. De Vite devserver draait meestal op `5173`.

## Productiebuild

Maak de React-build naar `public/app`:

```bash
npm run build
```

Start daarna de Express-server:

```bash
npm start
```

Of gecombineerd:

```bash
npm run prod
```

## Testen

Snelle unit/contracttests zonder client-build:

```bash
npm run test:unit
```

Sprint 4 regressietests:

```bash
npm run test:sprint4
```

Packaging-hygiëne controleren:

```bash
npm run test:packaging
```

Volledige validatie, inclusief dependencycheck en client-build:

```bash
npm run test:all
```

Let op: `npm run test:all` vereist dat `npm run install:all` al is uitgevoerd.

## Shellstarter embedded gebruik

De app kan embedded worden geopend met queryparameters zoals:

```text
?embeddedInShell=1&shellTheme=slate&shellOrigin=http://localhost:3010
```

Ondersteunde embedded signalen en context staan beschreven in:

```text
docs/PROJECT_NOTES.md
```

Shellstarter-code valt buiten deze codebase. Deze app bewaakt alleen het client-contract dat nodig is om embedded correct te functioneren.

## Release-ZIP maken

Gebruik:

```bash
npm run package:zip
```

Dit maakt een schone ZIP in de bovenliggende directory. De release-ZIP sluit onder andere uit:

- `.env`
- `.git`
- `node_modules`
- `client/node_modules`
- logs
- `.DS_Store`
- `__MACOSX`
- bestaande ZIP/TAR-bestanden

## Documentatie

Belangrijke documenten:

- `docs/BACKLOG.md`
- `docs/PROJECT_NOTES.md`
- `docs/ART_Sprint6_Artiesten_Relatieinzicht_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_Sprint6_Testcases_en_Runbook.md`
- `docs/BL044_Sprint4_Artiesten_Test_Cases_and_Runbook.md`
- overige BL-044 sprintdocumentatie in `docs/`

## Actuele functionele richting

Sprint 6 is geïmplementeerd: artiestgewicht, favorieten en read-only relatie-inzicht. De app moet later ook kunnen doorgroeien naar Discogs artist enrichment, artiesten ontdubbelen/samenvoegen, muzikant-band-artiest relaties en albums in `musicdb`.

## ART Sprint 6 — Relatie-inzicht, gewicht en favorieten

Deze versie bevat de Sprint 6 implementatie voor de Artiesten-app.

### Nieuwe functionaliteit

- Artiestgewicht op basis van aantal unieke titels in `file_details`, exclusief records met `fd_action = Delete`.
- Sortering op favoriet, gewicht en naam.
- Favoriet markeren via ster-icoon.
- Filter `Alleen favorieten`.
- Read-only relatiepaneel onderaan het scherm met:
  - gekoppelde `file_details`;
  - gekoppelde `artiesten_spelling` records;
  - hitlijsten waarin de artiest voorkomt.

### Database-migratie

Voor Sprint 6 is deze migratie nodig. Omdat de standaard ontwikkelomgeving PostgreSQL in Docker gebruikt, is `docker exec` de aanbevolen route:

```bash
# Pas de containernaam aan als jouw PostgreSQL-container anders heet.
ARTIST_DB_CONTAINER=my-postgresdb npm run db:migrate:sprint6
```

Of rechtstreeks vanaf de host:

```bash
docker exec -i my-postgresdb psql -U postgres -d musicdb < scripts/sql/20260519_artists_sprint6_favorites.sql
```

Controleer daarna het nieuwe veld:

```bash
docker exec -it my-postgresdb psql -U postgres -d musicdb -c "select column_name, data_type, column_default from information_schema.columns where table_name = 'artist' and column_name = 'ar_is_favorite';"
```

Een lokaal `psql "$DATABASE_URL" ...` commando is alleen geschikt wanneer `psql` lokaal geïnstalleerd is en direct bij de database kan.

### Sprint 6 tests

```bash
npm run test:sprint6
npm run test:unit
```

Na dependency-installatie kan de volledige set worden gedraaid:

```bash
npm run install:all
npm run test:all
```
# artiesten
