# ART-013B-2 Sprintmanifest

## Sprint
ART-013B-2 — Discogs ondersteuning en reviewqueue voor bandledenrelaties

## Baseline
ART-013A-3-Fix-2 en ART-013B-1-Fix-2.

## Oplevering in deze ZIP
- functioneel en technisch ontwerp;
- voorstel voor generieke proposal- en sourcetabellen;
- provider-, matching- en acceptatiearchitectuur;
- API- en frontendontwerp;
- Docker/PostgreSQL-strategie;
- functionele testbasis;
- backlog-, projectnotities- en README-update;
- ontwerpcontracttests.

## Niet geïmplementeerd
De productiecode, migraties en API-calls worden in de volgende codesprint gebouwd.

## Implementatiebestanden
- `services/discogsBandMembersProvider.js`
- `services/musicianInBandMatchingService.js`
- `services/musicianInBandProposalService.js`
- `models/musicianInBandProposalModel.js`
- `models/musicianInBandSourceModel.js`
- `controllers/musicianInBandProposalController.js`
- `routes/musicianInBandProposalRoutes.js`
- `client/src/features/musician-in-band-proposals/`
- `scripts/sql/20260712_art013b2_discogs_band_member_proposals.sql`
- `scripts/art013b2-preflight.sh`
- `scripts/db-migrate-art013b2-docker.sh`
- `scripts/art013b2-verify.sh`
- `scripts/db-test-art013b2-docker.sh`
