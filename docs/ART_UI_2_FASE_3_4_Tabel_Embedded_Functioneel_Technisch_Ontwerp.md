# ART-UI-2 — Fase 3 en 4: artiestentabel en embedded scrollnormalisatie

Datum: 2026-07-14  
Status: functioneel en technisch ontwerp voor volgende codesprint

## 1. Doel

Fase 1/2 verwijderde geneste verticale scroll uit het detailgebied. Fase 3/4 normaliseert nu de artiestentabel en bepaalt expliciet wie de verticale scroll beheert in standalone en Shellstarter embedded mode.

Hoofdregel:

> Er is per context precies één primaire verticale scrollowner. Alleen de artiestentabel mag daarnaast een begrensde secundaire verticale scroll hebben.

## 2. Functionele uitgangspunten

### Standalone

- Het document is de primaire verticale scrollowner; in de browser is dit de browserpagina.
- De artiestentabel heeft een duidelijk begrensde hoogte en één interne verticale scrollbar.
- Het detailgebied blijft in de normale documentflow en heeft geen verticale scrollbar.

### Embedded Shellstarter

- De Artiesten-app krijgt één expliciete app-workspace-scrollcontainer binnen de beschikbare iframe/hosthoogte.
- Shellstarter en de app mogen niet allebei een onafhankelijke verticale scrollbar tonen voor dezelfde content.
- De tabel blijft de enige secundaire verticale scroller.
- Detailcontent groeit binnen de app-workspace en blijft volledig bereikbaar.

## 3. Tabelgedrag

- Responsive hoogte via CSS `clamp()` en viewport-/containerhoogte.
- Desktop richtwaarde: 42–52vh.
- Lage viewport: minimaal circa 18rem zodat header en meerdere rijen zichtbaar blijven.
- Embedded mode gebruikt beschikbare apphoogte en reserveert ruimte voor toolbar, meldingen, paginering en een eerste deel van details.
- Header blijft sticky binnen de tabelcontainer.
- Horizontale scroll blijft in dezelfde tabelcontainer.
- Selected-row, Edit, favorite, Discogs-link en details openen resetten de tabelscroll niet.
- Nieuwe zoekterm, filters, sortering of pagina resetten de tabel naar boven.
- Lege zoekresultaten wissen detailstate en zetten de tabel naar boven.

## 4. Scrollpositiebehoud

Er komen twee expliciete functies:

- `preserveArtistTableScroll(reason)` voor detail- en rijacties;
- `resetArtistTableScroll(reason)` voor datasetwijzigingen.

Resetredenen:

- `search-change`;
- `filter-change`;
- `sort-change`;
- `page-change`;
- `clear-filters`.

Behoudredenen:

- `select-artist`;
- `open-details`;
- `open-edit`;
- `toggle-favorite`;
- `link-discogs`;
- `select-primary-image`;
- `save-relation`;
- `proposal-action`.

Geen automatische `scrollIntoView()` tenzij de geselecteerde rij door een externe refresh buiten beeld is geraakt en de gebruiker dit expliciet heeft aangevraagd.

## 5. Sticky header

- `thead th` gebruikt `position: sticky; top: 0` binnen de tabelcontainer.
- Eigen achtergrond, border en beperkte z-index.
- Geen overlap met modals, offcanvas, dropdowns of Shellstarter header.
- Sticky header blijft correct bij horizontaal scrollen.

## 6. Embedded scrollownership

De app-root krijgt runtime-attributen:

```text
data-scroll-owner="document"   // standalone
data-scroll-owner="workspace"  // embedded
```

Standalone:

```text
body/document
  artist workspace
    artist table scroll
    details in document flow
```

Embedded:

```text
iframe/app viewport
  artist workspace main scroll
    artist table scroll
    details in workspace flow
```

De app bepaalt embedded hoogte via een expliciete CSS-variable, bijvoorbeeld:

```css
--artist-embedded-viewport-height: 100dvh;
```

Indien Shellstarter later een concrete beschikbare hoogte via contract/query levert, kan dezelfde variable worden overschreven zonder componentwijziging.

## 7. Technische componentstructuur

Nieuwe pure layoutcomponenten:

```text
ArtistWorkspaceLayout.jsx
ArtistTableViewport.jsx
```

`ArtistWorkspaceLayout` beheert uitsluitend:

