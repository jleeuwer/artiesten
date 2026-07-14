# Artiesten-app Backlog

Laatste bijgewerkt: 2026-07-11

## Status

De Artiesten-app is een zelfstandige React/Express/PostgreSQL-app die ook embedded binnen Shellstarter kan draaien. De huidige werkende basis bevat de BL-044 Sprint 4 hardening voor embedded spacing, shell theme contract, trash/restore en hard delete beveiliging. Sprint 5 heeft de release-hygiëne, env-template, README, centrale backlog en projectnotities hersteld.

Sprint 6 is nu functioneel en technisch uitgewerkt als requirements-/ontwerpsprint voor artiestgewicht, favorieten, relatie-inzicht en voorbereiding op artist merge, Discogs artist enrichment, muzikant/band/album-relaties en albums in `musicdb`.

## Gereed

- Standalone Express-server met API onder `/api`.
- React-client build naar `public/app`.
- Shellstarter embedded mode via query/context en postMessage-contract.
- Theme-contract ondersteuning via shell context, query en localStorage.
- Artist CRUD basisflow.
- Trash-flow met soft delete en restore.
- Hard delete route vóór generieke delete-route geplaatst.
- Hard delete blokkeert artiesten die nog door `file_details` worden gebruikt.
- Hard delete ruimt gekoppelde `artiesten_spelling` records op voordat de artiest definitief wordt verwijderd.
- Contracttests voor controller, routes, hard delete, embedded spacing, modal layout, shell bridge en theme contract.
- Packaging-hygiëne aangescherpt: `.env` hoort niet in release-ZIP; `.env.example` is de enige officiële env-template en is gevuld.
- Sprint 6 documentatie toegevoegd:
  - `docs/ART_Sprint6_Artiesten_Relatieinzicht_Functioneel_Technisch_Ontwerp.md`
  - `docs/ART_Sprint6_Testcases_en_Runbook.md`

## Werkafspraken vanaf Sprint 6

- Requirements worden per sprint eerst in dialoog aangescherpt.
- Grote datamodelkeuzes worden niet impliciet in een code-sprint meegenomen.
- Artiest-relaties moeten vooruitkijken naar albums, Discogs, muzikanten, bands en aliases.
- Albums worden nog niet gebouwd in Sprint 6, maar schermen en API's moeten later uitbreidbaar zijn.
- Ontdubbelen/samenvoegen van artiesten wordt als aparte functionele flow behandeld vanwege databasebrede impact.

## Open backlog

### ART-001 — Release packaging structureel schoon houden

**Prioriteit:** hoog  
**Status:** opgepakt in Sprint 5, blijven bewaken

Release-ZIP's mogen geen lokale of gegenereerde bestanden bevatten die de gebruiker kunnen verwarren of lokale configuratie kunnen lekken.

Acceptatiecriteria:

- Geen `node_modules` of `client/node_modules`.
- Geen `.git` directory.
- Geen `.env`.
- Geen logs zoals `logs/*.log`.
- Geen `.DS_Store` of `__MACOSX`.
- Wel `.env.example`.
- Wel documentatie, tests en scripts.

### ART-002 — README als volledige startpagina/runbook onderhouden

**Prioriteit:** hoog  
**Status:** opgepakt in Sprint 5, blijven bijwerken

De README moet voldoende zijn om de app lokaal te installeren, configureren, testen, bouwen en starten.

### ART-003 — Centrale projectnotities bijhouden

**Prioriteit:** middel  
**Status:** opgepakt in Sprint 5, blijven bijwerken

Leg technische keuzes, bekende randvoorwaarden en release-afspraken vast in `docs/PROJECT_NOTES.md`.

### ART-004 — Dependency-versies harmoniseren

**Prioriteit:** middel

Onderzoek of Vite en `@vitejs/plugin-react` in root `package.json` nog nodig zijn, omdat de client-build via `client/package.json` loopt. Harmoniseer of documenteer bewust verschil tussen root- en client-devdependencies.

Acceptatiecriteria:

- Geen verwarring over welke package.json leidend is voor de client-build.
- `npm run build` blijft werken.
- `npm run test:all` blijft werken.

### ART-008 — Artiesten relatie-inzicht, gewicht en sortering

**Prioriteit:** hoog  
**Status:** functioneel/technisch uitgewerkt in Sprint 6, code nog te bouwen

Toon bij artiesten relationeel inzicht en berekende belangrijkheid op basis van gekoppelde data.

Scope:

- bereken `artist_weight` op basis van gekoppelde `file_details`;
- toon aantallen in de artiestenlijst;
- sorteer op artiestnaam en gewicht;
- toon read-only relatiepaneel onderaan;
- toon gekoppelde `file_details` records;
- toon gekoppelde artiestenspellingen;
- toon hitlijsten waarin de artiest voorkomt;
- ontwerp uitbreidbaar voor Albums, Discogs en Relaties.

Aanbevolen defaultsortering:

```text
favorieten eerst → hoogste gewicht → artiestnaam A-Z
```

### ART-009 — Artiesten spelling inzicht en positionering

**Prioriteit:** middel  
**Status:** functioneel aangescherpt in Sprint 6

Bepaal of beheer van `artiesten_spelling` onderdeel moet worden van de Artiesten-app of in Coretables blijft. Voor Sprint 6 is het uitgangspunt read-only tonen.

Scope eerste stap:

- toon alle gekoppelde alternatieve spellingen in het relatiepaneel;
- geen editfunctie in Sprint 6;
- later bepalen of mutaties in Artiesten-app wenselijk zijn.

### ART-011 — Favoriete artiesten

**Prioriteit:** hoog  
**Status:** functioneel/technisch uitgewerkt in Sprint 6, code nog te bouwen

Gebruikers willen artiesten als favoriet kunnen markeren en daarop filteren.

Scope:

- favoriet markeren via ster-icoon;
- favoriet verwijderen;
- filter “alleen favorieten”;
- sortering met favorieten eerst;
- bepalen of favoriet algemeen is of later user-specifiek via Shellstarter.

Eerste ontwerpkeuze:

```text
Favoriet is voorlopig een algemene markering op artist-niveau.
```

### ART-012 — Discogs artist enrichment

**Prioriteit:** middel/later  
**Status:** nieuw backlog-item

De Artiesten-app moet later Discogs-gegevens van artiesten kunnen ophalen en koppelen.

Scope later:

- Discogs artist zoeken;
- kandidaat-artiesten tonen;
- Discogs artist detail inspecteren;
- gekozen Discogs artist koppelen aan lokale artist;
- evalueren welke Discogs-data structureel wordt opgeslagen.

Mogelijke data:

- Discogs artist ID;
- Discogs artist URL;
- Discogs naam;
- real name;
- profile/biografie;
- aliases;
- name variations;
- members/groups;
- images;
- sync timestamp.

### ART-013 — Muzikant / artiest / band / album relaties

**Prioriteit:** middel/later  
**Status:** nieuw episch backlog-item

De app moet op termijn relaties kunnen modelleren tussen solo-artiesten, muzikanten/zangers/zangeressen, bands/groepen, aliases/projecten en albums.

Uitgangspunten:

- een artiest kan solo zijn;
- een artiest kan een band/groep zijn;
- een persoon kan muzikant/zanger/zangeres zijn;
- een persoon kan in één of meerdere bands zitten;
- albums moeten expliciet worden meegenomen in het ontwerp;
- nog niet bouwen voordat het datamodel is uitgewerkt.

Te onderzoeken:

- blijft `artist` de centrale entiteit met een type?
- komt er een aparte `person`/`musician`-tabel?
- hoe modelleren we bandlidmaatschap met rol en periode?
- hoe koppelen albums aan artiesten, bands, tracks en file_details?

### ART-014 — Albums in musicdb functioneel uitwerken

**Prioriteit:** middel/later  
**Status:** nieuw backlog-item

