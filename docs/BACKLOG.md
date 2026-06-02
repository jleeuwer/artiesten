# Artiesten-app Backlog

Laatste bijgewerkt: 2026-05-19

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