- standalone versus embedded scrollowner;
- semantische regions;
- CSS-klassen en data-attributen;
- geen API-calls of artistbusinesslogica.

`ArtistTableViewport` beheert uitsluitend:

- tabelcontainer;
- ref;
- sticky-header wrapper;
- scroll reset/preserve helper;
- geen datafetching.

Bestaande `ArtistPageContent` blijft eigenaar van data, selectie, acties en detailmodules.

## 8. CSS-richting

Nieuwe gescopeerde selectors:

```css
.artist-workspace-v2 { min-height: 0; }
.artist-workspace-v2[data-scroll-owner='workspace'] {
  height: var(--artist-embedded-viewport-height, 100dvh);
  overflow-y: auto;
  overscroll-behavior-y: contain;
}
.artist-workspace-table-viewport {
  max-height: clamp(18rem, 48vh, 42rem);
  overflow: auto;
  min-height: 0;
}
.artist-workspace-table-viewport thead th {
  position: sticky;
  top: 0;
  z-index: 2;
}
```

Voor embedded mode komt een aparte hoogteberekening, zonder vaste pixels en zonder globale `body { overflow: hidden; }`.

## 9. Feature flag en rollback

Tijdelijke clientflag:

```env
VITE_ARTIST_UI_WORKSPACE_PHASE34=true
```

- `false`: huidige Fase 1/2-layout.
- `true`: nieuwe Fase 3/4-layout.
- Na browseracceptatie wordt de oude route verwijderd in een aparte cleanupwijziging.

Geen backend- of databaseflag nodig.

## 10. State- en asyncveiligheid

- Een nieuwe zoekactie wist direct `selectedArtist`, relaties, Discogs-details en bandledenstate.
- Responses krijgen een request-/selectiontoken; oude responses mogen gewiste detailstate niet herstellen.
- Tabelscrollreset gebeurt direct bij nieuwe datasetcontext, niet pas na response.
- Loading overlay mag de scrollhoogte niet laten springen.

## 11. Toegankelijkheid

- Regions krijgen landmarks en labels: `Artiestenlijst`, `Artiestdetails`.
- Tabelviewport is via toetsenbord bereikbaar, maar krijgt geen geforceerde focus bij normale muisselectie.
- Sticky header blijft leesbaar bij high contrast en zoom.
- `PageUp`, `PageDown`, `Home` en `End` werken volgens de actieve scrollowner.
- Focus na modal/offcanvas sluit terug naar de oorspronkelijke knop, zonder paginajump.

## 12. Observability

De bestaande development-only scroll-debug blijft beschikbaar en wordt uitgebreid met labels voor:

- `document-scroll-owner`;
- `workspace-scroll-owner`;
- `artist-table-scroll`;
- verboden detail-scrollers.

`npm run ui:scroll:audit` wordt uitgebreid met Fase 3/4-regels.

## 13. Geen database/API-wijziging

ART-UI-2 Fase 3/4 wijzigt geen PostgreSQL-schema, routes of payloads. Docker/PostgreSQL-migraties zijn daarom niet van toepassing.

## 14. Gefaseerde codesprint

1. Layoutcomponent en feature flag toevoegen.
2. Tabelviewport met sticky header en responsive hoogte introduceren.
3. Reset-/preservecontract implementeren.
4. Detailstate bij zoeken veilig wissen.
5. Embedded scrollowner implementeren.
6. Scrollaudit uitbreiden.
7. Component- en Playwrighttests toevoegen.
8. Standalone, embedded en Mac-trackpad handmatig accepteren.
9. Oude layout pas na acceptatie verwijderen.

## 15. Acceptatiecriteria

1. Standalone heeft één primaire documentscroll.
2. Embedded heeft één primaire workspace-scroll.
3. De artiestentabel is de enige toegestane secundaire verticale scroller.
4. Detailgebied heeft geen verticale scroller.
5. Sticky tabelheader werkt verticaal en horizontaal.
6. Rij- en detailacties behouden tabelpositie.
7. Zoeken, filteren, sorteren en pagineren resetten tabelpositie.
8. Nieuwe zoekactie wist oude details onmiddellijk.
9. Verouderde async-responses herstellen geen oude details.
10. Modals/offcanvas behouden scroll en focusgedrag.
11. Standalone en Shellstarter embedded zijn browsermatig getest.
12. Alle bestaande ART-012/013-functionaliteit blijft werken.
