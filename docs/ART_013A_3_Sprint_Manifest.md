# ART-013A-3 — Sprintmanifest

Datum: 2026-07-12  
Status: ontwerp gereed voor implementatie

## Sprintdoel

Introduceer het asymmetrische artist/musician-model: iedere persoonsartist heeft exact één musician, terwijl musicians ook zelfstandig zonder artist mogen bestaan.

## In scope

- standalone musicianbeheer;
- artist/musician create-, link-, relink- en promotieflows;
- nieuw bandlid zonder artist vanuit bandcontext;
- één-op-één-borging;
- artist→musician synchronisatieregressie;
- preflight, migratie, verify en transactionele DB-tests;
- UI-integratie binnen de Artiesten-app;
- functionele en technische testbasis.

## Buiten scope

- externe providers;
- musician merge;
- release- en trackcredits;
- bidirectionele sync;
- aparte musician-app.

## Geplande codeartefacten

```text
scripts/art013a3-preflight.sh
scripts/db-migrate-art013a3-docker.sh
scripts/art013a3-verify.sh
scripts/db-test-art013a3-docker.sh
scripts/sql/20260712_art013a3_*.sql
controllers/musicianController.js
controllers/artistMusicianLinkController.js
models/musicianModel.js
services/musicianService.js
services/artistMusicianLinkService.js
validators/musicianValidator.js
routes/musicianRoutes.js
client/src/features/musicians/*
```

## Geplande npm-commando's

```text
musician-model:preflight
 db:migrate:art013a3
musician-model:verify
test:art013a3:contract
test:art013a3:db
test:art013a3
```

Deze commando's worden pas in de codesprint geïmplementeerd.

## Definition of Done

- alle acceptatiecriteria uit het ontwerp gehaald;
- functionele en technische testcase-ID's traceerbaar;
- PostgreSQL-integratietest met rollback en leftovers=0;
- bestaande ART-013A/ART-013B-1-tests groen;
- productiebuild groen;
- documentatie en release notes bijgewerkt;
- ZIP zonder `.env`, logs, `node_modules` en macOS-metadata.