Albums ontbreken nog als uitgewerkt concept in `musicdb`, maar toekomstige artiestrelaties moeten hierop voorsorteren.

Scope ontwerp:

- albumtabellen bepalen;
- relatie met Discogs release/master bepalen;
- koppeling album ↔ tracks ↔ file_details bepalen;
- compilaties ondersteunen;
- meerdere artiesten per album ondersteunen;
- trackvolgorde opslaan;
- albumjaar, releasejaar, label, land en catalogusnummer onderzoeken.

### ART-015 — Artiesten ontdubbelen / samenvoegen

**Prioriteit:** hoog/middel  
**Status:** nieuw backlog-item, aparte ontwerpsprint aanbevolen

Dubbele artiesten moeten veilig kunnen worden samengevoegd.

Functionele flow:

1. Gebruiker kiest de redundante/dubbele artiest.
2. Gebruiker kiest de vervangende/canonical artiest.
3. Het systeem zoekt alle databaseverwijzingen naar de redundante `artist_key`.
4. Het systeem toont een impactoverzicht met minimaal tabelnaam, kolomnaam en aantal records.
5. Waar zinvol toont het systeem korte extracties uit geraakte tabellen.
6. Na expliciet akkoord vervangt het systeem de redundante `artist_key` door de vervangende `artist_key`.
7. Het systeem legt audit/history vast.
8. De redundante artiest wordt veilig afgehandeld, bij voorkeur gemarkeerd als merged of soft deleted in plaats van direct hard deleted.

Nog uit te werken:

- welke tabellen/kolommen zijn in scope?
- welke extractievelden per tabel tonen we?
- hoe gaan we om met unieke constraints op `artiesten_spelling`?
- hoe gaan we om met Discogs-data?
- hoe werkt merge straks met albums, bands, muzikanten en artist relationships?

## Voorgestelde volgorde

### Eerstvolgende code-sprint

**ART Sprint 6 implementatie — Relatie-inzicht, gewicht en favorieten**

Scope:

1. `artist_weight` en aantallen toevoegen aan artiestenlijst.
2. Sortering op gewicht/naam/favorieten toevoegen.
3. Favorieten toevoegen.
4. Read-only relatiepaneel toevoegen met file_details, spellingen en hitlijsten.
5. Tests en documentatie bijwerken.
6. Schone release-ZIP opleveren.

### Daarna

1. **ART Sprint 7 ontwerp — Artiesten ontdubbelen / samenvoegen**
2. **ART Sprint 8 implementatie — Merge impactscan + veilige transactie**
3. **ART Sprint 9 ontwerp — Discogs artist enrichment**
4. **ART Sprint 10 ontwerp — Muzikant/band/album datamodel**

## Sprint 6 implementatiestatus

**ART Sprint 6 implementatie — Relatie-inzicht, gewicht en favorieten** is uitgewerkt naar concrete code.

Gerealiseerd:

- `artist_weight` op basis van gekoppelde `file_details` records;
- `hitlijst_count` en `spelling_count` in de artiestenlijst;
- sortering op favorieten/gewicht/naam;
- favoriet markeren en verwijderen;
- filter alleen favorieten;
- read-only relatiepaneel met `file_details`, `artiesten_spelling` en hitlijsten;
- migratie `scripts/sql/20260519_artists_sprint6_favorites.sql`;
- API endpoints `GET /api/artists/:id/relations` en `PATCH /api/artists/:id/favorite`;
- automatische contracttests voor Sprint 6 implementatie.

Open vervolgitems blijven:

1. ART-015 ontwerp — Artiesten ontdubbelen / samenvoegen.
2. ART-012 ontwerp — Discogs artist enrichment.
3. ART-013/ART-014 ontwerp — muzikant/band/album datamodel en albums in `musicdb`.

## ART-016 — Sprint 6 packaging/migratie testfix — Afgehandeld

Aanleiding: `tests/packaging.contract.test.mjs` faalde lokaal door inconsistente env-template bestanden. Daarnaast sloot het eerder gedocumenteerde lokale `psql "$DATABASE_URL"` voorbeeld niet aan op de gebruikelijke Docker PostgreSQL configuratie.

Oplossing:

- `.env.example` gevuld als enige officiële veilige voorbeeldconfiguratie.
- Docker migratiehulpvariabelen toegevoegd: `ARTIST_DB_CONTAINER`, `ARTIST_DB_USER`, `ARTIST_DB_NAME`.
- `scripts/db-migrate-sprint6-docker.sh` toegevoegd.
- `npm run db:migrate:sprint6` toegevoegd.
- README, runbook en release notes aangepast naar Docker-first migratie-instructies.
- Packaging-contracttest uitgebreid zodat deze regressie voortaan wordt afgevangen.

## ART-016 — Sprint 6 Fix: unieke-titelgewicht en relatiepaneel UX — Afgehandeld

Aanleiding:

- Het oorspronkelijke gewicht telde `file_details` records, waardoor meerdere versies van hetzelfde liedje het gewicht kunstmatig verhoogden.
- Na selectie van een artiest was onvoldoende zichtbaar dat onderaan de tabel extra relatie-informatie beschikbaar was.
- De gebruiker wil hetzelfde read-only relatie-inzicht ook compact terugzien in het edit-scherm.

Oplossing:

- `artist_weight` telt nu unieke titels via `count(distinct lower(trim(fd_tag_title)))`.
- Records met `fd_action = Delete` tellen niet mee voor gewicht, versieaantal en hitlijstaggregaties.
- `version_count` toont het aantal niet-verwijderde gekoppelde `file_details` records/versies.
- Na selectie scrollt/focust de UI naar het relatiepaneel.
- Het relatiepaneel bevat de knop `Terug naar artiestenlijst`.
- Het edit-scherm toont compacte read-only infopanelen voor `file_details`, `artiesten_spelling` en hitlijsten.
- Bewerken blijft bewust buiten deze panelen; gebruikers gaan via Shellstarter naar de betreffende beheerapp.


### ART-016-Fix-2 — Env-template standaardiseren

**Prioriteit:** hoog  
**Status:** gerealiseerd in Sprint 6 fix-release

De Artiesten-app gebruikt nog maar één officiële env-template: `.env.example`.

Besluit:

- `.env.example` is de enige bron voor voorbeeldconfiguratie.
- `.sample.env` en `.env.sample` worden niet meer gebruikt in release, tests of documentatie.
- `.env` blijft lokaal en wordt uitgesloten van release-ZIP's.
- README en runbook gebruiken alleen `cp .env.example .env`.

Acceptatiecriteria:

- `tests/packaging.contract.test.mjs` vereist alleen `.env.example`.
- `.env.example` is niet leeg.
- `.env.example` bevat minimaal `PORT=3012`, `DATABASE_URL`, `ARTIST_DB_CONTAINER`, `ARTIST_DB_USER` en `ARTIST_DB_NAME`.
- Release packaging sluit `.sample.env` en `.env.sample` expliciet uit.

## ART-015A — Artiesten ontdubbelen / samenvoegen: functioneel en technisch ontwerp

**Prioriteit:** hoog/middel  
**Status:** uitgewerkt als ontwerp-/documentatiesprint

ART-015A werkt de requirements uit voor veilig samenvoegen van dubbele artiesten. De merge zelf wordt nog niet gebouwd in deze sprint.

Belangrijkste ontwerpbesluiten:

- Fuzzy matching wordt gebruikt voor duplicate candidate discovery, niet voor automatische merge.
- De gebruiker kiest altijd zelf de redundante artiest en de vervangende/canonical artiest.
- De uiteindelijke mergeflow is centraal en gelijk voor alle kandidaatbronnen:
  - redundante artiest kiezen;
  - vervangende artiest kiezen;
  - impactscan;
  - conflictcontrole;
  - expliciet akkoord;
  - transactie;
  - audit/history.
