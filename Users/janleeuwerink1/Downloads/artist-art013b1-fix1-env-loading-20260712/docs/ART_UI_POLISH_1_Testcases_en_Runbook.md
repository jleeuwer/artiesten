# ART-UI-POLISH-1 — Functionele testcases en automatiseringsbasis

Datum: 2026-07-11  
Status: bijgewerkt na implementatie; 48 functionele scenario’s blijven traceerbaar naar automatische en handmatige tests

## 1. Doel

Dit document beschrijft de functionele acceptatietests voor profielfoto-thumbnails en de overleden-indicator in de artiestenlijst. Iedere testcase heeft een stabiele ID zodat deze later één-op-één kan worden gekoppeld aan contract-, component- of Playwrighttests.

## 2. Testlagen

| Laag | Doel |
|---|---|
| Backend contracttest | SQL/query- en API-responsecontract bewaken. |
| Frontend componenttest | Rendering, fallback, aria en lokale state testen. |
| Playwright Chromium | Volledige gebruikersflow en visuele tabelinteractie testen. |
| Handmatige acceptatie | Layout, tooltip en externe imagegedrag aanvullend beoordelen. |
| Packagingtest | Releasehygiëne bewaken. |

## 3. Testdata

Minimaal benodigde scenario-artiesten:

- **A1:** levende artiest met exact één primaire image;
- **A2:** overleden artiest met exact één primaire image;
- **A3:** levende artiest zonder images;
- **A4:** overleden artiest zonder images;
- **A5:** artiest met primaire image waarvan URL niet laadt;
- **A6:** artiest met meerdere images, waarvan exact één primary;
- **A7:** artiest waarvan tijdens test een andere image primary wordt;
- **A8:** artiest met lege/stringachtige passing-waarde voor compatibiliteitstest;
- **A9:** artiest met lange naam voor responsive/layouttest;
- **A10:** historisch inconsistente testfixture met meer dan één primary, uitsluitend in geïsoleerde querytest.

Productiedata mag niet voor muterende geautomatiseerde tests worden aangepast. Gebruik testfixtures, mocks of transactionele testdata.

## 4. Functionele testcases

### 4.1 Backend en API

#### UI-P1-TC-001 — Primaire image in lijstresponse

**Gegeven** A1 heeft één primary image.  
**Wanneer** de artiestenlijst wordt opgehaald.  
**Dan** bevat A1 `primary_image_url` met exact de URL van die image.

Automatisering: backend contracttest.

#### UI-P1-TC-002 — Geen primary image

**Gegeven** A3 heeft geen images.  
**Wanneer** de lijst wordt opgehaald.  
**Dan** is `primary_image_url` `null` of afwezig volgens het definitieve contract, zonder queryfout.

Automatisering: backend contracttest.

#### UI-P1-TC-003 — Niet-primaire images worden genegeerd

**Gegeven** een artiest heeft meerdere images maar geen daarvan is primary.  
**Wanneer** de lijst wordt opgehaald.  
**Dan** wordt geen willekeurige image als thumbnail-URL geleverd.

Automatisering: backend contracttest.

#### UI-P1-TC-004 — Exact één primary uit meerdere images

**Gegeven** A6 heeft meerdere images en exact één primary.  
**Wanneer** de lijst wordt opgehaald.  
**Dan** wordt uitsluitend de primary URL geleverd.

Automatisering: backend contracttest.

#### UI-P1-TC-005 — Historische dubbele primary veroorzaakt geen dubbele artiestenrij

**Gegeven** een geïsoleerde fixture A10 bevat tijdelijk twee primary records.  
**Wanneer** de lijstquery draait.  
**Dan** wordt de artiest exact één keer teruggegeven met deterministisch maximaal één URL.

Automatisering: database-querytest in transactie of querycontracttest.

#### UI-P1-TC-006 — Geen N+1 backendquery

**Gegeven** een lijst met meerdere artiesten.  
**Wanneer** de listmodel-functie wordt uitgevoerd.  
**Dan** wordt image-informatie in dezelfde query-/modelcall verkregen en bestaat geen loop die per artiest een databasecall uitvoert.

Automatisering: statische contracttest plus eventueel query-spy.

#### UI-P1-TC-007 — Bestaande responsevelden blijven behouden

**Wanneer** de lijstresponse is uitgebreid.  
**Dan** blijven artist key, naam, type, passing, favoriet, Discogs-link en bestaande tellers beschikbaar onder dezelfde veldnamen.

Automatisering: backend regressiecontracttest.

#### UI-P1-TC-008 — Sortering blijft server-side correct

**Wanneer** bestaande sorteeropties worden gebruikt.  
**Dan** beïnvloedt de image-join de volgorde of het aantal artiesten niet.

