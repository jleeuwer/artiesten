# Sprintmanifest — ART-UI-2 Fase 3/4

## Sprint

ART-UI-2 Fase 3/4 — artiestentabel en embedded scrollnormalisatie

## In scope

- responsive begrensde artiestentabel;
- sticky tabelheader;
- expliciet scrollpositiebehoud en resetcontract;
- detailstate wissen bij nieuwe zoekcontext;
- bescherming tegen stale async detailresponses;
- één primaire scrollowner in standalone en embedded mode;
- feature flag en rollback;
- uitbreiding automatische scrollaudit;
- component-, Playwright-, visuele en regressietests.

## Buiten scope

- database- of API-wijzigingen;
- businesslogica van artist/Discogs/musician;
- herontwerp van tabelkolommen;
- virtual scrolling;
- volledige responsive mobiele redesign;
- verwijderen oude layout vóór acceptatie.

## Afhankelijkheden

- ART-UI-2 Fase 1/2 geaccepteerd;
- ART-013B-2 Fix-6 geaccepteerd;
- Shellstarter embedded contract blijft beschikbaar.

## Deliverables codesprint

- `ArtistWorkspaceLayout.jsx`;
- `ArtistTableViewport.jsx`;
- gescopeerde CSS;
- feature flag;
- uitgebreid `ui:scroll:audit`;
- 80 traceerbare testcases;
- Chromium Playwright-suite;
- visuele snapshots;
- bijgewerkte README/backlog/projectnotities/release notes.