- Er worden twee candidate discovery varianten ontworpen:
  1. periodieke onderhoudsfunctie, bijvoorbeeld Python, die kandidaten klaarzet in staging-/reviewtabellen;
  2. geïntegreerde ondersteuning in de Artiesten-app met fuzzy search en impactscan.
- Eerste implementatieadvies: start met de geïntegreerde Artiesten-app variant en bouw daarna pas de periodieke onderhoudsfunctie.
- De onderhoudsvariant gebruikt op termijn dezelfde impactscan, merge API en audit/history als de geïntegreerde variant.
- De impactscan toont minimaal verwijzingen in `file_details.fd_artist_key` en `artiesten_spelling.as_artist_key`.
- Het ontwerp sorteert voor op toekomstige albums, Discogs artist-data en muzikant/band/artist relationships.
- Redundante artiesten worden niet automatisch hard deleted; markeren als merged of soft delete heeft de voorkeur.

Documentatie:

- `docs/ART_015A_Artiesten_Ontdubbelen_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_015A_Testcases_en_Runbook.md`

Vervolgitems:

1. **ART-015B — Interactieve duplicate search + impactscan implementeren**
2. **ART-015C — Merge uitvoeren met transactie en audit**
3. **ART-015D — Periodieke duplicate scanner/staging**

## ART-015B — Interactieve duplicate search + impactscan — gerealiseerd in deze release

Status: implemented / read-only.

Functionele inhoud:

- Gebruiker selecteert een artiest in de Artiesten-app.
- Gebruiker kan vanuit het relatiepaneel **Zoek mogelijke dubbelen** uitvoeren.
- Fuzzy matching zoekt kandidaten op basis van artiestnaam en artiestenspellingen.
- Kandidaten tonen score, matchreden en gematchte waarden.
- Gebruiker kan een read-only impactscan openen voor beide richtingen:
  - deze artiest vervangen door kandidaat;
  - kandidaat vervangen door deze artiest.
- Impactscan toont minimaal:
  - `file_details.fd_artist_key`;
  - `artiesten_spelling.as_artist_key`;
  - aantallen, voorbeeldrecords en waarschuwingen.

Bewust niet gedaan:

- geen merge-uitvoering;
- geen muterende artist-key updates;
- geen audit/history writes;
- geen Python maintenance scanner/staging.

## ART-015C — Artiesten merge uitvoeren met transactie en audit

Status: next logical sprint.

Uit te werken/bouwen:

- expliciete bevestiging na impactscan;
- transactionele update van bekende artist-key verwijzingen;
- conflictregels voor `artiesten_spelling`;
- favoriet-status overname-regel;
- `artist_merge_history` of vergelijkbare audit/history;
- markeren van redundante artiest als merged/soft deleted, geen directe hard delete;
- rollback/foutafhandeling en regressietests.

## ART-015D — Periodieke duplicate maintenance scanner met staging

Status: later.

- Python scanner of onderhoudsprogramma zet mogelijke dubbele artiesten klaar in staging/reviewtabellen.
- Artiesten-app leest deze reviewqueue uit.
- Dezelfde impactscan en mergeflow als ART-015B/ART-015C worden hergebruikt.

## ART-015C — Artiesten merge uitvoeren met transactie, audit en alerts

Status: functioneel/technisch uitgewerkt; nog niet geïmplementeerd als muterende code.

### Doel
Dubbele artiesten veilig samenvoegen door alle afgesproken artist-key verwijzingen binnen één database-transactie te vervangen door de canonical/replacement artist key.

### Besluiten
- De merge is één technische transactie: alles lukt of niets lukt.
- De impactscan wordt vlak vóór uitvoering opnieuw server-side bepaald.
- De merge-scope v1 omvat `file_details`, `artiesten_spelling`, `hitlijsten`, `staging_hitlijsten`, `import_scan_items`, reset/invalidate van `file_details_version_group_validations`, `artist_merge_history`, `admin_audit_log` en `alerts`.
- `file_details.fd_correct_artist` wordt na merge gesynchroniseerd naar de naam van de replacement artist.
- De redundante artiest wordt niet hard deleted, maar gemarkeerd als merged/deleted met `ar_merged_into_artist_key`.
- Shellstarter alerts worden voorbereid via de bestaande `alerts` tabel.
- Mail blijft een ontwerpkeuze voor later totdat het Shellstarter-mailcontract definitief is.
- FK-hardening voor `hitlijsten`, `staging_hitlijsten` en `import_scan_items` wordt voorbereid met orphan-checks en `NOT VALID` constraints.

### Documenten
- `docs/ART_015C_Artiesten_Merge_Transactie_Audit_Alerts_Ontwerp.md`
- `docs/ART_015C_Testcases_en_Runbook.md`

## ART-015B/Packaging hardening — legacy env cleanup

Status: toegevoegd aan release-hardening.

### Besluit
Alleen `.env.example` is officieel. Legacy bestanden `.sample.env` en `.env.sample` worden niet meer gebruikt.

### Script
- `npm run env:cleanup-legacy`

Dit verwijdert lokale legacy env sample files bij uitpakken over een bestaande directory.

---

## ART-015C-1 — Transactionele artist merge implementatie

Status: geïmplementeerd in code-sprint.

Scope:

- `POST /api/artists/merge/execute`.
- Eén database-transactie met `BEGIN` / `COMMIT` / `ROLLBACK`.
- Updates voor `file_details`, `artiesten_spelling`, `hitlijsten`, `staging_hitlijsten`, `import_scan_items`.
- Reset van geraakte `file_details_version_group_validations`.
- Redundante artiest markeren als merged/deleted.
- `artist_merge_history` schrijven.
- `admin_audit_log` schrijven.
- Shellstarter-alert schrijven in `alerts`.

Vervolgitems:

- ART-015C-2: UI-polish, mergegeschiedenis tonen en uitgebreidere conflictcommunicatie.
- Mail/outbox pas aansluiten zodra het Shellstarter-mailcontract is vastgesteld.

## ART-015C-2 — UI hardening merge-richting en favorietenstatus

Status: afgerond in ART-015C-2.

### Requirements

- Vervang het onduidelijke label `Deze vervangen` door **Maak kandidaat leidend**.
- Vervang het onduidelijke label `Kandidaat vervangen` door **Maak deze artiest leidend**.
- Voeg duidelijke title/aria-label teksten toe die aangeven welke artiest redundant wordt en welke artiest leidend blijft.
- Borg de Bootstrap Icons voor favorieten:
  - favoriete artiest: `bi bi-star-fill`
  - niet-favoriete artiest: `bi bi-star`
- Houd `.env.example` als enige officiële env-template en gebruik `npm run env:cleanup-legacy` bij bestaande directories.

## ART-015C-2-Fix-1 — Favorieteniconen zichtbaar maken — Afgerond

Testbevinding: de favorieteniconen waren niet zichtbaar in de artiestenlijst.

Afgerond:

- Favoriet gebruikt `bi bi-star-fill`.
- Niet-favoriet gebruikt `bi bi-star`.
- Toegankelijke labels/tooltips zijn aanwezig.
- CSS-fallback toegevoegd zodat de iconen zichtbaar renderen zonder icon-fontbestanden in de release-ZIP.
- Contracttest aangescherpt op daadwerkelijke JSX-rendering en CSS-fallback.
- Productiebuild opnieuw opgebouwd.

## ART-015C-3 — Mergehistorie en samengevoegde artiesten zichtbaar maken

Status: geïmplementeerd in ART-015C-3.

Scope:

- Samengevoegde artiesten herkenbaar maken met badge **Samengevoegd**.
- Filter toevoegen voor actieve / inclusief samengevoegde / alleen samengevoegde artiesten.
- Relatiepaneel uitbreiden met **Mergehistorie**.
- Knop **Open leidende artiest** tonen bij samengevoegde artiesten.
- Ontdubbelen, Edit en Trash uitschakelen voor samengevoegde artiesten.
- Geen nieuwe SQL-migratie; gebruikt ART-015C-1 merge metadata en `artist_merge_history`.


