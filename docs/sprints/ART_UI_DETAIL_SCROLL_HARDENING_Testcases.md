# Functionele en technische testgevallen

## Functionele testgevallen

| ID | Scenario | Verwacht resultaat |
|---|---|---|
| F-01 | Open een proposal met een lange typeconflictmelding | Melding is maximaal twee regels; actieknoppen blijven horizontaal beschikbaar |
| F-02 | Test proposalmodal op smalle viewport | Tabel/actiecel kan horizontaal scrollen; knoppen stapelen niet ongecontroleerd |
| F-03 | Accepteer een proposal midden in een lange lijst | Geaccepteerde regel mag hersorteren; lijstpositie blijft vrijwel gelijk |
| F-04 | Zet een proposal op Later/Negeer/Heropen | Positie blijft behouden en focus komt terug op een logische actie |
| F-05 | Open artiestdetails | Songs is open; overige detailsecties zijn dicht |
| F-06 | Klap iedere sectie open/dicht met muis | Alleen gekozen sectie verandert; inhoud blijft correct |
| F-07 | Bedien secties met Tab, Enter en Spatie | Toggle is volledig toetsenbordbedienbaar en focus zichtbaar |
| F-08 | Controleer labels | “Songs” en “Alternatieve spellingen” worden weergegeven |
| F-09 | Open/sluit secties diep op de pagina | Pagina springt niet onverwacht naar boven of beneden |
| F-10 | Herhaal in Shellstarter embedded mode | Eén verticale scrollowner; geen blijvend doorscrollen |

## Technische testgevallen

| ID | Controle | Verwacht resultaat |
|---|---|---|
| T-01 | Contracttest componentmarkup | `aria-expanded`, `aria-controls` en unieke panel-id aanwezig |
| T-02 | Contracttest labels | Oude headings ontbreken, nieuwe headings aanwezig |
| T-03 | Contracttest CSS actiezone | `flex-wrap: nowrap`, `min-width: max-content` en begrensde tekst aanwezig |
| T-04 | Contracttest scrollherstel | Proposal-key en `scrollTop` worden voor mutatie vastgelegd |
| T-05 | Contracttest focusherstel | `focus({preventScroll:true})` wordt toegepast |
| T-06 | Contracttest scrollownership | `overscroll-behavior: contain` en `overflow-anchor: none` aanwezig |
| T-07 | Productiebuild | Vite-build slaagt zonder JSX- of CSS-fouten |
| T-08 | Regressie | ART-UI-2 en ART-013B-2 bestaande contracttests blijven slagen |

## Database- en deploymentscripts

### TC-DB-01 — Preflight met draaiende PostgreSQL-container
**Voorwaarde:** Docker draait en de ingestelde PostgreSQL-container is actief.  
**Actie:** voer `npm run db:preflight:art-ui-detail-scroll` uit.  
**Verwacht:** database en gebruiker worden getoond, de bestaande `artist`-tabel is bereikbaar en het script eindigt met exitcode 0.

### TC-DB-02 — Preflight bij ontbrekende container
**Voorwaarde:** `DB_CONTAINER` verwijst naar een niet-bestaande container.  
**Actie:** voer de preflight uit.  
**Verwacht:** duidelijke foutmelding met de containernaam en exitcode ongelijk aan 0.

### TC-DB-03 — No-op migratie
**Actie:** voer `npm run db:migrate:art-ui-detail-scroll` uit.  
**Verwacht:** de preflight slaagt en het script meldt expliciet dat geen databaseobjecten zijn gewijzigd.

### TC-DB-04 — Verify
**Actie:** voer `npm run db:verify:art-ui-detail-scroll` uit.  
**Verwacht:** databasebereikbaarheid wordt opnieuw gecontroleerd en verify eindigt met exitcode 0.

### TC-DB-05 — Geen schemawijzigingen
**Actie:** vergelijk het schema vóór en na de no-op migratie.  
**Verwacht:** geen tabellen, kolommen, constraints of indexen zijn toegevoegd, gewijzigd of verwijderd.
