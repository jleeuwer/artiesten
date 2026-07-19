# ART-UI-2 — Fase 1 en 2: scrollinventarisatie en normalisatie detailgebied

Datum: 2026-07-14
Status: geïmplementeerd, lokale browseracceptatie vereist

## Doel

De Artiesten-app krijgt één voorspelbare primaire verticale paginascroll. Het relatie-/detailgebied onder de artiestentabel mag niet langer zelf verticaal scrollen en mag ook geen geneste verticale scrollgebieden bevatten. Modals en offcanvas-panelen blijven zelfstandige overlays met hun eigen body-scroll.

## Functionele uitgangspunten

- De gebruiker kan met muiswiel of Mac-trackpad vanaf de artiestentabel naar het volledige detailgebied scrollen zonder de cursor eerst buiten een intern paneel te plaatsen.
- Het detailgebied staat in de normale documentflow en groeit mee met de inhoud.
- Detailtabellen mogen horizontaal scrollen als de kolommen breder zijn dan de viewport.
- Detailtabellen krijgen geen eigen verticale scrollbar.
- Discogs-resultaten en de Discogs-imagegrid groeien verticaal mee met de pagina.
- De bestaande paneelnavigatie, artistselectie, Discogs-acties, bandledenacties, naamvoorstellen en enrichmentacties blijven ongewijzigd.
- Edit-modals en offcanvas blijven intern scrollbaar.
- Er is geen database- of API-wijziging.

## Fase 1 — Inventarisatie en observability

De volgende verticale scrollowners zijn toegestaan:

1. browserpagina of app-shell;
2. modal-body;
3. offcanvas-body.

De artiestentabel behoudt in Fase 1/2 alleen horizontale overflow. Een eventueel begrensde verticale tabelscroll wordt pas in ART-UI-2 Fase 3 beoordeeld.

Development-only observability:

```env
VITE_ARTIST_UI_SCROLL_DEBUG=true
```

Hiermee worden containers met `data-scroll-container` zichtbaar gemarkeerd. De debugweergave is alleen actief in Vite development mode.

## Fase 2 — Normalisatie detailgebied

De wrapper `artist-relation-panel` krijgt aanvullend:

```text
artist-workspace-detail-region
```

Binnen deze wrapper worden verwijderd:

- `max-height` op het hoofd-detailpaneel;
- `overflow-y: auto` op het hoofd-detailpaneel;
- verticale overflow op `.artist-relation-table-scroll`;
- verticale overflow op Discogs-resultaten;
- vaste maximale hoogte en overflow op de Discogs-imagegrid.

Horizontale overflow blijft toegestaan voor brede tabellen.

## Technische wijzigingen

### Componentmarkering

`ArtistPageContent.jsx` markeert:

- de artiestentabel als `data-scroll-container="artist-table"`;
- het detailgebied als `data-scroll-container="artist-details"`;
- de app-root met `data-scroll-debug`.

### CSS-isolatie

Alle nieuwe regels zijn gescopeerd op:

```text
artist-workspace-table-region
artist-workspace-detail-region
```

Er zijn geen globale wijzigingen aan `body`, `table`, `.modal`, `.offcanvas`, Bootstrap `.container` of `.row`.

### Bewuste uitzonderingen

Niet gewijzigd:

- `.artist-form-modal .modal-body`;
- `.offcanvas-body`;
- scrollbare code-/payloadviewers buiten het hoofd-detailgebied;
- businesscomponenten en API-calls.

## Risicobeheersing

- Geen databasewijziging.
- Geen API-contractwijziging.
- Geen state- of selectielogica verplaatst.
- Geen Discogs-, musician-, merge- of enrichmentservice aangepast.
- Nieuwe CSS is additief en specifiek.
- Debugmodus staat standaard uit.

## Acceptatiecriteria

1. Relatie-inzicht heeft geen eigen verticale scrollbar.
2. Tabellen in relatie-inzicht hebben geen verticale scrollbar.
3. Discogs-resultaten in relatie-inzicht hebben geen verticale scrollbar.
4. Discogs-imagegrid in relatie-inzicht heeft geen verticale scrollbar.
5. Horizontale tabellenscroll blijft werken.
6. Edit-modal blijft intern scrollen.
7. Offcanvas blijft intern scrollen.
8. Trackpad/muis kan vanaf tabel naar onderkant van details bewegen.
9. Alle bestaande ART-012- en ART-013-functies blijven werken.
10. Standalone en Shellstarter embedded mode worden handmatig gevalideerd.

## Vervolg

ART-UI-2 Fase 3 beoordeelt daarna afzonderlijk of de artiestentabel een begrensde verticale scrollcontainer nodig heeft, inclusief sticky header en scrollpositiebehoud. Dit wordt niet in Fase 1/2 geforceerd.