### ART-015C-3-Fix-1 — Duplicate state reset bij navigatie/selectiewijziging

**Status:** afgerond in fix-release.

Wanneer de gebruiker mogelijke dubbelen zoekt, moet deze context worden gesloten/gereset zodra de gebruiker teruggaat naar de artiestenlijst of een andere artiest selecteert. Dit voorkomt dat een eerder gevonden duplicate-kandidaat zichtbaar blijft bij een andere artiest.

Reset omvat duplicate candidates, impactscan, merge-richting, redenveld, bevestiging, resultaat en meldingen.

## ART-015C-3-Fix-2 — Merge SQL parameter typing en logging

**Status:** afgerond in fix-release.

### Bevinding

Bij het uitvoeren van een artist merge kon PostgreSQL falen met `could not determine data type of parameter $1`.

### Oplossing

- Expliciete SQL-casts toegevoegd aan parameters in merge history, admin audit, alert en notification-status SQL.
- Structured merge logging toegevoegd met `debug`, `info`, `warn` en `error`.
- `LOG_LEVEL` wordt toegepast door de logger.
- Rollback-log bevat de mislukte merge-stap.
- API en frontend tonen veilige foutmelding inclusief merge-stap.


## ART-015C-3-Fix-3 — Mergehistorie artist keys en impactdetails — Afgerond

De mergehistorie en merge-resultaatmelding tonen nu expliciet de redundante artist key, leidende/replacement artist key, merge-id en affected counts. Hierdoor kan de gebruiker na een merge beter controleren wat er precies is aangepast.

### ART-015C-3-Fix-4 — Merge history tabel leesbaarheid — Afgerond

- Extra onderruimte toegevoegd onder de merge-history tabelcontainer zodat de horizontale scrollbar niet over tekst valt.
- Tekstafbreking in merge-history tabelcellen verbeterd.
- Affected counts compact als chips weergegeven.
- Contracttest toegevoegd voor tabel-wrapper, tekstafbreking en chips.

## ART-015D — Periodieke duplicate scanner / onderhoudsvariant

**Status:** functioneel/technisch uitgewerkt in ART-015D design sprint.

### Doel

Een periodiek onderhoudsprogramma spoort mogelijke dubbele artiesten op en zet deze klaar in een reviewbare stagingtabel. De scanner voert zelf geen merge uit; de gebruiker verwerkt candidates via de bestaande impactscan en transactionele mergeflow.

### Belangrijkste requirements

- Python scanner als voorkeursvariant voor periodieke onderhoudsscan.
- Fuzzy matching op `artist.ar_artist_name` en `artiesten_spelling.as_alternatieve_spelling`.
- Persistent stagingmodel:
  - `artist_duplicate_scan_runs`
  - `artist_duplicate_candidates`
- Candidate statusflow:
  - `new`
  - `reviewing`
  - `not_duplicate`
  - `merge_planned`
  - `merged`
  - `ignored`
  - `error`
- Reviewqueue in de Artiesten-app in een vervolgsprint.
- Bestaande ART-015B impactscan en ART-015C merge-service worden hergebruikt.
- Scanner mag nooit automatisch mergen.
- Scheduling voorbereiden voor crontab/OS scheduler/custom Python scheduler.
- Logging naar projectlogdirectory.
- Shellstarter alerts/mail functioneel voorbereiden.

### Voorgestelde vervolgsprints

- **ART-015D-1:** SQL stagingtabellen + Python scanner basis.
- **ART-015D-2:** Reviewqueue in Artiesten-app.
- **ART-015D-3:** Scheduling, alerts/mail en operational hardening.

---

## ART-015D-1 — Periodieke duplicate scanner: stagingtabellen en Python scanner basis

Status: geïmplementeerd in deze release.

Scope:

- SQL stagingtabellen toegevoegd:
  - `artist_duplicate_scan_runs`
  - `artist_duplicate_candidates`
- Docker-proof migratie:
  - `npm run db:migrate:art015d1`
- Python scanner:
  - `scripts/artist_duplicate_scanner.py`
- Wrapper:
  - `npm run scan:duplicates`
- Fuzzy matching op:
  - `artist.ar_artist_name`
  - `artiesten_spelling.as_alternatieve_spelling`
- Dry-run:
  - `npm run scan:duplicates -- --dry-run --verbose`
- Scanner schrijft alleen candidates naar staging/reviewtabellen en voert nooit automatisch een merge uit.

Vervolg:

- ART-015D-2: reviewqueue in de Artiesten-app.
- ART-015D-3: scheduling, alerts/mail hardening en operationele borging.

## ART-015D-2A — Scanner rerun handling + datamodel-hardening — geïmplementeerd

Doel: periodieke duplicate scans kunnen herhaald worden zonder dubbele open review-werkvoorraad.

Opgeleverd:

- `artist_key_low` / `artist_key_high` als volgorde-onafhankelijke pair-key.
- first/last-seen velden en `times_seen` op duplicate candidates.
- scan-run statistieken voor gevonden, nieuw, bijgewerkt en overgeslagen.
- scanner update bestaande open candidates in plaats van nieuwe duplicaten te maken.
- scanner respecteert afgehandelde statussen `not_duplicate`, `ignored` en `merged`.
- Docker-proof migratiescript `npm run db:migrate:art015d2a`.

Vervolg: ART-015D-2B reviewqueue in de Artiesten-app.

## Afgerond — ART-015D-2A-Fix-1 Scanner psql stdin hardening

- `npm run scan:duplicates` faalde bij grote batches met `argument list too long`.
- Scanner voert SQL nu via `psql` stdin uit in plaats van via `psql -c <large sql>`.
- Contracttest toegevoegd: `npm run test:art015d2a:fix1`.

### ART-015D-2A-Fix-2 — Candidate timestamps bij scanner inserts — DONE

- Scanner vult nieuwe candidate timestamps expliciet.
- Lost PostgreSQL NOT NULL fout op `artist_duplicate_candidates.first_seen_at` op.
- Geen nieuwe SQL-migratie nodig.

## ART-015D-2B — Duplicate reviewqueue in de Artiesten-app — uitgevoerd

- Reviewqueue voor `artist_duplicate_candidates` toegevoegd.
- Filters op status, artiestnaam en minimale score.
- Statusacties voor `reviewing`, `not_duplicate` en `ignored`.
- Candidate kan via bestaande impactscan/mergeflow worden samengevoegd.
- Bij merge vanuit reviewqueue wordt `duplicateCandidateId` meegegeven en na succesvolle transactionele merge op `merged` gezet.

Vervolg:
- ART-015D-3: scheduling, Shellstarter alerts/mail en operationele hardening.

## ART-015D-3 — Scanner scheduling, Shellstarter alerts en operationele hardening

Status: functioneel/technisch uitgewerkt.

Doel:
- periodieke duplicate scanner beheerbaar maken;
- handmatige start, crontab en macOS launchd documenteren;
- Shellstarter-alertstrategie vastleggen;
- mailstrategie functioneel voorbereiden;
- operationele logging naar `logs/` borgen;
- `startapp.sh` als uitvoerbaar lokaal start-/validatiescript opnemen.

Uitgangspunten:
- scanner voert nooit automatisch merges uit;
- reviewqueue blijft de plaats waar gebruiker candidates beoordeelt;
- bestaande ART-015C merge-service blijft de enige transactionele merge-route;
- alerts voor scan afgerond, veel candidates, scanfout en oude open werkvoorraad;
- mail pas hard koppelen als Shellstarter mailcontract definitief is.

Vervolgitems:
- ART-015D-3A: scanner-alertbody verrijken en threshold configureerbaar maken;
- ART-015D-3B: concrete crontab/launchd voorbeeldbestanden toevoegen;
- ART-015D-3C: stale reviewqueue signalering;
- ART-015D-3D: Shellstarter mailcontract uitwerken.

## ART-015D-3B — Scheduler scripts en install manual