Automatisering: backend integratie-/contracttest.

#### UI-P1-TC-009 — Paginering blijft stabiel

**Gegeven** paginering of limit/offset wordt gebruikt.  
**Wanneer** image-data wordt toegevoegd.  
**Dan** blijven page size, total count en unieke artiesten correct.

Automatisering: backend contracttest.

### 4.2 Thumbnailcomponent

#### UI-P1-TC-010 — Geldige thumbnail renderen

**Gegeven** A1 heeft een geldige URL.  
**Wanneer** de rij wordt gerenderd.  
**Dan** staat er één `<img>` met de URL, vaste dimensies en lazy loading.

Automatisering: frontend componenttest.

#### UI-P1-TC-011 — Alttekst bevat artiestnaam

**Gegeven** A1.  
**Dan** bevat de thumbnail een betekenisvolle toegankelijke naam met de artiestnaam.

Automatisering: componenttest.

#### UI-P1-TC-012 — Geen URL toont fallback

**Gegeven** A3 heeft `primary_image_url=null`.  
**Dan** wordt de fallback-avatar getoond en geen leeg of kapot `<img>`-element.

Automatisering: componenttest.

#### UI-P1-TC-013 — Image-loadfout toont fallback

**Gegeven** A5 heeft een defecte URL.  
**Wanneer** het image error-event optreedt.  
**Dan** verdwijnt de defecte image en verschijnt de fallback zonder exception.

Automatisering: componenttest en Playwright route-abort/404.

#### UI-P1-TC-014 — Geen oneindige errorloop

**Gegeven** de primaire URL faalt.  
**Dan** probeert het component niet onbeperkt dezelfde defecte URL opnieuw te laden.

Automatisering: componenttest met event-/rendercount.

#### UI-P1-TC-015 — Nieuwe URL reset eerdere errorstate

**Gegeven** een oude image faalde.  
**Wanneer** dezelfde componentinstantie een nieuwe geldige `imageUrl` ontvangt.  
**Dan** wordt de nieuwe image opnieuw geprobeerd en correct getoond.

Automatisering: componenttest.

#### UI-P1-TC-016 — Vaste afmetingen vóór laden

**Wanneer** de externe image nog laadt.  
**Dan** heeft de visual al vaste breedte en hoogte en ontstaat geen layout shift in de rij.

Automatisering: component/style contracttest en Playwright bounding box.

#### UI-P1-TC-017 — Object-fit voorkomt vervorming

**Gegeven** een brede of hoge bronafbeelding.  
**Dan** blijft de avatarbox vast en wordt de afbeelding met `object-fit: cover` weergegeven.

Automatisering: CSS contracttest; handmatige visuele controle.

### 4.3 Overleden-indicator

#### UI-P1-TC-018 — Overleden artiest toont indicator

**Gegeven** A2 heeft `ar_artist_passing` gevuld.  
**Dan** wordt `bi-hourglass-bottom` getoond.

Automatisering: componenttest en Playwright.

#### UI-P1-TC-019 — Levende artiest toont geen indicator

**Gegeven** A1 heeft geen passingdatum.  
**Dan** ontbreekt de overleden-indicator.

Automatisering: componenttest.

#### UI-P1-TC-020 — Null en lege waarde worden gelijk behandeld

**Gegeven** passing is `null`, `undefined` of lege tekst.  
**Dan** wordt geen indicator getoond.

Automatisering: parametrische componenttest.

#### UI-P1-TC-021 — Tooltiptekst correct

**Gegeven** A2.  
**Wanneer** gebruiker over de indicator beweegt of focust.  
**Dan** luidt de tekst `Artiest overleden`.

Automatisering: Playwright; componentcontract voor title/overlay props.

#### UI-P1-TC-022 — Screenreadernaam aanwezig

**Gegeven** A2.  
**Dan** is de status via `aria-label` of verborgen tekst beschikbaar zonder afhankelijkheid van de tooltip.

Automatisering: componenttest met accessible query.

#### UI-P1-TC-023 — Sterfdatum blijft zichtbaar

**Gegeven** de huidige tabel toont passingdatum.  
**Dan** verwijdert of vervangt de nieuwe indicator deze datum niet.

Automatisering: component-/Playwrightregressie.

### 4.4 Lijstgedrag en refresh

#### UI-P1-TC-024 — Nieuwe primary image direct zichtbaar

**Gegeven** A7 is geselecteerd en heeft image X als primary.  
**Wanneer** gebruiker image Y als primary kiest en de mutatie slaagt.  
**Dan** toont de tabel zonder volledige browserrefresh image Y.

Automatisering: Playwright met gemockte of test-API.

