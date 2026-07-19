# ART-UI-2 Fase 1/2 — Functionele en technische testcases

## Automatische contracttests

### Structuur en CSS

- UI2-012-TC-001: detailwrapper bevat `artist-workspace-detail-region`.
- UI2-012-TC-002: detailwrapper is gemarkeerd als `artist-details` scrollcontainer.
- UI2-012-TC-003: tabelwrapper bevat `artist-workspace-table-region`.
- UI2-012-TC-004: tabelwrapper is gemarkeerd als `artist-table` scrollcontainer.
- UI2-012-TC-005: detailwrapper heeft `max-height: none`.
- UI2-012-TC-006: detailwrapper heeft `overflow: visible`.
- UI2-012-TC-007: detailtabellen hebben geen verticale overflow.
- UI2-012-TC-008: detailtabellen behouden horizontale overflow.
- UI2-012-TC-009: Discogs-resultaten hebben geen verticale overflow in detailgebied.
- UI2-012-TC-010: Discogs-imagegrid heeft geen vaste maximale hoogte in detailgebied.
- UI2-012-TC-011: modal-body behoudt eigen verticale scroll.
- UI2-012-TC-012: debugmodus is development-only.
- UI2-012-TC-013: `.env.example` documenteert debugflag.
- UI2-012-TC-014: geen database- of migratiescript vereist.
- UI2-012-TC-015: nieuwe regels zijn op featureklassen gescopeerd.

### Regressiecontract

- UI2-012-TC-016: ArtistPageContent behoudt ArtistFormModal.
- UI2-012-TC-017: ArtistPageContent behoudt detail-Offcanvas.
- UI2-012-TC-018: relationPanelView navigatie blijft aanwezig.
- UI2-012-TC-019: Discogs-paneel blijft aanwezig.
- UI2-012-TC-020: BandMembershipPanel blijft aanwezig.
- UI2-012-TC-021: naamvoorstellenqueue blijft aanwezig.
- UI2-012-TC-022: enrichmentvoorstellen blijven aanwezig.
- UI2-012-TC-023: terug-naar-artiestenlijst blijft aanwezig.
- UI2-012-TC-024: productiebuild slaagt.
- UI2-012-TC-025: packaging sluit runtimebestanden uit.

## Handmatige functionele acceptatie

### Standalone desktop

1. Open de Artiesten-app op 1440×900.
2. Selecteer een artist met veel relaties en Discogs-data.
3. Plaats de cursor boven Relatie-inzicht.
4. Scroll met muiswiel tot onderaan alle detailmodules.
5. Bevestig dat geen interne detailscroll de pagina vasthoudt.
6. Open Alles, Relaties, Discogs en Ontdubbelen.
7. Controleer dat alle zichtbare modules bereikbaar zijn.
8. Controleer horizontale scroll bij brede detailtabellen.

### Mac-trackpad

1. Scroll vloeiend vanuit de artiestentabel richting detailgebied.
2. Herhaal met cursor boven een relatiekaart, Discogs-resultaat en bandledentabel.
3. Controleer dat verticale beweging de pagina blijft volgen.
4. Controleer dat horizontale trackpadbeweging op brede tabellen mogelijk blijft.

### Modals en offcanvas

1. Open Edit bij een artist met veel inhoud.
2. Controleer dat alleen de modal-body scrolt.
3. Sluit de modal en controleer behoud van paginapositie.
4. Open Artiest details en merge-impact offcanvas.
5. Controleer dat de offcanvas-body scrolt en de pagina eronder niet.

### Discogs

1. Open Discogs-resultaten met meerdere entries.
2. Controleer dat de resultaten verticaal meegroeien met de pagina.
3. Controleer horizontale bereikbaarheid van alle kolommen en acties.
4. Open de imagegrid en controleer dat alle images via paginascroll bereikbaar zijn.
5. Koppel een Discogs-entry en controleer bestaande refreshfunctionaliteit.

### Bandleden en proposals

1. Open een band met meerdere leden.
2. Controleer dat de tabel geen interne verticale scrollbar heeft.
3. Open Discogs aanvullen en voer bestaande proposalacties uit.
4. Controleer dat modals hun eigen scroll behouden.

### Embedded Shellstarter

1. Open de app embedded in Shellstarter.
2. Controleer dat het detailgebied geen eigen verticale scrollbar heeft.
3. Controleer dat de host/app-combinatie niet drie of meer geneste verticale scrollers oplevert.
4. Valideer lage viewport van circa 1200×700.

## Automatiseringsvervolg

Voor een toekomstige Playwright-suite:

- wheel-events boven tabel en detail;
- assert `scrollHeight <= clientHeight` voor detailcontainers;
- assert horizontale overflow waar verwacht;
- screenshots op 1440×900, 1280×720, 1024×768 en embedded 1200×700;
- modal/offcanvas scrollownership;
- regressie op artistselectie en detailtabwissels.

## Geautomatiseerde scroll-audit

Voer de statische scrollaudit uit met:

```bash
mkdir -p logs &&
npm run ui:scroll:audit 2>&1 |
tee "logs/art-ui2-scroll-audit-$(date +%Y%m%d-%H%M%S).log"
```

De audit faalt wanneer in het hoofd-detailgebied opnieuw `overflow-y: auto` of `overflow-y: scroll` wordt geïntroduceerd. Modal- en offcanvas-body blijven expliciet toegestaan als zelfstandige overlayscroll.

Aanvullende automatische scenario's:

- UI2-012-TC-026: legacy verticale scrollregel is fysiek verwijderd uit `.artist-relation-panel`.
- UI2-012-TC-027: `.artist-relation-table-scroll` is alleen horizontaal scrollbaar.
- UI2-012-TC-028: Discogs-resultaten bezitten geen verticale detailscroll.
- UI2-012-TC-029: Discogs-imagegrid groeit mee met de primaire paginascroll.
- UI2-012-TC-030: `npm run ui:scroll:audit` eindigt met `passed=true violations=0`.
- UI2-012-TC-031: ART-UI-1A-regressietest verwacht niet langer het verwijderde scrollgedrag.