Status: implemented.

Scope:
- Install manual voor periodieke duplicate scanner scheduling.
- Cron install/uninstall scripts.
- macOS launchd install/uninstall scripts.
- Scheduled wrapper die timestamped logs schrijft naar `logs/`.
- Package scripts voor scheduling.
- Contracttests voor scripts, documentatie en package wiring.

### ART-015D-3B-Fix-1 — Env example refresh voor scanner alertvariabelen

Status: afgerond.

- `.env.example` bevat canonical runtime-, Docker-, scanner- en alertvariabelen.
- `scripts/env-refresh-example.sh` toegevoegd.
- `npm run env:refresh-example` toegevoegd.
- Contracttest toegevoegd om regressie te voorkomen.


### Afgerond — ART-015D-3B-Fix-2 Testscript/env-template hardening

- `test:art015d3b` contracttest robuust gemaakt voor meerdere testbestanden.
- `.env.example` geborgd met scanner- en alertvariabelen.

### ART-015D-3C-Fix-1 — Signalering en env-documentatie hardening — Done

- Borg volledige duplicate-scanner env-set in `.env.example`.
- Documenteer expliciet: alerts zijn geïmplementeerd via `public.alerts`; UI stale-signalering is geïmplementeerd; mail is nog niet technisch gekoppeld.
- Voeg contracttest toe voor env en signaaltabel.

### ART-015D-3D — Shellstarter mailcontract — uitgewerkt

**Status:** functioneel/technisch uitgewerkt als contract-/documentatiesprint.

Besluiten:

- Alerts via `public.alerts` blijven het primaire directe signaalkanaal.
- De Artiesten-app verstuurt geen mail rechtstreeks.
- Shellstarter blijft verantwoordelijk voor ontvangers, daadwerkelijke verzending, retry en delivery-status.
- Voorkeursrichting voor toekomstige implementatie is een notification outbox.
- Mailmomenten zijn vastgelegd voor scanfouten, stale reviewqueue boven drempel en high-impact merges.
- Normale scans en normale merges blijven primair Shellstarter-alerts zonder mail.

Vervolg:

- ART-015D-3D-1: Shellstarter mail/outbox contract in Shellstarter bevestigen.
- ART-015D-3D-2: outbox of Shellstarter API technisch implementeren.
- ART-015D-3D-3: Shellstarter mailprocessor/retry/delivery-status realiseren.

## ART-012 — Discogs artist enrichment

**Prioriteit:** middel  
**Status:** functioneel/technisch uitgewerkt in ART-012A; code nog niet gebouwd

Doel: Discogs artist-data gebruiken om lokale artiestgegevens te verrijken zonder de lokale artist-key te vervangen.

Besluiten:

- `artist.ar_artist_key` blijft de leidende primaire sleutel in `musicdb`.
- Discogs artist ID wordt alleen opgeslagen als externe lookup key en bronreferentie.
- Discogs ID vervangt nooit lokale keys.
- Lokale artistvelden worden niet automatisch overschreven.
- Gebruiker inspecteert Discogs-data en bevestigt koppeling/verrijking expliciet.
- Voorkeursrichting voor datamodel:
  - `artist_external_reference`
  - `artist_enrichment_cache`

Te onderzoeken/bouwen in vervolgsprints:

- ART-012B — Discogs artist search/detail implementatie.
- ART-012C — Discogs artist koppelen en enrichment-cache migratie.
- ART-012D — Verrijkingsvoorstellen en review/accept-flow.
- ART-012E — Discogs-data gebruiken als input voor duplicate scanner.

Mogelijke Discogs-data:

- Discogs artist ID;
- Discogs URL;
- Discogs naam;
- real name;
- profile/biografie;
- aliases;
- name variations;
- groups/member-of;
- members;
- images/URLs;
- raw JSON;
- sync timestamp.

## ART-017 — Externe artist enrichment bronnen

**Prioriteit:** middel/later  
**Status:** nieuw backlog-epic

Doel: naast Discogs ook andere externe bronnen kunnen gebruiken voor artist enrichment, zoals Wikipedia/Wikidata, MusicBrainz en mogelijk andere muziekbronnen.

Uitgangspunt:

- externe bronnen verrijken lokale data;
- lokale `musicdb` blijft leidend;
- brondata wordt niet automatisch als waarheid toegepast;
- gebruiker beoordeelt conflicten en accepteert voorstellen.

Subitems:

- ART-017A — Wikipedia/Wikidata artist enrichment.
- ART-017B — MusicBrainz artist enrichment.
- ART-017C — Bronvergelijking en conflictresolver.


ART-012A-Fix-1: Discogs artist images worden ontwerptechnisch opgeslagen als metadata/URL/cache-referentie, niet als binaire data in PostgreSQL. Het basispad voor lokale image-cache wordt via `ARTIST_IMAGE_CACHE_DIR` in `.env` geconfigureerd; databasepaden blijven relatief.

## ART-012B-Prep — Discogs env-standaardisatie

Status: uitgewerkt in deze release.

Doel: voorkom divergentie tussen Artiesten-app en andere Musicapp-apps zoals Importeren Songs door één standaard voor Discogs-configuratie vast te leggen.

Standaardnamen:

- `DISCOGS_USER_TOKEN`
- `DISCOGS_USER_AGENT`
- `DISCOGS_BASE_URL`
- `DISCOGS_CACHE_TTL_SECONDS`
- `DISCOGS_REQUEST_TIMEOUT_MS`

Legacy/fallback, niet meer als nieuwe standaard gebruiken:

- `DISCOGS_API_TOKEN`
- `DISCOGS_API_BASE_URL`
- `DISCOGS_ENABLED`

Vervolg: ART-012B kan nu Discogs artist search/detail bouwen op basis van `config/discogsConfig.js`.

## ART-012B — Discogs artist search/detail basisimplementatie

Status: geïmplementeerd als inspect-only basis.

Gerealiseerd:

- Discogs configstatus endpoint.
- Discogs artist search endpoint.
- Discogs artist detail endpoint.
- Frontendkaart **Discogs artist enrichment** in het relatiepaneel.
- Voorbereidende migratie voor:
  - `artist_external_reference`
  - `artist_enrichment_cache`
  - `artist_external_image`

Niet in scope:

- Discogs-resultaat koppelen aan lokale artist.
- Lokale artistvelden verrijken/toepassen.
- Aliases/name variations naar `artiesten_spelling` schrijven.
- Image download/cache.

Vervolg:

- ART-012C — Discogs artist koppelen aan lokale artist + enrichment-cache vullen.

## ART-012B-Fix-1 — Discogs resultatenpaneel responsive maken en env-template hardenen

Status: uitgevoerd.

Bevinding: in het paneel **Discogs artist enrichment** was de resultatenweergave te smal; de kolom **Actie** en knop **Detail** vielen deels buiten beeld. Daarnaast moest `.env.example` definitief worden geborgd met de actuele Discogs-, image-cache- en duplicate-scanner variabelen.

Oplossing:
- Discogs-kaart full-width binnen het relatiegrid.
- Scroll-safe resultatenwrapper met extra padding.
- Vaste minimale breedte voor actiekolom en detailknop.
- Lange artiestnamen mogen wrappen.
- `.env.example` en `env-refresh-example.sh` bevatten de volledige canonieke env-set.

## ART-012C — Discogs artist koppelen aan lokale artist

Status: geïmplementeerd in deze release.

Functioneel:
- gebruiker inspecteert een Discogs artist-detail en kiest daarna bewust **Koppel Discogs artist**;
- lokale `artist.ar_artist_key` blijft leidend en wordt nooit vervangen door Discogs ID;
- lokale artistnaam wordt niet automatisch overschreven;
- gekoppelde Discogs-referentie wordt zichtbaar in het relatiepaneel.