#### UI-P1-TC-025 — Selectie blijft behouden na list refresh

**Wanneer** de lijst na primary-image-mutatie wordt ververst.  
**Dan** blijft de huidige artiest geselecteerd en blijft het detailpaneel bruikbaar.

Automatisering: Playwright.

#### UI-P1-TC-026 — Mislukte primary-mutatie verandert thumbnail niet

**Wanneer** de primary-image API-call faalt.  
**Dan** blijft de oude thumbnail zichtbaar en krijgt de gebruiker de bestaande foutfeedback.

Automatisering: Playwright/API mock.

#### UI-P1-TC-027 — Zoeken blijft werken

**Wanneer** gebruiker zoekt op artiestnaam.  
**Dan** blijft de juiste resultatenlijst met thumbnails/fallbacks zichtbaar.

Automatisering: Playwright.

#### UI-P1-TC-028 — Filter favorieten blijft werken

**Wanneer** `Alleen favorieten` wordt geactiveerd.  
**Dan** blijven thumbnail en overledenstatus correct per gefilterde rij.

Automatisering: Playwright.

#### UI-P1-TC-029 — Sorteren blijft werken

**Wanneer** gebruiker iedere bestaande sorteeroptie gebruikt.  
**Dan** blijft iedere visual aan de juiste artiest gekoppeld.

Automatisering: Playwright en backendcontract.

#### UI-P1-TC-030 — Pagineren wisselt visuals correct

**Wanneer** gebruiker tussen pagina’s navigeert.  
**Dan** verschijnen alleen visuals van de artiesten op de actuele pagina.

Automatisering: Playwright indien paginering aanwezig is; anders toekomstige test markeren.

#### UI-P1-TC-031 — Bestaande rijselectie blijft werken

**Wanneer** gebruiker op naam, thumbnail of vrije ruimte in de rij klikt volgens bestaand gedrag.  
**Dan** wordt dezelfde artistselectie uitgevoerd en ontstaan geen dubbele events.

Automatisering: componenttest en Playwright.

#### UI-P1-TC-032 — Favorietactie blijft werken

**Wanneer** gebruiker de steractie gebruikt.  
**Dan** verandert favorietstatus zonder dat thumbnail of overleden-indicator verdwijnt of verwisselt.

Automatisering: Playwright.

#### UI-P1-TC-033 — Discogs-linkindicator blijft werken

**Gegeven** een gekoppelde artiest.  
**Dan** blijft het bestaande linkicoon zichtbaar en functioneel naast de nieuwe visuals.

Automatisering: component-/Playwrightregressie.

#### UI-P1-TC-034 — Editactie blijft werken

**Wanneer** gebruiker een artiest opent voor bewerken.  
**Dan** opent dezelfde editflow en worden geen klik-events door de thumbnail onderschept.

Automatisering: Playwright.

### 4.5 Layout, responsive en embedded

#### UI-P1-TC-035 — Rijhoogte neemt niet toe

**Gegeven** een rij vóór en na de uitbreiding.  
**Dan** blijft de hoogte binnen de afgesproken tolerantie en wordt niet bepaald door de natuurlijke imagehoogte.

Automatisering: Playwright bounding-box assertion; handmatige controle.

#### UI-P1-TC-036 — Alle rijen blijven gelijk hoog

**Gegeven** een mix van geldige image, fallback en defecte image.  
**Dan** hebben de rijen dezelfde compacte hoogte.

Automatisering: Playwright.

#### UI-P1-TC-037 — Lange artiestnaam veroorzaakt geen vervorming

**Gegeven** A9 met lange naam.  
**Dan** blijven avatar en indicator vaste afmetingen houden en volgt tekst bestaande truncatie/wrappingregels.

Automatisering: Playwright responsive.

#### UI-P1-TC-038 — Standalone desktopweergave

**Wanneer** app standalone op normale desktopbreedte draait.  
**Dan** zijn thumbnail, indicator en bestaande kolommen correct uitgelijnd.

Automatisering: Playwright Chromium.

#### UI-P1-TC-039 — Embedded Shellstarter-weergave

**Wanneer** app met `embeddedInShell=1` wordt geopend.  
**Dan** ontstaat geen nieuwe horizontale of verticale layoutregressie.

Automatisering: Playwright embedded mode.

#### UI-P1-TC-040 — Smalle viewport

**Wanneer** viewport wordt verkleind tot de onderste ondersteunde breedte.  
**Dan** blijven visuals zichtbaar, niet geplet en zonder overlap met rijacties.

Automatisering: Playwright viewporttest.

#### UI-P1-TC-041 — Geen globale CSS-regressie

**Dan** beïnvloeden nieuwe styles geen images, tabellen of modals buiten de artiestenlijst.

