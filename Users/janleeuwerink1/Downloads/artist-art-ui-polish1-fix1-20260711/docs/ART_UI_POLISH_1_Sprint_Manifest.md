# ART-UI-POLISH-1 — Sprintmanifest

Datum: 2026-07-11

## Sprinttitel

ART-UI-POLISH-1 — Profielfoto-thumbnail en overleden-indicator

## Oplevering in deze ontwerp-/voorbereidingssprint

- Functioneel ontwerp.
- Technisch ontwerp.
- API- en querycontract.
- Performance- en toegankelijkheidsregels.
- 48 genummerde functionele testcases.
- Automatiseringsmapping naar backendcontract-, component- en Chromium Playwrighttests.
- Handmatig acceptatierunbook.
- Backlog-, projectnotities- en README-update.

## Niet in deze oplevering

- Productiecode voor thumbnail of indicator.
- Backendquerywijziging.
- Frontendcomponent.
- Nieuwe automatische testscripts.
- Databasewijziging.

Deze onderdelen worden uitgevoerd in de aansluitende codesprint op basis van dit ontwerp.

## Besluiten

- Alleen de primary image wordt in de lijst gebruikt.
- Backend levert maximaal één `primary_image_url`.
- Geen frontendselectie uit een image-array.
- Geen N+1-query of API-request per rij.
- Thumbnail is 28–32 px en mag rijhoogte niet vergroten.
- Defecte of ontbrekende images tonen een lokale fallback.
- Overledenstatus wordt afgeleid van `ar_artist_passing`; geen nieuw veld.
- Icoon: `bi-hourglass-bottom`.
- Toegankelijke tekst: `Artiest overleden`.
- Geen nieuwe klikactie of image-modal.
- Na wijzigen van primary image wordt de artiestenlijst direct ververst en blijft selectie behouden.

## Volgende backlogvolgorde

1. ART-UI-POLISH-1 code implementeren en accepteren.
2. ART-012D-4 volledig functioneel valideren en hardenen.
3. ART-013B musician-in-band relatieverrijking.
4. Lokale biografie ontwerpen.
5. ART-014 album-, release- en trackmodel.