Technisch:
- `POST /api/artists/:id/discogs/link`;
- opslag in `artist_external_reference`, `artist_enrichment_cache` en `artist_external_image`;
- image-opslag blijft metadata/URL-only; geen binaire bestanden in PostgreSQL.

Vervolgitems:
- ART-012D: Discogs-data toepassen via review/accept-flow;
- ART-012E: aliases/name variations als voorstel voor `artiesten_spelling`;
- ART-012F: image-cache/download optioneel uitwerken.

## ART-012C-Fix-1 — Discogs link persistence en geboortedatum/overlijdensdatum

Status: geïmplementeerd.

- Koppelen schrijft naar `artist_external_reference`, `artist_enrichment_cache` en `artist_external_image`.
- Optionele auditlogging gebruikt een savepoint zodat ontbrekende `admin_audit_log` de Discogs-koppeling niet terugdraait.
- Gestructureerde Discogs-datums kunnen lokale lege velden `ar_artist_dateofbirth` en `ar_artist_passing` vullen.
- Vrije profieltekst wordt niet automatisch geparsed voor datums.


## ART-012C-Fix-2 — Runbook querycorrectie en koppelresultaat

- Controlequery voor `artist_enrichment_cache` gebruikt `fetched_at`, niet `synced_at`.
- Documentatie verduidelijkt welke drie tabellen worden gevuld na **Koppel Discogs artist**.
- Geen nieuwe SQL-migratie nodig.

## ART-012C-Fix-3 — Discogs naamvoorstel en artiestenspelling-documentatie

Status: uitgevoerd.

Doel: borgen dat Discogs artist names alleen voorstellen zijn en nooit direct `artist.ar_artist_name` overschrijven.

Scope:

- Documentatie aanscherpen: Discogs-naam is voorstel, geen directe overwrite.
- UI-tekst verduidelijken in het Discogs-koppelpaneel.
- Vastleggen dat canonical naamwijzigingen via een spelling-aware flow met `artiesten_spelling` moeten lopen.
- Contracttest toevoegen.

## ART-012D — Discogs naamvoorstellen en artiestenspelling toepassen

Status: functioneel/technisch uitgewerkt; code nog niet gebouwd.

Doel: Discogs-data gebruiken als voorstellen voor `artiesten_spelling` en eventueel canonical artist name-wijzigingen, zonder lokale artistnamen automatisch te overschrijven.

Scope ontwerp:

- Discogs-naam toevoegen als alternatieve spelling.
- Discogs-naam voorstellen als nieuwe canonical naam.
- Oude canonical naam behouden als alternatieve spelling.
- Conflicten op `artiesten_spelling.as_alternatieve_spelling` controleren.
- Wijziging expliciet laten bevestigen en auditen.
- Aliases/name variations uit Discogs als spellingvoorstellen tonen.
- Canonical rename uitvoeren als transactionele spelling-aware flow.

Aanbevolen vervolg:

- ART-012D-1: spellingvoorstellen ophalen en tonen, nog geen mutaties.
- ART-012D-2: Discogs naam toevoegen als alternatieve spelling.
- ART-012D-3: canonical rename via spelling-aware transactie.
- ART-012D-4: aliases/name variations reviewqueue/persistent proposals.


## ART-012D-1 — Discogs spellingvoorstellen tonen zonder mutaties

Status: geïmplementeerd.

De Artiesten-app kan voor een gekoppelde Discogs artist read-only naamvoorstellen tonen uit:

- Discogs artist name;
- real name;
- aliases;
- name variations.

De voorstellen worden geclassificeerd als bestaand, beschikbaar of conflict met een andere artist key. Deze sprint voert geen wijzigingen uit op `artist` of `artiesten_spelling`.

Vervolg:

- ART-012D-2 — Discogs naam toevoegen als alternatieve spelling.
- ART-012D-3 — Discogs naam canonical maken via spelling-aware transactie.
- ART-012D-4 — aliases/name variations als persistent reviewqueue.

## ART-012D-2 — Discogs naam toevoegen als alternatieve spelling

Status: uitgevoerd in deze sprint.

Scope:
- beschikbare Discogs-spellingvoorstellen kunnen transactioneel worden toegevoegd aan `artiesten_spelling`;
- `artist.ar_artist_name` blijft ongewijzigd;
- conflicten met bestaande spellingen of andere artists worden geblokkeerd;
- UI toont actie **Voeg toe als spelling** voor toepasbare voorstellen.

Niet in scope:
- canonical rename;
- bulk toevoegen van aliases/name variations;
- automatische merge.


## ART-012D-3 — Discogs naam canonical maken via spelling-aware transactie

**Prioriteit:** middel  
**Status:** functioneel/technisch uitgewerkt, nog geen implementatie

Een Discogs artist name mag later als nieuwe lokale canonical artist name worden voorgesteld, maar alleen via een expliciete spelling-aware flow. De actie **Koppel Discogs artist** blijft gescheiden van canonical rename en wijzigt nooit `artist.ar_artist_name`.

Scope ontwerp:

- preview van oude versus nieuwe canonical naam;
- oude canonical naam behouden/toevoegen als alternatieve spelling;
- nieuwe canonical naam borgen in `artiesten_spelling`;
- conflictcontrole op `artist.ar_artist_name`;
- conflictcontrole op `artiesten_spelling.as_alternatieve_spelling`;
- één database-transactie met rollback;
- audit/history van naamwijziging;
- geen automatische tekstuele update van `file_details.fd_correct_artist` of historische stagingvelden.

Aanbevolen vervolg:

- ART-012D-3A — canonical rename preview implementeren, nog geen mutaties.
- ART-012D-3B — spelling-aware canonical rename uitvoeren.
- ART-012D-4 — aliases/name variations persistent als reviewqueue beheren.


## ART-012D-2-Fix-1 — Actieknop voor beschikbare spellingvoorstellen

Bij Discogs naamvoorstellen moet de actie **Voeg toe als spelling** zichtbaar zijn voor voorstellen met `available_discogs_name` en `available_alternative_spelling`. De knop schrijft alleen naar `artiesten_spelling`; `artist.ar_artist_name` blijft ongewijzigd. Niet-toepasbare voorstellen tonen een duidelijke niet-toepasbaar-status.

## ART-012D-3A — Canonical rename preview — Afgerond

- Preview voor Discogs canonical rename toegevoegd.
- Geen mutaties op `artist` of `artiesten_spelling`.
- Conflictcontrole op bestaande artist name en `artiesten_spelling.as_alternatieve_spelling`.
- UI-actie **Preview canonical** toegevoegd.

## ART-012D-3B — Canonical rename uitvoeren — Open

- Spelling-aware canonical rename uitvoeren in één transactie.
- Oude canonical naam behouden als alternatieve spelling.
- Nieuwe canonical naam borgen in `artiesten_spelling`.
- Auditlogging toevoegen.
- Conflicten blokkeren of expliciet laten oplossen.


### ART-012D-3A-Fix-1 — Discogs spellingvoorstellen UX-verduidelijking — Afgerond

De UI maakt nu expliciet dat spellingvoorstellen pas beschikbaar zijn nadat een Discogs artist gekoppeld is. Na koppeling wordt de gebruiker naar **Toon spellingvoorstellen** geleid. De acties **Voeg toe als spelling** en **Preview canonical** zijn verduidelijkt en blijven gescheiden van de Discogs-koppeling.

## ART-012D-3B — Canonical rename uitvoeren via spelling-aware transactie — uitgevoerd

Discogs canonical rename is nu uitvoerbaar na een niet-geblokkeerde preview. De actie is transactioneel en borgt zowel de oude als de nieuwe canonical naam in `artiesten_spelling`. `file_details.fd_correct_artist` en historische stagingteksten worden niet automatisch herschreven.

## ART-012E-1 — Discogs gekoppeld-indicatie en artist type — uitgevoerd

Deze sprint voegt een kleine basis voor gecontroleerde Discogs-verrijking toe:

