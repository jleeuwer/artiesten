# Artiesten-app Backlog

Laatste bijgewerkt: 2026-05-18

## Status

De Artiesten-app is een zelfstandige React/Express/PostgreSQL-app die ook embedded binnen Shellstarter kan draaien. De huidige werkende basis bevat de BL-044 Sprint 4 hardening voor embedded spacing, shell theme contract, trash/restore en hard delete beveiliging. Sprint 5 heeft de release-hygiëne, env-samples, README, centrale backlog en projectnotities hersteld.

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
- Packaging-hygiëne aangescherpt: `.env` hoort niet in release-ZIP; `.sample.env` en `.env.example` zijn gevuld.
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
- Wel `.sample.env` en `.env.example`.
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

Aanleiding: `tests/packaging.contract.test.mjs` faalde lokaal omdat `.sample.env` leeg was en daardoor `PORT=3012` ontbrak. Daarnaast sloot het eerder gedocumenteerde lokale `psql "$DATABASE_URL"` voorbeeld niet aan op de gebruikelijke Docker PostgreSQL configuratie.

Oplossing:

- `.sample.env` en `.env.example` gevuld met dezelfde veilige voorbeeldconfiguratie.
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
