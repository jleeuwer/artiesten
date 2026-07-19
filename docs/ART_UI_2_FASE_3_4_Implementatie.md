# ART-UI-2 Fase 3/4 — Implementatie

## Gerealiseerd

- `ArtistWorkspaceLayout` onderscheidt standalone en Shellstarter embedded mode.
- Standalone gebruikt de document-scroll; embedded gebruikt één begrensde workspace-scroll.
- `ArtistTableViewport` is de enige secundaire verticale scrollcontainer.
- Responsive tabelhoogte via `clamp()` en kleinere waarden bij lage viewports.
- Sticky tabelheader binnen dezelfde horizontale/verticale viewport.
- Tabelpositie blijft behouden bij selectie, Edit, favoriet, Discogs- en relatieacties.
- Tabelpositie reset bij zoekactie, filter, sortering en paginawijziging.
- Nieuwe zoekcontext wist geselecteerde artist en alle detail-/Discogsstate direct.
- Verouderde lijstresponses worden met een request-token genegeerd.
- Discogs-profielfotosectie is standaard ingeklapt zodra een primaire foto bestaat.
- Na succesvolle profielkeuze klapt de sectie in; bij een fout blijft zij open.

## Feature flag

`VITE_ARTIST_UI_WORKSPACE_PHASE34=true` activeert de nieuwe layout. `false` houdt de Fase 1/2 scrollclass actief als tijdelijke rollbackoptie.

## Database

Geen database- of API-wijzigingen. Er is daarom geen Docker/PostgreSQL-migratie.