Automatisering: statische CSS-contracttest en gerichte Playwrightregressie.

### 4.6 Performance en netwerk

#### UI-P1-TC-042 — Geen image-API-request per rij

**Wanneer** een pagina met meerdere artiesten laadt.  
**Dan** worden geen interne API-calls voor images per artiest uitgevoerd.

Automatisering: Playwright requestlog/assertion.

#### UI-P1-TC-043 — Lazy loading aanwezig

**Dan** hebben externe thumbnail-images `loading="lazy"`.

Automatisering: componentcontracttest.

#### UI-P1-TC-044 — Externe imagefout blokkeert lijst niet

**Wanneer** één of meer externe hosts traag zijn of fouten geven.  
**Dan** blijven lijst, filters en acties bruikbaar.

Automatisering: Playwright route delay/abort.

#### UI-P1-TC-045 — Artistenaantal blijft gelijk

**Wanneer** dezelfde dataset voor en na de querywijziging wordt opgehaald.  
**Dan** verandert het aantal artiesten niet door image-joins.

Automatisering: backend integratietest.

### 4.7 Packaging en documentatie

#### UI-P1-TC-046 — Documentatie aanwezig

De release bevat minimaal:

- functioneel/technisch ontwerp;
- testcase-/runbookdocument;
- bijgewerkte backlog;
- bijgewerkte projectnotities;
- release notes.

Automatisering: packaging-/documentation contracttest.

#### UI-P1-TC-047 — Release schoon

De ZIP bevat geen:

- `node_modules`;
- `.env`;
- logs;
- `.DS_Store`;
- `__MACOSX`;
- `._*`.

Automatisering: bestaande packagingtest.

#### UI-P1-TC-048 — Productiebuild slaagt

**Wanneer** de codesprint is geïmplementeerd.  
**Dan** slaagt de React-productiebuild.

Automatisering: `npm run build` als onderdeel van `npm run test:all`.

## 5. Gerealiseerde automatische tests

Tijdens deze sprint zijn de volgende automatische contracttests toegevoegd:

```text
tests/artUiPolish1Implementation.contract.test.mjs
tests/artUiPolish1FunctionalCases.contract.test.mjs
```

De bestaande repository bevat nog geen ingerichte React-componenttest- of Playwright-runtime. Daarom worden implementatie, querycontract, CSS, toegankelijkheidsattributen, state-refresh en testcase-traceability nu door Node-contracttests bewaakt. De browsermatige scenario’s blijven in dit document opgenomen als handmatige acceptatiebasis en als uitgangspunt voor een toekomstige Chromium Playwright-suite.

## 6. Gerealiseerde npm-scripts

```json
{
  "test:art-ui-polish1:contract": "node --test tests/artUiPolish1Implementation.contract.test.mjs tests/artUiPolish1FunctionalCases.contract.test.mjs",
  "test:art-ui-polish1": "npm run test:art-ui-polish1:contract"
}
```

`test:unit` neemt `test:art-ui-polish1` mee, waardoor de nieuwe regressies automatisch onderdeel zijn van `npm run test:all`.

## 7. Handmatig acceptatierunbook

1. Start PostgreSQL in Docker.
2. Start backend en frontend volgens README.
3. Open de artiestenlijst standalone.
4. Controleer een mix van levende/overleden artiesten en met/zonder profielimage.
5. Forceer of simuleer een defecte image-URL.
6. Kies voor één artiest een andere primaire Discogs-image.
7. Controleer directe lijstrefresh en behoud van selectie.
8. Test zoeken, favorietenfilter, sortering en rijacties.
9. Open dezelfde app embedded via Shellstarter.
10. Controleer compacte rijhoogte en horizontale uitlijning.
11. Voer de volledige automatische suite uit met logging:

```bash
mkdir -p logs && npm run test:all 2>&1 | tee "logs/art-ui-polish1-test-all-$(date +%Y%m%d-%H%M%S).log"
```

12. Bouw de release en controleer packaging:

```bash
mkdir -p logs && npm run package:zip 2>&1 | tee "logs/art-ui-polish1-package-$(date +%Y%m%d-%H%M%S).log"
```

## 8. Traceability

| Requirement | Testcases |
|---|---|
| Primary thumbnail | TC-001, 004, 010 |
| Fallback | TC-002, 003, 012–015 |
| Overleden-indicator | TC-018–023 |
| Directe refresh | TC-024–026 |
| Geen regressie lijstacties | TC-027–034 |
| Compacte layout | TC-016, 017, 035–041 |
| Geen N+1/per-row request | TC-006, 042, 045 |
| Toegankelijkheid | TC-011, 021, 022 |
| Releasekwaliteit | TC-046–048 |