- Discogs gekoppeld-indicatie in de artiestentabel met `<i class="bi bi-link"></i>`;
- backendveld `has_discogs_link` op basis van `artist_external_reference`;
- nieuw veld `artist.ar_artist_type` met waarden `unknown`, `person`, `duo`, `trio`, `group`, `band`, `alias`, `project`;
- artist type zichtbaar in lijst/relatiepaneel en bewerkbaar in edit-scherm.

Niet in scope voor deze sprint: enrichment proposals, profielfoto kiezen, datumextractie en apply-acties. Deze volgen in ART-012E-2/3/4.


## ART-012E-1-Fix-2 — Discogs link-icoon direct zichtbaar na koppelen

Na succesvolle Discogs-koppeling houdt de frontend de gekoppelde artist key optimistisch bij, zodat `<i class="bi bi-link"></i>` direct in de artiestentabel verschijnt zonder handmatige browserrefresh. De serverrefresh blijft behouden; na browserrefresh blijft de databasekoppeling leidend.

## ART-012E-2 — Discogs profielfoto uit images

Status: opgeleverd in kleine testbare sprint.

Functionele scope:

- Toon Discogs images bij een gekoppelde artiest.
- Laat gebruiker één image als primaire profielfoto kiezen.
- Gebruik bestaand veld `artist_external_image.is_primary`.
- Voeg technische borging toe dat per artiest maximaal één primaire image bestaat.
- Geen lokale image-cache download in deze sprint.

## ART-012E-3 — Discogs enrichment proposals read-only preview

Status: opgeleverd voor test.

Scope:

- persistente proposal-tabel `artist_enrichment_proposals`;
- Discogs-cache analyseren voor read-only verrijkingsvoorstellen;
- profieltekstextractie voor geboorte-/sterfdatum als voorstel;
- artist type voorstel;
- UI-paneel in relatie-inzicht;
- geen apply-acties.

Vervolg: ART-012E-4 apply-acties en reviewstatussen.

## ART-012E-4 — Discogs enrichment proposals toepassen

Status: opgeleverd ter test.

Scope:
- apply-acties voor veilige verrijkingsvoorstellen;
- statusacties `ignored` en `review_later`;
- externe profieltekst in `artist_external_profile`;
- confirm-overwrite bij conflicten;
- onvolledige datums niet toepassen op artist date-velden.

Vervolg:
- ART-012D-4 persistente aliases/name variations reviewqueue;
- ART-012E vervolg hardening voor filters/statusoverzicht indien nodig.


## ART-012E-4-Fix-1 — Apply refresh artist-state

Na het toepassen van een verrijkingsvoorstel gebruikt de frontend de actuele `artist` uit de apply-response om de artiestentabel, geselecteerde artiest, relatie-inzicht en eventueel geopende detailcontext direct bij te werken. Voor `artist_external_profile.profile_text` wordt expliciet gemeld dat dit externe profieldata is en dat de lokale `artist`-tabel daarbij niet wijzigt.

## Afgerond — ART-012E-4-Fix-6 Nederlandse datumweergave

- Geboorte- en sterfdatum in schermweergave omgezet naar Nederlands formaat `dd-mm-jjjj`.
- Opslag/API blijft `YYYY-MM-DD`.
- Edit-formulier blijft native HTML date input gebruiken.

## ART-012D-4 — Discogs naamvoorstellen reviewqueue

Status: uitgewerkt in deze release.

Persistente reviewqueue voor Discogs aliases/name variations, real names en Discogs artist names. Voorstellen kunnen worden gegenereerd, later beoordeeld, genegeerd of toegevoegd als alternatieve spelling. Canonical rename blijft buiten scope en loopt via de bestaande spelling-aware flow.

## ART-UI-1A — Detail/edit UX foundation — opgeleverd

- Edit-modal verbreed.
- Eerste paneelnavigatie onder de artiestentabel toegevoegd.
- Scrollgedrag van het relatiepaneel voorspelbaarder gemaakt.
- Discogs-profieltekst read-only zichtbaar gemaakt vanuit `artist_external_profile`.

Vervolgitems blijven open:

- onderzoeken of edit uiteindelijk een eigen scherm moet worden;
- bepalen of er een lokale biografie naast externe profieltekst nodig is;
- verdere UX-uitwerking voor tabs/accordion en paneelvolgorde.

## Afgerond — ART-UI-Date-1 Datepicker bij Nederlandse datum-invoer

- Datepicker-ondersteuning teruggebracht in het artist edit-scherm.
- Zichtbare invoer blijft `dd-mm-jjjj`.
- Handmatig invoeren van oude datums zoals `12-03-1947` blijft mogelijk.
- API/database blijven `YYYY-MM-DD`.
- Geen database-migratie nodig.

## ART-013A — One-way artist → musician sync

Status: uitgewerkt in deze release.

Doel: dubbele onderhoudslast voorkomen wanneer een `artist` ook een bestaande gekoppelde `musician` representeert.

Ontwerpbesluit:

- synchronisatie is alleen `artist → musician`;
- nooit bidirectioneel;
- alleen bij `UPDATE` van een bestaande `artist`;
- alleen als `artist.ar_artist_type = 'person'`;
- alleen als `musician.ar_artist_key = artist.ar_artist_key` al bestaat;
- geen automatische musician-aanmaak;
- geen synchronisatie bij delete, merge of deactiveren;
- musician blijft bestaan zodat historische bandrelaties via `musician_in_band` intact blijven.

Gesynchroniseerde velden: naam, geboortedatum, sterfdatum en website. Notes, favoriet-status, Discogs-data en merge/delete-status worden niet gesynchroniseerd.


ART-013A ontwerpnotitie: er is geen automatische aanmaak van musician-records.

---

## ART-013A-1 — Idempotente musician backfill vanuit person artists

Status: opgeleverd in `artist-art013a1-musician-backfill-20260609.zip`.

### Doel

De `musician`-tabel kan leeg zijn terwijl ART-013A alleen bestaande gekoppelde musicians synchroniseert. ART-013A-1 vult ontbrekende musicians vanuit artists met `ar_artist_type = 'person'`.

### Regels

- Alleen `person` artists worden meegenomen.
- Alleen artists zonder gekoppelde musician worden toegevoegd.
- Gekoppeld betekent: `musician.ar_artist_key = artist.ar_artist_key`.
- Backfill is idempotent en kan periodiek worden uitgevoerd.
- Bestaande musicians worden niet overschreven.
- Geen automatische aanmaak via trigger.
- Geen bidirectionele sync.
- Geen delete- of merge-sync.

### Scripts

```bash
mkdir -p logs && npm run db:migrate:art013a1 2>&1 | tee "logs/db-migrate-art013a1-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run musician:backfill:preview 2>&1 | tee "logs/musician-backfill-preview-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run musician:backfill 2>&1 | tee "logs/musician-backfill-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs && npm run test:art013a1 2>&1 | tee "logs/test-art013a1-$(date +%Y%m%d-%H%M%S).log"
```

---

## ART-013A-2 — Artist/Musician databasevalidatie en backfill-hardening

**Prioriteit:** hoogste eerstvolgende sprint  
**Status:** functioneel en technisch uitgewerkt; nog te implementeren

### Doel

De reeds opgeleverde ART-013A-trigger en ART-013A-1-backfill veilig en aantoonbaar valideren tegen de werkelijke Docker/PostgreSQL-database voordat nieuwe relationele functionaliteit wordt toegevoegd.

### Scope

- read-only preflight;
- schema-, kolom-, datatype- en constraintchecks;
- duplicate-link-detectie vóór unique index;
- blocker/warning/info-classificatie;
- veilige migratieguard;
- verbeterde preview en execute-summary;
- `npm run musician:verify`;
- idempotentiecontrole;
- geïsoleerde database-integratietests;
- productieguard en cleanup;
- logging en packaging-hardening.

### Acceptatiekern

- preflight meldt nul onverwachte blockers;
- migratie en backfill slagen op Docker PostgreSQL;
- tweede backfill-run voegt nul records toe;
- person-update synchroniseert gekoppelde musician;
- band/group en ongekoppelde person veroorzaken geen sync/insert;
- musician→artist bestaat niet;
- delete/merge/deactiveren verwijdert musician niet;
- verificatie meldt geen onverwachte duplicates, missing links of orphans;
- release-ZIP bevat geen secrets, runtime-artifacts of macOS metadata.

Zie:

- `docs/ART_013A_2_Databasevalidatie_Backfill_Hardening_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_013A_2_Testcases_en_Runbook.md`

## Bevestigde vervolgvolgorde

1. ART-013A-2 implementeren en functioneel accepteren.
2. ART-UI-Polish: profielfoto-thumbnail en overleden-indicator.
3. ART-012D-4 volledig functioneel valideren en eventuele fixes uitvoeren.
4. ART-013B: `musician_in_band` uitbreiden met rol, periode en bron.
5. Lokale bewerkbare biografie ontwerpen naast externe profieltekst en beheer-notities.
6. ART-014 album/release/track-datamodel.


## ART-013A-2 — Databasevalidatie en backfill-hardening (2026-07-11)

Status: **geïmplementeerd; lokale database-acceptatie open**.

Opgeleverd: centrale preflight, geharde migratie, veilige preview/execute, verificatie, transactionele database-integratietest, contracttests en bijgewerkt runbook. De eerstvolgende afgesproken volgorde na acceptatie blijft: ART-UI-Polish, ART-012D-4 validatie/fixes, ART-013B, lokale biografie en ART-014.

## Backlogupdate 2026-07-11 — afgesproken vervolgvolgorde

### ART-013A-2 — Artist/Musician databasevalidatie en backfill-hardening

**Prioriteit:** afgerond  
**Status:** geïmplementeerd en functioneel gevalideerd

De database-integratietest is succesvol uitgevoerd. De tijdelijke verschillen tussen before/after worden veroorzaakt door drie transactionele test-artists en één transactionele test-musician. De test eindigt met rollback en `leftovers=0`.

### ART-UI-POLISH-1 — Profielfoto-thumbnail en overleden-indicator — OPGELEVERD 2026-07-11

**Prioriteit:** eerstvolgende sprint  
**Status:** functioneel en technisch uitgewerkt; code nog te ontwikkelen

Doel:

- kleine primaire profielfoto helemaal links in de artiestenlijst;
- lokale fallback bij ontbrekende of defecte image;
- overleden-indicator `bi-hourglass-bottom` wanneer `ar_artist_passing` gevuld is;
- tooltip en toegankelijke tekst `Artiest overleden`;
- geen vergroting van tabelrijhoogte;
- geen N+1-query of API-request per rij;
- directe lijstrefresh na wijzigen van de primaire Discogs-image;
- regressiebescherming voor zoeken, sorteren, filters, paginering, rijselectie, favorieten, Discogs-indicator en embedded Shellstarter-layout.

Ontwerpdocumenten:

- `docs/ART_UI_POLISH_1_Thumbnail_Overleden_Indicator_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_UI_POLISH_1_Testcases_en_Runbook.md`
- `docs/ART_UI_POLISH_1_Sprint_Manifest.md`

### Vervolg na ART-UI-POLISH-1

1. ART-012D-4 volledig functioneel valideren en eventuele fixes uitvoeren.
2. ART-013B `musician_in_band` uitbreiden met rol, periode en bron.
3. Lokale redactionele biografie ontwerpen.
4. ART-014 album-, release- en trackdatamodel uitwerken.

---

## ART-012D-4-VAL-1 — Discogs naamvoorstellen reviewqueue validatie en hardening

**Status:** functioneel en technisch uitgewerkt; gereed voor codesprint.  
**Prioriteit:** eerstvolgende backlogitem na acceptatie ART-UI-POLISH-1.

### Doel

De bestaande persistente reviewqueue operationeel afronden met aantoonbare idempotentie, volledige statusovergangen, live conflictcontrole, transactionele apply, concurrencybescherming en echte PostgreSQL-/Chromium-tests.

### Scope codesprint

- centrale naamnormalisatie en deduplicatie;
- generation summary met verklaarbare tellers;
- expliciete status-transition policy;
- stabiele API-foutcodes;
- apply met live conflictcontrole en rollback;
- preflight en verify;
- transactionele database-integratietest met `leftovers=0`;
- frontend action-state, stale-state feedback en gerichte refresh;
- contract-, component-, PostgreSQL- en Chromium-tests;
- 84 functionele testcase-ID's als traceabilitybasis.

### Buiten scope

- canonical rename vanuit de queue;
- bulkacties;
- automatische merge of acceptatie;
- nieuwe externe bronnen;
- generieke conflictresolver.

### Documentatie

- `docs/ART_012D_4_VAL_1_Reviewqueue_Validatie_Hardening_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_012D_4_VAL_1_Testcases_en_Runbook.md`
- `docs/ART_012D_4_VAL_1_Sprint_Manifest.md`

### Vervolg na acceptatie

1. ART-013B musician-in-band relatieverrijking;
2. lokale biografie ontwerpen;
3. ART-014 album-, release- en trackmodel.

### Afgerond — ART-012D-4-VAL-1

- Reviewqueue functioneel en technisch gehard.
- Resterende lokale acceptatie: Docker PostgreSQL-integratietest en Chromium-hoofdflow uitvoeren.
- Volgende geplande sprint: ART-013B musician-in-band relatieverrijking.

---

## ART-013B-1 — Musician-in-band handmatig relatiebeheer

**Status:** functioneel en technisch uitgewerkt; gereed voor codesprint.  
**Prioriteit:** eerstvolgende sprint na ART-012D-4-VAL-1.

### Doel

De bestaande tabel `musician_in_band` bruikbaar maken voor volledig handmatig relatiebeheer binnen de Artiesten-app.

### Scope

- bandleden tonen en beheren vanuit bandcontext;
- bands/groepen tonen vanuit persoonscontext;
- musician handmatig koppelen aan band;
- rol, periode, bron en opmerkingen beheren;
- incomplete historische periodes ondersteunen;
- duplicaten blokkeren en overlap waarschuwen;
- veilige update/delete en concurrencybescherming;
- modulair backend- en frontendfeature-domein;
- 88 traceerbare functionele testcases.

### Architectuur

- geen aparte app of container;
- `musician_in_band` blijft lokale waarheid;
- volledige handmatige invoer is leidend;
- externe providers volgen later: Discogs → MusicBrainz → Wikidata;
- providers leveren proposals en schrijven nooit direct naar `musician_in_band`.

### Documentatie

- `docs/ART_013B_1_Musician_In_Band_Handmatig_Relatiebeheer_Functioneel_Technisch_Ontwerp.md`
- `docs/ART_013B_1_Testcases_en_Runbook.md`
- `docs/ART_013B_1_Sprint_Manifest.md`

### Vervolg

1. ART-013B-2 Discogs members/groups proposals;
2. ART-013B-3 MusicBrainz aanvulling;
3. ART-013B-4 Wikidata verificatie;
4. lokale biografie;
5. ART-014 album-, release- en trackmodel.


## ART-013B-1 implementatiestatus — 2026-07-12

De concrete codesprint is opgeleverd. Handmatig beheer is modulair geïntegreerd in het Relatie-inzicht. De bestaande tabel `musician_in_band` blijft lokale waarheid. Preflight, migratie, verificatie, API, frontendfeature, duplicate/overlap/stale bescherming en automatische contracttests zijn aanwezig. Externe providers blijven vervolgscope: Discogs primair, MusicBrainz aanvullend, Wikidata daarna.

### ART-013B-1-Fix-1 — centrale `.env`-loading
Status: opgelost in vervangende oplevering. Alle ART-013B-1 databasecommando's volgen nu de bestaande `ARTIST_DB_*`-configuratie.
